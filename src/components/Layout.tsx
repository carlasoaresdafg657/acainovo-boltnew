import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { 
  BarChart3, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Users, 
  Calculator,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'vendas', name: 'Vendas', icon: ShoppingCart },
  { id: 'despesas', name: 'Despesas', icon: CreditCard },
  { id: 'produtos', name: 'Produtos', icon: Package },
  { id: 'fornecedores', name: 'Fornecedores', icon: Users },
  { id: 'fechar-caixa', name: 'Fechar Caixa', icon: Calculator },
  { id: 'configuracoes', name: 'Configurações', icon: Settings },
];

export default function Layout({ children, activeTab = 'dashboard', onTabChange, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { configuracaoLoja } = useApp();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-72 bg-card border-r shadow-glow">
          <SidebarContent activeTab={activeTab} onTabChange={onTabChange} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-72 lg:block">
        <div className="h-full bg-card border-r shadow-glow">
          <SidebarContent activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Mobile header */}
        <div className="lg:hidden bg-card border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="font-bold text-lg gradient-primary bg-clip-text text-transparent">
            {configuracaoLoja.nomeLoja}
          </h1>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onClose?: () => void;
  onLogout?: () => void;
}

function SidebarContent({ activeTab, onTabChange, onClose, onLogout }: SidebarContentProps) {
  const { configuracaoLoja } = useApp();
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          {configuracaoLoja.logoUrl ? (
            <img 
              src={configuracaoLoja.logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-cover shadow-glow"
            />
          ) : (
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Package className="h-6 w-6 text-white" />
            </div>
          )}
          <h1 className="font-bold text-xl gradient-primary bg-clip-text text-transparent">
            {configuracaoLoja.nomeLoja}
          </h1>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-smooth",
                  isActive && "gradient-primary shadow-glow text-white"
                )}
                onClick={() => {
                  onTabChange?.(item.id);
                  onClose?.();
                }}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        {onLogout && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        )}
        <div className="text-sm text-muted-foreground text-center">
          <p className="font-medium">Sistema de Gestão</p>
          <p>Açaí Manager v1.0</p>
        </div>
      </div>
    </div>
  );
}