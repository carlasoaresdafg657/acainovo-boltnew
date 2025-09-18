import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Package2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp, type Produto } from "@/contexts/AppContext";

export default function Produtos() {
  const { toast } = useToast();
  const { produtos, setProdutos } = useApp();

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    custoUnitario: 0,
    valorVenda: 0
  });

  const calcularLucro = (custo: number, venda: number) => {
    const lucro = venda - custo;
    const margemLucro = venda > 0 ? (lucro / venda) * 100 : 0;
    return { lucro, margemLucro };
  };

  const abrirModal = (produto?: Produto) => {
    if (produto) {
      setProdutoEditando(produto);
      setFormData({
        nome: produto.nome,
        custoUnitario: produto.custoUnitario,
        valorVenda: produto.valorVenda
      });
    } else {
      setProdutoEditando(null);
      setFormData({ nome: '', custoUnitario: 0, valorVenda: 0 });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
    setFormData({ nome: '', custoUnitario: 0, valorVenda: 0 });
  };

  const salvarProduto = () => {
    if (!formData.nome || formData.custoUnitario <= 0 || formData.valorVenda <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos com valores válidos",
        variant: "destructive",
      });
      return;
    }

    if (formData.valorVenda <= formData.custoUnitario) {
      toast({
        title: "Atenção",
        description: "O valor de venda deve ser maior que o custo unitário",
        variant: "destructive",
      });
      return;
    }

    const { lucro, margemLucro } = calcularLucro(formData.custoUnitario, formData.valorVenda);

    if (produtoEditando) {
      // Editando produto existente
      const produtoAtualizado: Produto = {
        ...produtoEditando,
        nome: formData.nome,
        custoUnitario: formData.custoUnitario,
        valorVenda: formData.valorVenda,
        lucro,
        margemLucro
      };

      setProdutos(produtos.map(p => p.id === produtoEditando.id ? produtoAtualizado : p));
      toast({
        title: "Produto atualizado",
        description: `${formData.nome} foi atualizado com sucesso!`,
      });
    } else {
      // Criando novo produto
      const novoProduto: Produto = {
        id: Date.now().toString(),
        nome: formData.nome,
        custoUnitario: formData.custoUnitario,
        valorVenda: formData.valorVenda,
        lucro,
        margemLucro,
        dataCriacao: new Date().toISOString().split('T')[0]
      };

      setProdutos([...produtos, novoProduto]);
      toast({
        title: "Produto adicionado",
        description: `${formData.nome} foi criado com sucesso!`,
      });
    }

    fecharModal();
  };

  const excluirProduto = (produto: Produto) => {
    setProdutos(produtos.filter(p => p.id !== produto.id));
    toast({
      title: "Produto excluído",
      description: `${produto.nome} foi removido`,
    });
  };

  const lucroMedio = produtos.length > 0 
    ? produtos.reduce((acc, p) => acc + p.margemLucro, 0) / produtos.length 
    : 0;

  const produtoMaisLucrativo = produtos.length > 0
    ? produtos.reduce((prev, current) => prev.margemLucro > current.margemLucro ? prev : current)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Produtos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e calcule automaticamente o lucro
          </p>
        </div>

        <Button onClick={() => abrirModal()} className="gradient-primary shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {lucroMedio.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Lucrativo</CardTitle>
            <Badge variant="secondary" className="gradient-primary text-white">TOP</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {produtoMaisLucrativo ? produtoMaisLucrativo.nome : 'N/A'}
            </div>
            {produtoMaisLucrativo && (
              <p className="text-sm text-muted-foreground">
                {produtoMaisLucrativo.margemLucro.toFixed(1)}% de margem
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {produtos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Valor Venda</TableHead>
                  <TableHead>Lucro Unit.</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>R$ {produto.custoUnitario.toFixed(2)}</TableCell>
                    <TableCell>R$ {produto.valorVenda.toFixed(2)}</TableCell>
                    <TableCell className="text-primary font-medium">
                      R$ {produto.lucro.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={produto.margemLucro >= 60 ? "default" : produto.margemLucro >= 40 ? "secondary" : "outline"}
                        className={produto.margemLucro >= 60 ? "gradient-primary text-white" : ""}
                      >
                        {produto.margemLucro.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(produto.dataCriacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModal(produto)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirProduto(produto)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto cadastrado</p>
              <p className="text-sm">Adicione seu primeiro produto para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Produto */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {produtoEditando ? 'Editar Produto' : 'Adicionar Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Açaí 500ml"
              />
            </div>
            
            <div>
              <Label htmlFor="custo">Custo Unitário (R$)</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                value={formData.custoUnitario}
                onChange={(e) => setFormData({...formData, custoUnitario: Number(e.target.value)})}
                placeholder="2.50"
              />
            </div>

            <div>
              <Label htmlFor="venda">Valor de Venda (R$)</Label>
              <Input
                id="venda"
                type="number"
                step="0.01"
                value={formData.valorVenda}
                onChange={(e) => setFormData({...formData, valorVenda: Number(e.target.value)})}
                placeholder="8.00"
              />
            </div>

            {/* Prévia do Cálculo */}
            {formData.custoUnitario > 0 && formData.valorVenda > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Lucro Unitário:</span>
                      <span className="font-medium text-primary">
                        R$ {(formData.valorVenda - formData.custoUnitario).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem de Lucro:</span>
                      <span className="font-medium text-primary">
                        {formData.valorVenda > 0 ? (((formData.valorVenda - formData.custoUnitario) / formData.valorVenda) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={salvarProduto} className="flex-1">
                {produtoEditando ? 'Atualizar' : 'Criar'} Produto
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
              <Package2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-warning mb-1">
                Conecte o Supabase para funcionalidade completa
              </h3>
              <p className="text-sm text-muted-foreground">
                Para salvar produtos permanentemente, sincronizar com as vendas e 
                atualizar custos automaticamente, conecte seu projeto ao Supabase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}