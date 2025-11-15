-- Fix INPUT_VALIDATION: Create secure ticket number generation function with proper locking
CREATE OR REPLACE FUNCTION public.generate_ticket_number(
  p_category_id uuid,
  p_prefix text,
  p_is_priority boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_num integer;
  v_ticket_number text;
BEGIN
  -- Use row-level locking to prevent race conditions
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM LENGTH(p_prefix) + 1) AS integer)), 0)
  INTO v_last_num
  FROM tickets
  WHERE ticket_number LIKE p_prefix || '%'
  FOR UPDATE;
  
  v_ticket_number := p_prefix || LPAD((v_last_num + 1)::text, 3, '0');
  
  INSERT INTO tickets (ticket_number, category_id, is_priority, status)
  VALUES (v_ticket_number, p_category_id, p_is_priority, 'waiting');
  
  RETURN v_ticket_number;
END;
$$;