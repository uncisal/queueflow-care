import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monitor, Users, Tv } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sistema de Gerenciamento de Filas
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Solução completa para gestão de atendimento em recepções hospitalares e serviços públicos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/totem" className="group">
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary h-full">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Monitor className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Totem</h3>
                  <p className="text-muted-foreground">
                    Interface de autoatendimento para retirada de senhas
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/painel" className="group">
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary h-full">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Tv className="w-8 h-8 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Painel de Chamadas</h3>
                  <p className="text-muted-foreground">
                    Display para TVs com chamadas em tempo real
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/operador" className="group">
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary h-full">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Dashboard Operador</h3>
                  <p className="text-muted-foreground">
                    Controle completo das filas e chamadas
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3">Recursos do Sistema</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Geração automática de senhas por categoria</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Sistema de prioridades (idosos, gestantes, PCD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Atualizações em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Histórico completo de atendimentos</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3">Categorias Disponíveis</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#1E88E5]">A</span>
                <span>Cadastro / Recepção</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#43A047]">B</span>
                <span>Triagem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#E53935]">C</span>
                <span>Atendimento Médico</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#FB8C00]">D</span>
                <span>Exames</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#8E24AA]">E</span>
                <span>Serviços Administrativos</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
