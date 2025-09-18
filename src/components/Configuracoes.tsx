import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { 
  Settings, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Store,
  Key,
  Palette,
  HardDrive,
  Loader2
} from "lucide-react";

export default function Configuracoes() {
  const { configuracaoLoja, setConfiguracaoLoja } = useApp();
  
  const [nomeLoja, setNomeLoja] = useState(configuracaoLoja.nomeLoja);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(configuracaoLoja.logoUrl);
  const [tema, setTema] = useState(configuracaoLoja.tema);
  
  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregandoSenha, setCarregandoSenha] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(false);

  // Atualizar estados quando o contexto mudar
  useEffect(() => {
    setNomeLoja(configuracaoLoja.nomeLoja);
    setLogoPreview(configuracaoLoja.logoUrl);
    setTema(configuracaoLoja.tema);
  }, [configuracaoLoja]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
    }
  };

  const salvarConfiguracoes = async () => {
    if (nomeLoja.trim() === "") {
      toast.error("Nome da loja é obrigatório.");
      return;
    }

    setCarregandoConfig(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('configuracoes_usuario')
        .upsert({
          user_id: user.id,
          nome_loja: nomeLoja.trim(),
          logo_url: logoPreview,
          tema: tema
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        toast.error('Erro ao salvar configurações: ' + error.message);
        return;
      }

      // Atualizar contexto local
      setConfiguracaoLoja({
        nomeLoja: nomeLoja.trim(),
        logoUrl: logoPreview,
        tema: tema as 'claro' | 'escuro' | 'cinza'
      });

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setCarregandoConfig(false);
    }
  };

  const alterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos de senha.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('Nova senha e confirmação não coincidem.');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregandoSenha(true);
    
    try {
      // Reautenticar o usuário com a senha atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Usuário não encontrado');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) {
        toast.error('Erro ao alterar senha: ' + updateError.message);
        return;
      }

      toast.success('Senha alterada com sucesso!');
      
      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setCarregandoSenha(false);
    }
  };

  const exportarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar todos os dados do usuário
      const [configResult, produtosResult, vendasResult, canaisResult, faturamentoResult] = await Promise.all([
        supabase.from('configuracoes_usuario').select('*').eq('user_id', user.id).single(),
        supabase.from('produtos').select('*').eq('user_id', user.id),
        supabase.from('vendas').select('*, itens_venda(*), canais_venda(*)').eq('user_id', user.id),
        supabase.from('canais_venda').select('*').eq('user_id', user.id),
        supabase.from('faturamento_mensal').select('*').eq('user_id', user.id)
      ]);

      const dadosExportacao = {
        configuracoes: configResult.data || {},
        produtos: produtosResult.data || [],
        vendas: vendasResult.data || [],
        canais: canaisResult.data || [],
        faturamento: faturamentoResult.data || [],
        dataExportacao: new Date().toISOString()
      };

      // Criar blob para download
      const dataStr = JSON.stringify(dadosExportacao, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Criar link para download
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-acai-manager-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar dados: ' + error.message);
    }
  };

  const limparCache = async () => {
    try {
      // Fazer logout do Supabase
      await supabase.auth.signOut();
      
      // Limpar localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      toast.success('Cache limpo com sucesso! Faça login novamente.');
    } catch (error: any) {
      toast.error('Erro ao limpar cache: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua loja e conta
        </p>
      </div>

      {/* Informações da Loja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informações da Loja
          </CardTitle>
          <CardDescription>
            Configure o nome e logo da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-loja">Nome da Loja</Label>
            <Input
              id="nome-loja"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              placeholder="Digite o nome da sua loja"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo">Logo da Loja</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="flex-1"
              />
              {logoPreview && (
                <img 
                  src={logoPreview} 
                  alt="Preview da logo" 
                  className="w-12 h-12 rounded-lg object-cover border"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha-atual">Senha Atual</Label>
            <div className="relative">
              <Input
                id="senha-atual"
                type={senhaVisivel ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSenhaVisivel(!senhaVisivel)}
              >
                {senhaVisivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <Input
              id="nova-senha"
              type={senhaVisivel ? "text" : "password"}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha (mín. 6 caracteres)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
            <Input
              id="confirmar-senha"
              type={senhaVisivel ? "text" : "password"}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>
          
          <Button onClick={alterarSenha} className="w-full" disabled={carregandoSenha}>
            {carregandoSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do painel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tema">Tema do Painel</Label>
            <Select value={tema} onValueChange={(value: 'claro' | 'escuro' | 'cinza') => setTema(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">Claro</SelectItem>
                <SelectItem value="cinza">Cinza</SelectItem>
                <SelectItem value="escuro">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Backup e Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup e Dados
          </CardTitle>
          <CardDescription>
            Gerencie seus dados salvos no Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportarDados} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
            
            <Button onClick={limparCache} variant="outline" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Cache e Sair
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Dados Seguros:</strong> Suas informações são armazenadas com segurança no Supabase. 
              Use a exportação para fazer backup dos seus dados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarConfiguracoes} className="px-8" disabled={carregandoConfig}>
          {carregandoConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Settings className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}