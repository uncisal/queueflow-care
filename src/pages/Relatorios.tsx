import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Home, LogOut, TrendingUp, Clock, Users, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const COLORS = ["#1E88E5", "#43A047", "#E53935", "#FB8C00", "#8E24AA"];

const RelatoriosContent = () => {
  const [stats, setStats] = useState<any>({
    total: 0,
    waiting: 0,
    completed: 0,
    avgWaitTime: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    // Stats gerais
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*, categories(name, color, prefix)");

    if (!tickets) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTickets = tickets.filter(
      (t) => new Date(t.created_at) >= today
    );

    // Tempo médio de espera
    const completedToday = todayTickets.filter((t) => t.status === "completed");
    const avgWaitMs = completedToday.reduce((acc, t) => {
      const wait = new Date(t.called_at).getTime() - new Date(t.created_at).getTime();
      return acc + wait;
    }, 0) / (completedToday.length || 1);

    setStats({
      total: todayTickets.length,
      waiting: todayTickets.filter((t) => t.status === "waiting").length,
      completed: completedToday.length,
      avgWaitTime: Math.round(avgWaitMs / 60000), // em minutos
    });

    // Dados por categoria
    const categoryMap = new Map();
    todayTickets.forEach((ticket) => {
      const catName = ticket.categories.name;
      const current = categoryMap.get(catName) || { name: catName, value: 0, color: ticket.categories.color };
      current.value++;
      categoryMap.set(catName, current);
    });

    setCategoryData(Array.from(categoryMap.values()));

    // Dados por hora
    const hourMap = new Map();
    for (let h = 7; h <= 18; h++) {
      hourMap.set(h, { hour: `${h}:00`, senhas: 0 });
    }

    todayTickets.forEach((ticket) => {
      const hour = new Date(ticket.created_at).getHours();
      if (hourMap.has(hour)) {
        const current = hourMap.get(hour)!;
        current.senhas++;
      }
    });

    setHourlyData(Array.from(hourMap.values()));
  };

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
          <Link to="/operador">
            <Button variant="outline">Operador</Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline">Administração</Button>
          </Link>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios e Métricas</h1>
          <p className="text-muted-foreground">
            Acompanhamento de desempenho do sistema
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hoje</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-secondary flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-3xl font-bold">{stats.waiting}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-3xl font-bold">{stats.avgWaitTime}min</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Senhas por Hora</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="senhas" stroke="#1E88E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Distribuição por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Performance por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Senhas Emitidas">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

const Relatorios = () => {
  return (
    <ProtectedRoute>
      <RelatoriosContent />
    </ProtectedRoute>
  );
};

export default Relatorios;
