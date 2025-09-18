import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle,
  Download,
  Settings,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function FechaCaixa() {
  const { 
    getMetricasMEI, 
    configuracaoMEI, 
    setConfiguracaoMEI,
    adicionarFaturamentoMensal,
    adicionarLucroPJ,
    adicionarTransferenciaPF
  } = useApp();
  
  const [novoLimiteMEI, setNovoLimiteMEI] = useState(configuracaoMEI.limiteMEI);
  const [dialogLimite, setDialogLimite] = useState(false);
  
  // Estados para adicionar valores
  const [dialogLucro, setDialogLucro] = useState(false);
  const [dialogTransferencia, setDialogTransferencia] = useState(false);
  const [dialogFaturamento, setDialogFaturamento] = useState(false);
  
  const [valorLucro, setValorLucro] = useState('');
  const [valorTransferencia, setValorTransferencia] = useState('');
  const [valorFaturamento, setValorFaturamento] = useState('');
  const [mesAno, setMesAno] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const metricas = getMetricasMEI();

  const handleAtualizarLimite = () => {
    setConfiguracaoMEI({
      ...configuracaoMEI,
      limiteMEI: novoLimiteMEI
    });
    setDialogLimite(false);
    toast.success('Limite MEI atualizado com sucesso!');
  };

  const handleAdicionarLucro = () => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const valor = parseFloat(valorLucro);
    
    if (valor && mes && ano) {
      adicionarLucroPJ(mes, ano, valor);
      setValorLucro('');
      setDialogLucro(false);
      toast.success('Lucro PJ distribuído adicionado com sucesso!');
    }
  };

  const handleAdicionarTransferencia = () => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const valor = parseFloat(valorTransferencia);
    
    if (valor && mes && ano) {
      adicionarTransferenciaPF(mes, ano, valor);
      setValorTransferencia('');
      setDialogTransferencia(false);
      toast.success('Transferência PF adicionada com sucesso!');
    }
  };

  const handleAdicionarFaturamento = () => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const valor = parseFloat(valorFaturamento);
    
    if (valor && mes && ano) {
      adicionarFaturamentoMensal({
        mes,
        ano,
        faturamento: valor,
        lucroPJDistribuido: 0,
        transferenciaPF: 0
      });
      setValorFaturamento('');
      setDialogFaturamento(false);
      toast.success('Faturamento adicional registrado com sucesso!');
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Faturamento MEI', pageWidth / 2, 30, { align: 'center' });
    
    // Informações gerais
    doc.setFontSize(12);
    doc.text(`Ano: ${configuracaoMEI.anoCorrente}`, margin, 50);
    doc.text(`Limite MEI: R$ ${configuracaoMEI.limiteMEI.toLocaleString('pt-BR')}`, margin, 60);
    doc.text(`Faturamento Total: R$ ${metricas.faturamentoAnoCorrente.toLocaleString('pt-BR')}`, margin, 70);
    doc.text(`Percentual do Limite: ${metricas.percentualLimite.toFixed(2)}%`, margin, 80);
    
    // Status
    const statusTexto = metricas.statusLimite === 'normal' ? 'Normal' : 
                       metricas.statusLimite === 'atencao' ? 'Atenção' : 'Crítico';
    doc.text(`Status: ${statusTexto}`, margin, 90);

    // Tabela mensal
    const dadosTabela = metricas.faturamentoPorMes.map(m => [
      mesesNomes[m.mes - 1],
      `R$ ${m.faturamento.toLocaleString('pt-BR')}`,
      `R$ ${m.lucroPJDistribuido.toLocaleString('pt-BR')}`,
      `R$ ${m.transferenciaPF.toLocaleString('pt-BR')}`
    ]);

    autoTable(doc, {
      head: [['Mês', 'Faturamento', 'Lucro PJ Distrib.', 'Transferência PF']],
      body: dadosTabela,
      startY: 110,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [98, 84, 163] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text(`Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, finalY);

    doc.save(`relatorio-mei-${configuracaoMEI.anoCorrente}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const getStatusColor = () => {
    switch (metricas.statusLimite) {
      case 'atencao': return 'bg-warning text-warning-foreground';
      case 'critico': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (metricas.statusLimite) {
      case 'atencao': return <AlertTriangle className="h-4 w-4" />;
      case 'critico': return <AlertCircle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fechar Caixa MEI</h1>
          <p className="text-muted-foreground">
            Controle do limite anual MEI - {configuracaoMEI.anoCorrente}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={dialogLimite} onOpenChange={setDialogLimite}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Limite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Limite MEI</DialogTitle>
                <DialogDescription>
                  Defina o limite anual para o MEI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="limite">Limite MEI (R$)</Label>
                  <Input
                    id="limite"
                    type="number"
                    value={novoLimiteMEI}
                    onChange={(e) => setNovoLimiteMEI(Number(e.target.value))}
                    placeholder="81000"
                  />
                </div>
                <Button onClick={handleAtualizarLimite}>
                  Atualizar Limite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={exportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Status MEI {configuracaoMEI.anoCorrente}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Faturamento Total</Label>
              <p className="text-2xl font-bold">
                R$ {metricas.faturamentoAnoCorrente.toLocaleString('pt-BR')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Limite MEI</Label>
              <p className="text-2xl font-bold">
                R$ {configuracaoMEI.limiteMEI.toLocaleString('pt-BR')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Badge className={`${getStatusColor()} flex items-center gap-1 w-fit`}>
                {getStatusIcon()}
                {metricas.statusLimite === 'normal' ? 'Normal' : 
                 metricas.statusLimite === 'atencao' ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do limite MEI</span>
              <span>{metricas.percentualLimite.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metricas.percentualLimite} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ 0</span>
              <span className="text-warning">R$ 60.000 (Atenção)</span>
              <span className="text-destructive">R$ 71.000 (Crítico)</span>
              <span>R$ {configuracaoMEI.limiteMEI.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Dialog open={dialogFaturamento} onOpenChange={setDialogFaturamento}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-glow transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Faturamento
                </CardTitle>
                <CardDescription>
                  Registrar faturamento adicional
                </CardDescription>
              </CardHeader>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Faturamento Adicional</DialogTitle>
              <DialogDescription>
                Registre faturamento não capturado pelo sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mes-ano-fat">Mês/Ano</Label>
                <Input
                  id="mes-ano-fat"
                  type="month"
                  value={mesAno}
                  onChange={(e) => setMesAno(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valor-fat">Valor (R$)</Label>
                <Input
                  id="valor-fat"
                  type="number"
                  step="0.01"
                  value={valorFaturamento}
                  onChange={(e) => setValorFaturamento(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button onClick={handleAdicionarFaturamento}>
                Adicionar Faturamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogLucro} onOpenChange={setDialogLucro}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-glow transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Lucro PJ Distribuído
                </CardTitle>
                <CardDescription>
                  Registrar distribuição de lucros
                </CardDescription>
              </CardHeader>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Lucro PJ Distribuído</DialogTitle>
              <DialogDescription>
                Registre lucros distribuídos da PJ para PF (isento de imposto)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mes-ano-lucro">Mês/Ano</Label>
                <Input
                  id="mes-ano-lucro"
                  type="month"
                  value={mesAno}
                  onChange={(e) => setMesAno(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valor-lucro">Valor (R$)</Label>
                <Input
                  id="valor-lucro"
                  type="number"
                  step="0.01"
                  value={valorLucro}
                  onChange={(e) => setValorLucro(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button onClick={handleAdicionarLucro}>
                Adicionar Lucro
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogTransferencia} onOpenChange={setDialogTransferencia}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-glow transition-smooth">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Transferência PF
                </CardTitle>
                <CardDescription>
                  Registrar transferências para PF
                </CardDescription>
              </CardHeader>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Transferência PF</DialogTitle>
              <DialogDescription>
                Registre transferências para sua conta pessoa física
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mes-ano-trans">Mês/Ano</Label>
                <Input
                  id="mes-ano-trans"
                  type="month"
                  value={mesAno}
                  onChange={(e) => setMesAno(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valor-trans">Valor (R$)</Label>
                <Input
                  id="valor-trans"
                  type="number"
                  step="0.01"
                  value={valorTransferencia}
                  onChange={(e) => setValorTransferencia(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button onClick={handleAdicionarTransferencia}>
                Adicionar Transferência
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Faturamento Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Faturamento Mensal - {configuracaoMEI.anoCorrente}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricas.faturamentoPorMes.map((mes) => (
              <Card key={mes.mes} className="border-l-4" style={{
                borderLeftColor: mes.faturamento > 0 ? 
                  (mes.faturamento > 7000 ? '#ef4444' : mes.faturamento > 5000 ? '#f97316' : '#22c55e') : 
                  '#64748b'
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{mesesNomes[mes.mes - 1]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faturamento:</span>
                    <span className="font-medium">R$ {mes.faturamento.toLocaleString('pt-BR')}</span>
                  </div>
                  {mes.lucroPJDistribuido > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lucro PJ:</span>
                      <span className="font-medium text-success">R$ {mes.lucroPJDistribuido.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {mes.transferenciaPF > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Transfer. PF:</span>
                      <span className="font-medium text-accent">R$ {mes.transferenciaPF.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}