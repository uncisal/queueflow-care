import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrintRequest {
  ticketNumber: string;
  categoryName: string;
  categoryPrefix: string;
  isPriority: boolean;
  timestamp: string;
}

// Gera comandos ESC/POS para impressora térmica
function generateESCPOS(data: PrintRequest): Uint8Array {
  const ESC = 0x1B;
  const GS = 0x1D;
  
  const commands: number[] = [
    ESC, 0x40, // Inicializar impressora
    ESC, 0x61, 0x01, // Centralizar texto
    ESC, 0x45, 0x01, // Negrito ON
    GS, 0x21, 0x11, // Tamanho duplo
  ];
  
  // Nome da empresa/sistema
  const header = "SISTEMA DE SENHAS\n";
  commands.push(...Array.from(new TextEncoder().encode(header)));
  
  commands.push(
    ESC, 0x45, 0x00, // Negrito OFF
    GS, 0x21, 0x00, // Tamanho normal
  );
  
  commands.push(...Array.from(new TextEncoder().encode("\n")));
  
  // Categoria
  const categoryText = `Categoria: ${data.categoryName}\n`;
  commands.push(...Array.from(new TextEncoder().encode(categoryText)));
  
  commands.push(...Array.from(new TextEncoder().encode("\n")));
  
  // Número da senha (grande)
  commands.push(
    ESC, 0x45, 0x01, // Negrito ON
    GS, 0x21, 0x22, // Tamanho triplo
  );
  
  const ticketText = `${data.ticketNumber}\n`;
  commands.push(...Array.from(new TextEncoder().encode(ticketText)));
  
  commands.push(
    GS, 0x21, 0x00, // Tamanho normal
    ESC, 0x45, 0x00, // Negrito OFF
  );
  
  commands.push(...Array.from(new TextEncoder().encode("\n")));
  
  // Prioridade
  if (data.isPriority) {
    commands.push(
      ESC, 0x45, 0x01, // Negrito ON
    );
    const priorityText = "*** ATENDIMENTO PRIORITÁRIO ***\n";
    commands.push(...Array.from(new TextEncoder().encode(priorityText)));
    commands.push(
      ESC, 0x45, 0x00, // Negrito OFF
    );
    commands.push(...Array.from(new TextEncoder().encode("\n")));
  }
  
  // Data e hora
  const dateText = `${new Date(data.timestamp).toLocaleString('pt-BR')}\n`;
  commands.push(...Array.from(new TextEncoder().encode(dateText)));
  
  commands.push(...Array.from(new TextEncoder().encode("\n\n")));
  
  // Mensagem final
  const footer = "Aguarde ser chamado\n";
  commands.push(...Array.from(new TextEncoder().encode(footer)));
  
  commands.push(...Array.from(new TextEncoder().encode("\n\n\n")));
  
  // Cortar papel
  commands.push(GS, 0x56, 0x00);
  
  return new Uint8Array(commands);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const printData: PrintRequest = await req.json();
    
    console.log('Gerando comandos de impressão para:', printData.ticketNumber);

    // Gera comandos ESC/POS
    const escposCommands = generateESCPOS(printData);
    
    // Busca configuração da impressora
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'printer_config')
      .single();

    const printerConfig = settings?.value as { ip?: string; port?: number; enabled?: boolean } || {};
    
    // Se impressora de rede está configurada, tenta imprimir
    if (printerConfig.enabled && printerConfig.ip) {
      try {
        const printerUrl = `http://${printerConfig.ip}:${printerConfig.port || 9100}`;
        console.log('Enviando para impressora:', printerUrl);
        
        const response = await fetch(printerUrl, {
          method: 'POST',
          body: new Blob([new Uint8Array(escposCommands)]),
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });
        
        if (response.ok) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Ticket impresso com sucesso',
              method: 'network'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('Erro ao imprimir em impressora de rede:', error);
      }
    }

    // Retorna comandos ESC/POS em base64 para aplicação local processar
    const base64Commands = btoa(String.fromCharCode(...escposCommands));
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Comandos de impressão gerados',
        method: 'escpos',
        commands: base64Commands,
        rawCommands: Array.from(escposCommands)
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Erro na função de impressão:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
