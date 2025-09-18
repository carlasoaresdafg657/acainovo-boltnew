import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, X, ShoppingCart, TrendingUp, TrendingDown, Package2, AlertCircle, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import type { ItemVenda, Venda } from "@/contexts/AppContext";
import GerenciarCanais from "./GerenciarCanais";

export default function Vendas() {
  const { toast } = useToast();
  const { 
    produtos, 
    canaisVenda, 
    vendas, 
    adicionarVenda, 
    cancelarVenda, 
    getMetricas 
  } = useApp();

  const [modalAberto, setModalAberto] = useState(false);
  const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [canalSelecionado, setCanalSelecionado] = useState('');
  const [frete, setFrete] = useState(0);
  const [taxarFrete, setTaxarFrete] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [modalCanaisAberto, setModalCanaisAberto] = useState(false);

  const metricas = getMetricas();

  const abrirModal = (venda?: Venda) => {
    if (venda) {
      setVendaEditando(venda);
      setItensVenda(venda.itens);
      setCanalSelecionado(venda.canalVendaId);
      setFrete(venda.frete);
      setTaxarFrete(venda.taxarFrete);
      setObservacoes(venda.observacoes || '');
    } else {
      setVendaEditando(null);
      setItensVenda([]);
      setCanalSelecionado('');
      setFrete(0);
      setTaxarFrete(false);
      setObservacoes('');
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setVendaEditando(null);
    setItensVenda([]);
    setCanalSelecionado('');
    setFrete(0);
    setTaxarFrete(false);
    setObservacoes('');
  };

  const adicionarItem = () => {
    setItensVenda([...itensVenda, {
      produtoId: '',
      produto: {} as any,
      quantidade: 1,
      valorUnitario: 0,
      subtotal: 0
    }]);
  };

  const removerItem = (index: number) => {
    setItensVenda(itensVenda.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, campo: keyof ItemVenda, valor: any) => {
    const novosItens = [...itensVenda];
    
    if (campo === 'produtoId') {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        novosItens[index] = {
          ...novosItens[index],
          produtoId: valor,
          produto: produto,
          valorUnitario: produto.valorVenda,
          subtotal: produto.valorVenda * novosItens[index].quantidade
        };
      }
    } else if (campo === 'quantidade' || campo === 'valorUnitario') {
      novosItens[index] = {
        ...novosItens[index],
        [campo]: Number(valor)
      };
      novosItens[index].subtotal = novosItens[index].quantidade * novosItens[index].valorUnitario;
    }
    
    setItensVenda(novosItens);
  };

  const calcularVenda = () => {
    const subtotalProdutos = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);
    const canal = canaisVenda.find(c => c.id === canalSelecionado);
    
    // Calcular taxa do canal considerando se deve taxar o frete ou não
    let valorParaTaxa = subtotalProdutos;
    if (taxarFrete && frete > 0) {
      valorParaTaxa += frete;
    }
    
    const taxaCanal = canal ? (valorParaTaxa * canal.taxa / 100) : 0;
    const valorTotal = subtotalProdutos + frete - taxaCanal;
    
    const lucroTotal = itensVenda.reduce((sum, item) => {
      const lucroUnitario = item.valorUnitario - item.produto.custoUnitario;
      return sum + (lucroUnitario * item.quantidade);
    }, 0) + frete - taxaCanal;

    return {
      subtotalProdutos,
      taxaCanal,
      valorTotal,
      lucroTotal,
      canal
    };
  };

  const salvarVenda = () => {
    if (itensVenda.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à venda",
        variant: "destructive",
      });
      return;
    }

    if (!canalSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um canal de venda",
        variant: "destructive",
      });
      return;
    }

    const itensValidos = itensVenda.filter(item => 
      item.produtoId && item.quantidade > 0 && item.valorUnitario > 0
    );

    if (itensValidos.length !== itensVenda.length) {
      toast({
        title: "Erro",
        description: "Preencha todos os produtos com dados válidos",
        variant: "destructive",
      });
      return;
    }

    const { subtotalProdutos, taxaCanal, valorTotal, lucroTotal, canal } = calcularVenda();

    if (!canal) {
      toast({
        title: "Erro",
        description: "Canal de venda inválido",
        variant: "destructive",
      });
      return;
    }

    const novaVenda: Omit<Venda, 'id' | 'dataVenda'> = {
      itens: itensValidos,
      canalVendaId: canalSelecionado,
      canalVenda: canal,
      frete,
      taxarFrete,
      subtotalProdutos,
      taxaCanal,
      valorTotal,
      lucroTotal,
      status: 'ativa',
      observacoes
    };

    adicionarVenda(novaVenda);

    toast({
      title: "Venda registrada",
      description: `Venda de R$ ${valorTotal.toFixed(2)} criada com sucesso!`,
    });

    fecharModal();
  };

  const handleCancelarVenda = (venda: Venda) => {
    cancelarVenda(venda.id);
    toast({
      title: "Venda cancelada",
      description: "A venda foi cancelada e removida dos cálculos",
    });
  };

  const { subtotalProdutos, taxaCanal, valorTotal, lucroTotal, canal } = calcularVenda();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Vendas
          </h1>
          <p className="text-muted-foreground">
            Registre vendas e acompanhe performance por canal
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setModalCanaisAberto(true)}
            className="shadow-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Canais
          </Button>
          <Button onClick={() => abrirModal()} className="gradient-primary shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metricas.totalVendas}</div>
            {metricas.totalCanceladas > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {metricas.totalCanceladas} canceladas
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {metricas.vendasHoje.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {metricas.vendasMes.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metricas.lucroMes.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Canal */}
      {metricas.vendasPorCanal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricas.vendasPorCanal.map(({ canal, quantidade, valorBruto, valorLiquido, taxas }) => (
                <div key={canal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{canal.nome}</h3>
                    <Badge variant={canal.taxa > 0 ? "secondary" : "default"}>
                      {quantidade} vendas
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Bruto:</span>
                      <span>R$ {valorBruto.toFixed(2)}</span>
                    </div>
                    {taxas > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>Taxas ({canal.taxa}%):</span>
                        <span>-R$ {taxas.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Valor Líquido:</span>
                      <span className="text-primary">R$ {valorLiquido.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Frete</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas
                  .sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime())
                  .map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{venda.canalVenda.nome}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {venda.itens.map((item, i) => (
                          <div key={i}>
                            {item.quantidade}x {item.produto.nome}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>R$ {venda.subtotalProdutos.toFixed(2)}</TableCell>
                    <TableCell>
                      {venda.taxaCanal > 0 ? (
                        <span className="text-accent">-R$ {venda.taxaCanal.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {venda.frete > 0 ? (
                        <div>
                          <div>R$ {venda.frete.toFixed(2)}</div>
                          {venda.taxarFrete && venda.canalVenda.taxa > 0 && (
                            <div className="text-xs text-muted-foreground">
                              (taxado)
                            </div>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {venda.valorTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className={venda.lucroTotal >= 0 ? "text-success" : "text-destructive"}>
                      R$ {venda.lucroTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={venda.status === 'ativa' ? 'default' : 'secondary'}>
                        {venda.status === 'ativa' ? 'Ativa' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {venda.status === 'ativa' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelarVenda(venda)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma venda registrada</p>
              <p className="text-sm">Clique em "Nova Venda" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Venda */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vendaEditando ? 'Editar Venda' : 'Nova Venda'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Seleção do Canal */}
            <div>
              <Label htmlFor="canal">Canal de Venda</Label>
              <Select value={canalSelecionado} onValueChange={setCanalSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal de venda" />
                </SelectTrigger>
                <SelectContent>
                  {canaisVenda.map((canal) => (
                    <SelectItem key={canal.id} value={canal.id}>
                      {canal.nome} {canal.taxa > 0 && `(Taxa: ${canal.taxa}%)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Produtos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Produtos</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarItem}
                  disabled={produtos.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              {produtos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto cadastrado</p>
                  <p className="text-sm">Cadastre produtos primeiro na aba "Produtos"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itensVenda.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid gap-4 md:grid-cols-5 items-end">
                        <div>
                          <Label>Produto</Label>
                          <Select 
                            value={item.produtoId} 
                            onValueChange={(value) => atualizarItem(index, 'produtoId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.map((produto) => (
                                <SelectItem key={produto.id} value={produto.id}>
                                  {produto.nome} - R$ {produto.valorVenda.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Valor Unit. (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valorUnitario}
                            onChange={(e) => atualizarItem(index, 'valorUnitario', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Subtotal</Label>
                          <div className="text-lg font-medium text-primary">
                            R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerItem(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Frete */}
            <div className="space-y-3">
              <Label htmlFor="frete">Frete (R$)</Label>
              <Input
                id="frete"
                type="number"
                step="0.01"
                value={frete}
                onChange={(e) => setFrete(Number(e.target.value))}
                placeholder="0.00"
              />
              
              {frete > 0 && canalSelecionado && canaisVenda.find(c => c.id === canalSelecionado)?.taxa > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxar-frete"
                    checked={taxarFrete}
                    onCheckedChange={(checked) => setTaxarFrete(checked as boolean)}
                  />
                  <Label htmlFor="taxar-frete" className="text-sm font-normal">
                    Aplicar taxa do canal sobre o frete (
                    {canaisVenda.find(c => c.id === canalSelecionado)?.taxa}% sobre R$ {frete.toFixed(2)})
                  </Label>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre a venda..."
                rows={3}
              />
            </div>

            {/* Resumo da Venda */}
            {itensVenda.length > 0 && canalSelecionado && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4">Resumo da Venda</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal Produtos:</span>
                      <span>R$ {subtotalProdutos.toFixed(2)}</span>
                    </div>
                    {frete > 0 && (
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {frete.toFixed(2)}</span>
                      </div>
                    )}
                    {canal && canal.taxa > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>
                          Taxa {canal.nome} ({canal.taxa}%) 
                          {taxarFrete && frete > 0 ? ` sobre produtos + frete` : ` sobre produtos`}:
                        </span>
                        <span>-R$ {taxaCanal.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Valor Total:</span>
                      <span className="text-primary">R$ {valorTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Lucro Estimado:</span>
                      <span className={lucroTotal >= 0 ? "text-success" : "text-destructive"}>
                        R$ {lucroTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={salvarVenda} className="flex-1" disabled={itensVenda.length === 0}>
                {vendaEditando ? 'Atualizar' : 'Registrar'} Venda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gerenciar Canais */}
      <GerenciarCanais 
        open={modalCanaisAberto} 
        onOpenChange={setModalCanaisAberto} 
      />
    </div>
  );
}