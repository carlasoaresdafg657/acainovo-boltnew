import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  CreditCard,
  Instagram,
  Phone,
  Store,
  Truck
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// Mapeamento de ícones para canais
const iconMap: { [key: string]: any } = {
  Instagram,
  Phone,
  Store,
  Truck
};

export default function Dashboard() {
  const { getMetricas } = useApp();
  const metricas = getMetricas();
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas vendas e performance em tempo real
          </p>
        </div>
        <Button 
          className="gradient-primary shadow-glow"
          onClick={() => setShowReport(true)}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Relatório Completo
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {metricas.vendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas.totalVendas} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              R$ {metricas.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custos e taxas das vendas
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metricas.lucroMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {metricas.vendasMes > 0 ? ((metricas.lucroMes / metricas.vendasMes) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por período */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendas</span>
              <span className="font-medium text-primary">
                R$ {metricas.vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-medium text-accent">
                R$ {metricas.despesasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Lucro</span>
              <span className="font-bold text-success">
                R$ {metricas.lucroHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendas</span>
              <span className="font-medium text-primary">
                R$ {metricas.vendasSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-medium text-accent">
                R$ {metricas.despesasSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Lucro</span>
              <span className="font-bold text-success">
                R$ {metricas.lucroSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Este Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendas</span>
              <span className="font-medium text-primary">
                R$ {metricas.vendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-medium text-accent">
                R$ {metricas.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Lucro</span>
              <span className="font-bold text-success">
                R$ {metricas.lucroMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Canal e Despesas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Canal */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Vendas por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricas.vendasPorCanal.length > 0 ? (
              metricas.vendasPorCanal.map(({ canal, quantidade, valorBruto, valorLiquido, taxas }) => {
                const Icon = iconMap[canal.icon] || Store;
                
                return (
                  <div key={canal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{canal.nome}</p>
                        <p className="text-sm text-muted-foreground">{quantidade} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      {canal.taxa > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Taxa: {canal.taxa}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma venda registrada</p>
                <p className="text-sm">As vendas aparecerão aqui quando forem registradas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricas.despesasMes > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Custos dos Produtos</span>
                  <span className="font-bold">
                    R$ {metricas.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-primary"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Despesas geradas automaticamente das vendas
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma despesa registrada</p>
                <p className="text-sm">As despesas aparecerão quando houver vendas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal do Relatório Completo */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
              Relatório Completo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    {metricas.totalVendas}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    R$ {metricas.totalVendas > 0 ? (metricas.vendasMes / metricas.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Margem de Lucro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-success">
                    {metricas.vendasMes > 0 ? ((metricas.lucroMes / metricas.vendasMes) * 100).toFixed(1) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Detalhamento por Canal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalhamento por Canal de Venda</h3>
              <div className="space-y-3">
                {metricas.vendasPorCanal.map(({ canal, quantidade, valorBruto, valorLiquido, taxas }) => {
                  const Icon = iconMap[canal.icon] || Store;
                  
                  return (
                    <Card key={canal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{canal.nome}</p>
                              <p className="text-sm text-muted-foreground">Taxa: {canal.taxa}%</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {quantidade} vendas
                            </p>
                            <p className="text-sm">
                              Bruto: R$ {valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-accent">
                              Taxas: R$ {taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="font-bold text-primary">
                              Líquido: R$ {valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}