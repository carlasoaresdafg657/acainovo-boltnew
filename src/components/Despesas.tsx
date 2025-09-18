import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Calendar as CalendarIcon,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: Date;
  status: 'paga' | 'pendente' | 'vencida';
  observacoes?: string;
  dataCriacao: string;
}

const categorias = [
  { value: 'funcionarios', label: 'Funcionários', color: 'bg-blue-500' },
  { value: 'equipamentos', label: 'Equipamentos', color: 'bg-green-500' },
  { value: 'materiais', label: 'Materiais', color: 'bg-purple-500' },
  { value: 'aluguel', label: 'Aluguel', color: 'bg-red-500' },
  { value: 'marketing', label: 'Marketing', color: 'bg-yellow-500' },
  { value: 'impostos', label: 'Impostos', color: 'bg-gray-500' },
  { value: 'manutencao', label: 'Manutenção', color: 'bg-orange-500' },
  { value: 'outros', label: 'Outros', color: 'bg-pink-500' }
];

export default function Despesas() {
  const { toast } = useToast();
  const [despesas, setDespesas] = useState<Despesa[]>([
    {
      id: '1',
      descricao: 'Salário - Funcionário 1',
      categoria: 'funcionarios',
      valor: 1500.00,
      data: new Date(),
      status: 'paga',
      observacoes: 'Salário mensal',
      dataCriacao: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      descricao: 'Aluguel do ponto comercial',
      categoria: 'aluguel',
      valor: 2800.00,
      data: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias no futuro
      status: 'pendente',
      observacoes: 'Vencimento dia 10',
      dataCriacao: new Date().toISOString().split('T')[0]
    },
    {
      id: '3',
      descricao: 'Manutenção da máquina de açaí',
      categoria: 'manutencao',
      valor: 350.00,
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      status: 'vencida',
      observacoes: 'Reparo do motor',
      dataCriacao: new Date().toISOString().split('T')[0]
    }
  ]);

  const [modalAberto, setModalAberto] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState<Despesa | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: 0,
    data: new Date(),
    status: 'pendente' as 'paga' | 'pendente' | 'vencida',
    observacoes: ''
  });

  const abrirModal = (despesa?: Despesa) => {
    if (despesa) {
      setDespesaEditando(despesa);
      setFormData({
        descricao: despesa.descricao,
        categoria: despesa.categoria,
        valor: despesa.valor,
        data: despesa.data,
        status: despesa.status,
        observacoes: despesa.observacoes || ''
      });
    } else {
      setDespesaEditando(null);
      setFormData({
        descricao: '',
        categoria: '',
        valor: 0,
        data: new Date(),
        status: 'pendente',
        observacoes: ''
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setDespesaEditando(null);
    setFormData({
      descricao: '',
      categoria: '',
      valor: 0,
      data: new Date(),
      status: 'pendente',
      observacoes: ''
    });
  };

  const salvarDespesa = () => {
    if (!formData.descricao || !formData.categoria || formData.valor <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (despesaEditando) {
      // Editando despesa existente
      const despesaAtualizada: Despesa = {
        ...despesaEditando,
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: formData.valor,
        data: formData.data,
        status: formData.status,
        observacoes: formData.observacoes
      };

      setDespesas(despesas.map(d => d.id === despesaEditando.id ? despesaAtualizada : d));
      toast({
        title: "Despesa atualizada",
        description: `${formData.descricao} foi atualizada com sucesso!`,
      });
    } else {
      // Criando nova despesa
      const novaDespesa: Despesa = {
        id: Date.now().toString(),
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: formData.valor,
        data: formData.data,
        status: formData.status,
        observacoes: formData.observacoes,
        dataCriacao: new Date().toISOString().split('T')[0]
      };

      setDespesas([...despesas, novaDespesa]);
      toast({
        title: "Despesa adicionada",
        description: `${formData.descricao} foi criada com sucesso!`,
      });
    }

    fecharModal();
  };

  const excluirDespesa = (despesa: Despesa) => {
    setDespesas(despesas.filter(d => d.id !== despesa.id));
    toast({
      title: "Despesa excluída",
      description: `${despesa.descricao} foi removida`,
    });
  };

  const alterarStatus = (despesaId: string, novoStatus: 'paga' | 'pendente' | 'vencida') => {
    setDespesas(despesas.map(d => 
      d.id === despesaId ? { ...d, status: novoStatus } : d
    ));
    
    const statusTexto = {
      paga: 'marcada como paga',
      pendente: 'marcada como pendente',
      vencida: 'marcada como vencida'
    };

    toast({
      title: "Status atualizado",
      description: `Despesa ${statusTexto[novoStatus]}`,
    });
  };

  // Cálculos para os cards de resumo
  const totalDespesas = despesas.reduce((total, d) => total + d.valor, 0);
  const despesasPagas = despesas.filter(d => d.status === 'paga');
  const despesasPendentes = despesas.filter(d => d.status === 'pendente');
  const despesasVencidas = despesas.filter(d => d.status === 'vencida');
  
  const valorPago = despesasPagas.reduce((total, d) => total + d.valor, 0);
  const valorPendente = despesasPendentes.reduce((total, d) => total + d.valor, 0);
  const valorVencido = despesasVencidas.reduce((total, d) => total + d.valor, 0);

  const getCategoriaInfo = (categoria: string) => {
    return categorias.find(c => c.value === categoria) || categorias[categorias.length - 1];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paga':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'vencida':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Despesas
          </h1>
          <p className="text-muted-foreground">
            Controle todas as despesas do seu negócio
          </p>
        </div>

        <Button onClick={() => abrirModal()} className="gradient-primary shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalDespesas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{despesas.length} despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {valorPago.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{despesasPagas.length} despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">R$ {valorPendente.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{despesasPendentes.length} despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {valorVencido.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{despesasVencidas.length} despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {despesas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.map((despesa) => {
                  const categoriaInfo = getCategoriaInfo(despesa.categoria);
                  return (
                    <TableRow key={despesa.id}>
                      <TableCell className="font-medium">{despesa.descricao}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", categoriaInfo.color)} />
                          {categoriaInfo.label}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">R$ {despesa.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(despesa.data, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(despesa.status)}
                          <Badge 
                            variant={getStatusVariant(despesa.status)}
                            className="capitalize"
                          >
                            {despesa.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-32 truncate">
                        {despesa.observacoes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {despesa.status !== 'paga' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => alterarStatus(despesa.id, 'paga')}
                              title="Marcar como paga"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModal(despesa)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluirDespesa(despesa)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma despesa cadastrada</p>
              <p className="text-sm">Adicione sua primeira despesa para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Despesa */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {despesaEditando ? 'Editar Despesa' : 'Adicionar Despesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Ex: Aluguel do ponto comercial"
                />
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.value} value={categoria.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", categoria.color)} />
                          {categoria.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: Number(e.target.value)})}
                  placeholder="150.00"
                />
              </div>

              <div>
                <Label htmlFor="data">Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data ? format(formData.data, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => date && setFormData({...formData, data: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="paga">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Paga
                    </div>
                  </SelectItem>
                  <SelectItem value="vencida">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Vencida
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Informações adicionais sobre a despesa..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={salvarDespesa} className="flex-1">
                {despesaEditando ? 'Atualizar' : 'Criar'} Despesa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Aviso sobre Supabase */}
      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-warning mb-1">
                Conecte o Supabase para funcionalidade completa
              </h3>
              <p className="text-sm text-muted-foreground">
                Para salvar despesas permanentemente, gerar relatórios automáticos e 
                receber lembretes de vencimento, conecte seu projeto ao Supabase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}