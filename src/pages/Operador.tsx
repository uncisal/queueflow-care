import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, Phone, CheckCircle, XCircle, RotateCcw, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  is_priority: boolean;
  created_at: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_prefix: string;
}

const OperadorContent = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counterLocation, setCounterLocation] = useState("Guichê 1");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchTickets();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("name");
    setCategories(data || []);
  };

  const fetchTickets = async () => {
    let query = supabase
      .from("tickets")
      .select(
        `
        *,
        categories (
          name,
          color,
          prefix
        )
      `
      )
      .in("status", ["waiting", "called"])
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tickets:", error);
      return;
    }

    const formattedTickets = data.map((ticket: any) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      status: ticket.status,
      is_priority: ticket.is_priority,
      created_at: ticket.created_at,
      category_id: ticket.category_id,
      category_name: ticket.categories.name,
      category_color: ticket.categories.color,
      category_prefix: ticket.categories.prefix,
    }));

    setTickets(formattedTickets);
  };

  const callTicket = async (ticketId: string, ticketNumber: string) => {
    if (!counterLocation.trim()) {
      toast({
        title: "Erro",
        description: "Defina o local de atendimento",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar status do ticket
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          status: "called",
          counter_location: counterLocation,
          called_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (updateError) throw updateError;

      // Registrar chamada
      const { error: insertError } = await supabase.from("calls").insert({
        ticket_id: ticketId,
        counter_location: counterLocation,
      });

      if (insertError) throw insertError;

      toast({
        title: "Senha Chamada",
        description: `${ticketNumber} - ${counterLocation}`,
      });
    } catch (error) {
      console.error("Error calling ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível chamar a senha",
        variant: "destructive",
      });
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Atendimento Concluído",
      });
    } catch (error) {
      console.error("Error completing ticket:", error);
    }
  };

  const cancelTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "cancelled" })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Senha Cancelada",
      });
    } catch (error) {
      console.error("Error cancelling ticket:", error);
    }
  };

  const waitingTickets = tickets.filter((t) => t.status === "waiting");
  const calledTickets = tickets.filter((t) => t.status === "called");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="p-6 flex items-center justify-between border-b bg-card">
        <div className="flex gap-2">
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </Link>
          <Link to="/relatorios">
            <Button variant="outline">Relatórios</Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline">Administração</Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Local de Atendimento"
            value={counterLocation}
            onChange={(e) => setCounterLocation(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard do Operador</h1>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              Todas
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background:
                    selectedCategory === cat.id ? cat.color : "transparent",
                }}
              >
                {cat.prefix}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Aguardando ({waitingTickets.length})</h2>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {waitingTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ background: ticket.category_color }}
                      >
                        {ticket.ticket_number}
                      </div>
                      <div>
                        <p className="font-semibold">{ticket.category_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                      {ticket.is_priority && (
                        <Badge variant="secondary" className="ml-2">
                          Prioritário
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => callTicket(ticket.id, ticket.ticket_number)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelTicket(ticket.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {waitingTickets.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma senha aguardando
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Em Atendimento ({calledTickets.length})</h2>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {calledTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="p-4 border-2 border-primary hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ background: ticket.category_color }}
                      >
                        {ticket.ticket_number}
                      </div>
                      <div>
                        <p className="font-semibold">{ticket.category_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                      {ticket.is_priority && (
                        <Badge variant="secondary" className="ml-2">
                          Prioritário
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => callTicket(ticket.id, ticket.ticket_number)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() => completeTicket(ticket.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelTicket(ticket.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {calledTickets.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma senha em atendimento
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Operador = () => {
  return (
    <ProtectedRoute>
      <OperadorContent />
    </ProtectedRoute>
  );
};

export default Operador;
