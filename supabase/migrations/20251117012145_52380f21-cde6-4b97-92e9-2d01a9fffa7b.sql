-- Fix generate_ticket_number function to avoid FOR UPDATE with aggregate functions
-- Use advisory lock instead to prevent race conditions

CREATE OR REPLACE FUNCTION public.generate_ticket_number(p_category_id uuid, p_prefix text, p_is_priority boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_last_num integer;
  v_ticket_number text;
  v_lock_key bigint;
BEGIN
  -- Create a lock key based on the prefix (convert prefix to a number)
  v_lock_key := hashtext(p_prefix);
  
  -- Acquire advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Get the last ticket number for this prefix (no FOR UPDATE needed with advisory lock)
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM LENGTH(p_prefix) + 1) AS integer)), 0)
  INTO v_last_num
  FROM tickets
  WHERE ticket_number LIKE p_prefix || '%';
  
  -- Generate new ticket number
  v_ticket_number := p_prefix || LPAD((v_last_num + 1)::text, 3, '0');
  
  -- Insert new ticket
  INSERT INTO tickets (ticket_number, category_id, is_priority, status)
  VALUES (v_ticket_number, p_category_id, p_is_priority, 'waiting');
  
  RETURN v_ticket_number;
  
  -- Advisory lock is automatically released at end of transaction
END;
$function$;