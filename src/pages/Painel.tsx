import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Call {
  id: string;
  ticket_number: string;
  counter_location: string;
  called_at: string;
  category_color: string;
}

const Painel = () => {
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);

  useEffect(() => {
    fetchCalls();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel("calls-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
        },
        (payload) => {
          console.log("Nova chamada:", payload);
          fetchCalls();
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCalls = async () => {
    const { data, error } = await supabase
      .from("calls")
      .select(
        `
        id,
        counter_location,
        called_at,
        tickets (
          ticket_number,
          categories (
            color
          )
        )
      `
      )
      .order("called_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching calls:", error);
      return;
    }

    const formattedCalls = data.map((call: any) => ({
      id: call.id,
      ticket_number: call.tickets.ticket_number,
      counter_location: call.counter_location,
      called_at: call.called_at,
      category_color: call.tickets.categories.color,
    }));

    setCurrentCall(formattedCalls[0] || null);
    setRecentCalls(formattedCalls.slice(1, 6));
  };

  const playNotificationSound = () => {
    // Criar um som de notificação usando Web Audio API
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="p-6">
        <Link to="/">
          <Button variant="outline" size="lg">
            <Home className="mr-2 h-5 w-5" />
            Início
          </Button>
        </Link>
      </div>

      <div className="container mx-auto p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Painel de Chamadas</h1>
          <p className="text-xl text-muted-foreground">
            Acompanhe as senhas sendo chamadas
          </p>
        </div>

        {currentCall && (
          <Card className="p-12 shadow-lg border-4 border-primary animate-in fade-in">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Volume2 className="w-12 h-12 text-primary animate-pulse" />
                <h2 className="text-3xl font-bold">Chamando</h2>
              </div>

              <div
                className="text-9xl font-bold py-12 px-8 rounded-3xl mx-auto w-fit"
                style={{
                  background: currentCall.category_color,
                  color: "white",
                  textShadow: "0 4px 8px rgba(0,0,0,0.2)",
                }}
              >
                {currentCall.ticket_number}
              </div>

              <div className="space-y-2">
                <p className="text-4xl font-semibold">Dirija-se ao</p>
                <p className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {currentCall.counter_location}
                </p>
              </div>
            </div>
          </Card>
        )}

        {recentCalls.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center">Últimas Chamadas</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {recentCalls.map((call) => (
                <Card key={call.id} className="p-6 shadow-md">
                  <div className="text-center space-y-3">
                    <div
                      className="text-4xl font-bold py-4 rounded-xl"
                      style={{
                        background: call.category_color,
                        color: "white",
                      }}
                    >
                      {call.ticket_number}
                    </div>
                    <p className="text-lg font-semibold">{call.counter_location}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(call.called_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!currentCall && recentCalls.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-2xl text-muted-foreground">
              Aguardando próxima chamada...
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Painel;
