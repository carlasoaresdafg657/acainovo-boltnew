import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, Upload, Package } from "lucide-react";
import { toast } from "sonner";

interface CustoItem {
  id: string;
  nome: string;
  valorTotal: number;
  quantidade: number;
  custoUnitario: number;
}

interface ProdutoFornecedor {
  id: string;
  nome: string;
  foto?: string;
  custos: CustoItem[];
  custoTotalCalculado: number;
}

export default function Fornecedores() {
  const [produtos, setProdutos] = useState<ProdutoFornecedor[]>([]);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    foto: ''
  });
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoFornecedor | null>(null);
  const [novoCusto, setNovoCusto] = useState({
    nome: '',
    valorTotal: '',
    quantidade: '',
    custoUnitario: ''
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarProdutosFornecedores();
  }, []);

  const carregarProdutosFornecedores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos_fornecedores')
        .select(`
          *,
          custos_produtos (*)
        `)
        .order('created_at', { ascending: false });

      if (produtosError) {
        console.error('Erro ao carregar produtos fornecedores:', produtosError);
        return;
      }

      const produtosFormatados: ProdutoFornecedor[] = produtosData.map(p => ({
        id: p.id,
        nome: p.nome,
        foto: p.imagem_url || undefined,
        custos: p.custos_produtos.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          valorTotal: c.valor_total,
          quantidade: c.quantidade,
          custoUnitario: c.custo_unitario
        })),
        custoTotalCalculado: p.custo_total_calculado || 0
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos fornecedores:', error);
    } finally {
      setCarregando(false);
    }
  };

  const adicionarProduto = async () => {
    if (!novoProduto.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('produtos_fornecedores')
        .insert({
          user_id: user.id,
          nome: novoProduto.nome,
          imagem_url: novoProduto.foto || null,
          custo_total_calculado: 0
        })
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar produto: ' + error.message);
        return;
      }

      toast.success('Produto adicionado com sucesso!');
      setNovoProduto({ nome: '', foto: '' });
      await carregarProdutosFornecedores();
      
    } catch (error: any) {
      toast.error('Erro ao adicionar produto: ' + error.message);
    }
  };

  const adicionarCusto = async () => {
    if (!produtoSelecionado || !novoCusto.nome.trim() || !novoCusto.valorTotal || !novoCusto.quantidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const valorTotal = parseFloat(novoCusto.valorTotal);
      const quantidade = parseInt(novoCusto.quantidade);
      const custoUnitario = valorTotal / quantidade;

      const { error } = await supabase
        .from('custos_produtos')
        .insert({
          produto_id: produtoSelecionado.id,
          nome: novoCusto.nome,
          valor_total: valorTotal,
          quantidade: quantidade,
          custo_unitario: custoUnitario
        });

      if (error) {
        toast.error('Erro ao adicionar custo: ' + error.message);
        return;
      }

      // Recalcular custo total
      const novosCustos = [
        ...produtoSelecionado.custos,
        {
          id: Date.now().toString(),
          nome: novoCusto.nome,
          valorTotal,
          quantidade,
          custoUnitario
        }
      ];

      const novoCustoTotal = novosCustos.reduce((total, custo) => total + custo.custoUnitario, 0);

      // Atualizar custo total no produto
      await supabase
        .from('produtos_fornecedores')
        .update({ custo_total_calculado: novoCustoTotal })
        .eq('id', produtoSelecionado.id);

      toast.success('Custo adicionado com sucesso!');
      setNovoCusto({ nome: '', valorTotal: '', quantidade: '', custoUnitario: '' });
      await carregarProdutosFornecedores();
      
      // Atualizar produto selecionado
      const produtoAtualizado = produtos.find(p => p.id === produtoSelecionado.id);
      if (produtoAtualizado) {
        setProdutoSelecionado(produtoAtualizado);
      }
      
    } catch (error: any) {
      toast.error('Erro ao adicionar custo: ' + error.message);
    }
  };

  const removerCusto = async (custoId: string) => {
    try {
      const { error } = await supabase
        .from('custos_produtos')
        .delete()
        .eq('id', custoId);

      if (error) {
        toast.error('Erro ao remover custo: ' + error.message);
        return;
      }

      toast.success('Custo removido com sucesso!');
      await carregarProdutosFornecedores();
      
      // Atualizar produto selecionado se necessário
      if (produtoSelecionado) {
        const produtoAtualizado = produtos.find(p => p.id === produtoSelecionado.id);
        if (produtoAtualizado) {
          setProdutoSelecionado(produtoAtualizado);
        }
      }
      
    } catch (error: any) {
      toast.error('Erro ao remover custo: ' + error.message);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovoProduto(prev => ({
          ...prev,
          foto: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie os custos e fornecedores dos seus produtos
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogAberto(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Açaí 500ml"
                />
              </div>
              <div>
                <Label htmlFor="foto">Foto do Produto</Label>
                <Input
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                />
                {novoProduto.foto && (
                  <img
                    src={novoProduto.foto}
                    alt="Preview"
                    className="mt-2 w-20 h-20 object-cover rounded"
                  />
                )}
              </div>
              <Button onClick={adicionarProduto} className="w-full">
                Adicionar Produto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {produtos.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando seus primeiros produtos e seus custos
          </p>
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Produto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((produto) => (
            <Card key={produto.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setProdutoSelecionado(produto)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{produto.nome}</CardTitle>
                  {produto.foto && (
                    <img
                      src={produto.foto}
                      alt={produto.nome}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Itens de custo:</span>
                    <Badge variant="secondary">{produto.custos.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Custo Total:</span>
                    <span className="font-bold text-lg">
                      R$ {produto.custoTotalCalculado.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de detalhes do produto */}
      <Dialog open={!!produtoSelecionado} onOpenChange={() => setProdutoSelecionado(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {produtoSelecionado?.foto && (
                <img
                  src={produtoSelecionado.foto}
                  alt={produtoSelecionado.nome}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              {produtoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {produtoSelecionado && (
            <div className="space-y-6">
              {/* Resumo do produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de itens</p>
                      <p className="text-2xl font-bold">{produtoSelecionado.custos.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {produtoSelecionado.custoTotalCalculado.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adicionar novo custo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nome-custo">Nome do Item</Label>
                      <Input
                        id="nome-custo"
                        value={novoCusto.nome}
                        onChange={(e) => setNovoCusto(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: Açaí base, Copo 500ml"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valor-total">Valor Total (R$)</Label>
                      <Input
                        id="valor-total"
                        type="number"
                        step="0.01"
                        value={novoCusto.valorTotal}
                        onChange={(e) => setNovoCusto(prev => ({ ...prev, valorTotal: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        value={novoCusto.quantidade}
                        onChange={(e) => setNovoCusto(prev => ({ ...prev, quantidade: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={adicionarCusto} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Custo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de custos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custos Detalhados</CardTitle>
                </CardHeader>
                <CardContent>
                  {produtoSelecionado.custos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum custo adicionado ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {produtoSelecionado.custos.map((custo, index) => (
                        <div key={custo.id}>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{custo.nome}</h4>
                              <div className="text-sm text-muted-foreground mt-1">
                                {custo.quantidade} unidades × R$ {custo.custoUnitario.toFixed(2)} = R$ {custo.valorTotal.toFixed(2)}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerCusto(custo.id)}
                              className="ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {index < produtoSelecionado.custos.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}