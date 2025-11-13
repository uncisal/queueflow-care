import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  prefix: string;
  color: string;
  priority_enabled: boolean;
}

const Totem = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const generateTicket = async (isPriority: boolean = false) => {
    if (!selectedCategory) return;

    setLoading(true);

    try {
      // Buscar o último número da categoria
      const { data: lastTicket } = await supabase
        .from("tickets")
        .select("ticket_number")
        .like("ticket_number", `${selectedCategory.prefix}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastTicket) {
        const lastNumber = parseInt(lastTicket.ticket_number.replace(selectedCategory.prefix, ""));
        nextNumber = lastNumber + 1;
      }

      const ticketNumber = `${selectedCategory.prefix}${String(nextNumber).padStart(3, "0")}`;

      const { error } = await supabase.from("tickets").insert({
        ticket_number: ticketNumber,
        category_id: selectedCategory.id,
        is_priority: isPriority,
        status: "waiting",
      });

      if (error) throw error;

      setGeneratedTicket(ticketNumber);
      toast({
        title: "Senha Gerada!",
        description: `Sua senha é: ${ticketNumber}`,
      });

      setTimeout(() => {
        setGeneratedTicket(null);
        setSelectedCategory(null);
      }, 5000);
    } catch (error) {
      console.error("Error generating ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a senha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (generatedTicket) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center space-y-8 shadow-lg">
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
              <UserCheck className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold">Senha Gerada!</h2>
            <div className="text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent py-8">
              {generatedTicket}
            </div>
            <p className="text-xl text-muted-foreground">
              Aguarde ser chamado no painel
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <Link to="/totem">
            <Button variant="outline" size="lg" onClick={() => setSelectedCategory(null)}>
              Voltar
            </Button>
          </Link>

          <Card className="p-12 text-center space-y-8 shadow-lg">
            <div>
              <h2 className="text-3xl font-bold mb-4">{selectedCategory.name}</h2>
              <p className="text-lg text-muted-foreground">
                Selecione o tipo de atendimento
              </p>
            </div>

            <div className="grid gap-6">
              <Button
                size="lg"
                className="h-24 text-2xl"
                style={{ background: selectedCategory.color }}
                onClick={() => generateTicket(false)}
                disabled={loading}
              >
                Atendimento Normal
              </Button>

              {selectedCategory.priority_enabled && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-24 text-2xl"
                  onClick={() => generateTicket(true)}
                  disabled={loading}
                >
                  Atendimento Prioritário
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <div className="p-6">
        <Link to="/">
          <Button variant="outline" size="lg">
            <Home className="mr-2 h-5 w-5" />
            Início
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-6xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold">Bem-vindo</h1>
            <p className="text-2xl text-muted-foreground">
              Selecione o tipo de atendimento desejado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="p-8 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="text-center space-y-4">
                  <div
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
                    style={{ background: category.color }}
                  >
                    {category.prefix}
                  </div>
                  <h3 className="text-xl font-bold">{category.name}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Totem;
