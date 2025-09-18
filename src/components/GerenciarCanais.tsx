import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp, CanalVenda } from "@/contexts/AppContext";

interface GerenciarCanaisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GerenciarCanais({ open, onOpenChange }: GerenciarCanaisProps) {
  const { toast } = useToast();
  const { canaisVenda, setCanaisVenda } = useApp();
  
  const [editandoCanal, setEditandoCanal] = useState<CanalVenda | null>(null);
  const [novoCanal, setNovoCanal] = useState<Partial<CanalVenda>>({ nome: '', taxa: 0 });
  const [modoEdicao, setModoEdicao] = useState<'criar' | 'editar' | null>(null);

  const iniciarEdicao = (canal: CanalVenda) => {
    setEditandoCanal({ ...canal });
    setModoEdicao('editar');
  };

  const iniciarCriacao = () => {
    setNovoCanal({ nome: '', taxa: 0 });
    setModoEdicao('criar');
  };

  const cancelarEdicao = () => {
    setEditandoCanal(null);
    setNovoCanal({ nome: '', taxa: 0 });
    setModoEdicao(null);
  };

  const salvarCanal = () => {
    if (modoEdicao === 'editar' && editandoCanal) {
      if (!editandoCanal.nome.trim()) {
        toast({
          title: "Erro",
          description: "Nome do canal é obrigatório",
          variant: "destructive",
        });
        return;
      }

      const canaisAtualizados = canaisVenda.map(c => 
        c.id === editandoCanal.id ? editandoCanal : c
      );
      setCanaisVenda(canaisAtualizados);
      
      toast({
        title: "Canal atualizado",
        description: `Canal "${editandoCanal.nome}" foi atualizado com sucesso`,
      });
    } else if (modoEdicao === 'criar') {
      if (!novoCanal.nome?.trim()) {
        toast({
          title: "Erro",
          description: "Nome do canal é obrigatório",
          variant: "destructive",
        });
        return;
      }

      const novoId = Date.now().toString();
      const canalCompleto: CanalVenda = {
        id: novoId,
        nome: novoCanal.nome,
        taxa: novoCanal.taxa || 0,
        icon: 'Store' // ícone padrão
      };

      setCanaisVenda([...canaisVenda, canalCompleto]);
      
      toast({
        title: "Canal criado",
        description: `Canal "${canalCompleto.nome}" foi criado com sucesso`,
      });
    }

    cancelarEdicao();
  };

  const removerCanal = (canalId: string) => {
    const canal = canaisVenda.find(c => c.id === canalId);
    if (!canal) return;

    // Verificar se há vendas usando este canal (implementação básica)
    const canaisAtualizados = canaisVenda.filter(c => c.id !== canalId);
    setCanaisVenda(canaisAtualizados);
    
    toast({
      title: "Canal removido",
      description: `Canal "${canal.nome}" foi removido`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Canais de Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão Criar Novo Canal */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure os canais de venda e suas respectivas taxas
            </p>
            <Button onClick={iniciarCriacao} disabled={modoEdicao !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Canal
            </Button>
          </div>

          {/* Formulário de Criação */}
          {modoEdicao === 'criar' && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Criar Novo Canal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome-novo">Nome do Canal</Label>
                  <Input
                    id="nome-novo"
                    value={novoCanal.nome || ''}
                    onChange={(e) => setNovoCanal({ ...novoCanal, nome: e.target.value })}
                    placeholder="Ex: iFood, Uber Eats, WhatsApp..."
                  />
                </div>
                <div>
                  <Label htmlFor="taxa-novo">Taxa (%)</Label>
                  <Input
                    id="taxa-novo"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={novoCanal.taxa || 0}
                    onChange={(e) => setNovoCanal({ ...novoCanal, taxa: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa cobrada pelo canal (deixe 0 se não houver taxa)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={salvarCanal} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Criar Canal
                  </Button>
                  <Button variant="outline" onClick={cancelarEdicao} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Canais */}
          <div className="space-y-3">
            <h3 className="font-medium">Canais Existentes</h3>
            {canaisVenda.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Nenhum canal de venda configurado</p>
                <p className="text-sm">Clique em "Novo Canal" para começar</p>
              </div>
            ) : (
              canaisVenda.map((canal) => (
                <Card key={canal.id} className={editandoCanal?.id === canal.id ? "border-primary" : ""}>
                  <CardContent className="pt-4">
                    {editandoCanal?.id === canal.id ? (
                      // Modo edição
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`nome-${canal.id}`}>Nome do Canal</Label>
                          <Input
                            id={`nome-${canal.id}`}
                            value={editandoCanal.nome}
                            onChange={(e) => setEditandoCanal({ ...editandoCanal, nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`taxa-${canal.id}`}>Taxa (%)</Label>
                          <Input
                            id={`taxa-${canal.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editandoCanal.taxa}
                            onChange={(e) => setEditandoCanal({ ...editandoCanal, taxa: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={salvarCanal} size="sm" className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button variant="outline" onClick={cancelarEdicao} size="sm" className="flex-1">
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo visualização
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{canal.nome}</h4>
                            <Badge variant={canal.taxa > 0 ? "secondary" : "default"}>
                              {canal.taxa > 0 ? `${canal.taxa}% taxa` : 'Sem taxa'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => iniciarEdicao(canal)}
                            disabled={modoEdicao !== null}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerCanal(canal.id)}
                            className="text-destructive hover:text-destructive"
                            disabled={modoEdicao !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Botão Fechar */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}