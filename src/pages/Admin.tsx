import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, LogOut, Save, Plus, Trash2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.enum(["operador", "supervisor", "administrador"]),
});

interface Category {
  id: string;
  name: string;
  prefix: string;
  color: string;
  priority_enabled: boolean;
  active: boolean;
}

const AdminContent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    prefix: "",
    color: "#1E88E5",
    priority_enabled: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "operador" as "operador" | "supervisor" | "administrador",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name || !newCategory.prefix) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("categories").insert({
      name: newCategory.name,
      prefix: newCategory.prefix.toUpperCase(),
      color: newCategory.color,
      priority_enabled: newCategory.priority_enabled,
      active: true,
    });

    if (error) {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Categoria criada!",
    });

    setNewCategory({
      name: "",
      prefix: "",
      color: "#1E88E5",
      priority_enabled: false,
    });
    setDialogOpen(false);
    fetchCategories();
  };

  const handleUpdateCategory = async (category: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({
        name: category.name,
        priority_enabled: category.priority_enabled,
        active: category.active,
        color: category.color,
      })
      .eq("id", category.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Categoria atualizada!",
    });
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Categoria excluída!",
    });
    fetchCategories();
  };

  const handleCreateUser = async () => {
    try {
      userSchema.parse(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: newUser.fullName,
        role: newUser.role,
      },
    });

    if (error) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Usuário criado com sucesso!",
      description: `${newUser.fullName} foi adicionado ao sistema.`,
    });

    setNewUser({
      email: "",
      password: "",
      fullName: "",
      role: "operador",
    });
    setUserDialogOpen(false);
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
          <Link to="/relatorios">
            <Button variant="outline">Relatórios</Button>
          </Link>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerencie categorias, usuários e configurações do sistema
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nome Completo</Label>
                    <Input
                      id="user-name"
                      value={newUser.fullName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, fullName: e.target.value })
                      }
                      placeholder="Ex: João Silva"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder="Ex: joao@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-password">Senha</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-role">Função</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: "operador" | "supervisor" | "administrador") =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operador">Operador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCreateUser} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Nome</Label>
                    <Input
                      id="cat-name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Ex: Atendimento Geral"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-prefix">Prefixo (1 letra)</Label>
                    <Input
                      id="cat-prefix"
                      value={newCategory.prefix}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          prefix: e.target.value.toUpperCase().slice(0, 1),
                        })
                      }
                      placeholder="Ex: F"
                      maxLength={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-color">Cor</Label>
                    <Input
                      id="cat-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, color: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cat-priority"
                      checked={newCategory.priority_enabled}
                      onCheckedChange={(checked) =>
                        setNewCategory({
                          ...newCategory,
                          priority_enabled: checked,
                        })
                      }
                    />
                    <Label htmlFor="cat-priority">Permitir senha prioritária</Label>
                  </div>

                  <Button onClick={handleSaveCategory} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Categoria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.prefix}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Prefixo: {category.prefix}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.active}
                        onCheckedChange={(checked) =>
                          handleUpdateCategory({ ...category, active: checked })
                        }
                      />
                      <Label>Ativa</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.priority_enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateCategory({
                            ...category,
                            priority_enabled: checked,
                          })
                        }
                      />
                      <Label>Prioridade</Label>
                    </div>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
};

export default Admin;
