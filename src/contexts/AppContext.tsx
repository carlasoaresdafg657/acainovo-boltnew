import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interfaces
export interface Produto {
  id: string;
  nome: string;
  custoUnitario: number;
  valorVenda: number;
  lucro: number;
  margemLucro: number;
  dataCriacao: string;
}

export interface CanalVenda {
  id: string;
  nome: string;
  taxa: number;
  icon: string;
}

export interface ItemVenda {
  produtoId: string;
  produto: Produto;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  canalVendaId: string;
  canalVenda: CanalVenda;
  frete: number;
  taxarFrete: boolean;
  subtotalProdutos: number;
  taxaCanal: number;
  valorTotal: number;
  lucroTotal: number;
  status: 'ativa' | 'cancelada';
  dataVenda: string;
  observacoes?: string;
}

export interface DespesaVenda {
  id: string;
  vendaId: string;
  tipo: 'taxa_canal' | 'custo_produto';
  descricao: string;
  valor: number;
  data: string;
}

export interface FaturamentoMensal {
  id: string;
  mes: number;
  ano: number;
  faturamento: number;
  lucroPJDistribuido: number; // Lucro distribuído da PJ para PF
  transferenciaPF: number; // Valor transferido para conta PF
  dataFechamento: string;
}

export interface ConfiguracaoMEI {
  limiteMEI: number;
  anoCorrente: number;
}

// Canais de venda padrão
const canaisVendaInicial: CanalVenda[] = [
  { id: '1', nome: 'Instagram', taxa: 0, icon: 'Instagram' },
  { id: '2', nome: 'iFood', taxa: 12, icon: 'Truck' },
  { id: '3', nome: 'Uber Eats', taxa: 25, icon: 'Truck' },
  { id: '4', nome: 'Rappi', taxa: 18, icon: 'Truck' },
  { id: '5', nome: 'WhatsApp', taxa: 0, icon: 'Phone' },
  { id: '6', nome: 'Ponto Físico', taxa: 0, icon: 'Store' }
];

// Produtos iniciais (sincronizado com Produtos.tsx)
const produtosIniciais: Produto[] = [
  {
    id: '1',
    nome: 'Açaí 500ml',
    custoUnitario: 2.50,
    valorVenda: 8.00,
    lucro: 5.50,
    margemLucro: 68.75,
    dataCriacao: new Date().toISOString().split('T')[0]
  },
  {
    id: '2',
    nome: 'Açaí 300ml',
    custoUnitario: 1.80,
    valorVenda: 6.00,
    lucro: 4.20,
    margemLucro: 70.00,
    dataCriacao: new Date().toISOString().split('T')[0]
  }
];

// Configurações da loja
export interface ConfiguracaoLoja {
  nomeLoja: string;
  logoUrl: string;
  tema: 'claro' | 'escuro' | 'cinza';
}

interface AppContextType {
  // Produtos
  produtos: Produto[];
  setProdutos: (produtos: Produto[]) => void;
  
  // Vendas
  vendas: Venda[];
  setVendas: (vendas: Venda[]) => void;
  adicionarVenda: (venda: Omit<Venda, 'id' | 'dataVenda'>) => void;
  cancelarVenda: (vendaId: string) => void;
  
  // Canais de venda
  canaisVenda: CanalVenda[];
  setCanaisVenda: (canais: CanalVenda[]) => void;
  
  // Despesas geradas pelas vendas
  despesasVendas: DespesaVenda[];
  
  // Faturamento Mensal e MEI
  faturamentoMensal: FaturamentoMensal[];
  setFaturamentoMensal: (faturamento: FaturamentoMensal[]) => void;
  adicionarFaturamentoMensal: (faturamento: Omit<FaturamentoMensal, 'id' | 'dataFechamento'>) => void;
  configuracaoMEI: ConfiguracaoMEI;
  setConfiguracaoMEI: (config: ConfiguracaoMEI) => void;
  adicionarLucroPJ: (mes: number, ano: number, valor: number) => void;
  adicionarTransferenciaPF: (mes: number, ano: number, valor: number) => void;
  
  // Configurações da loja
  configuracaoLoja: ConfiguracaoLoja;
  setConfiguracaoLoja: (config: ConfiguracaoLoja) => void;
  
  // Métricas calculadas
  getMetricas: () => {
    vendasHoje: number;
    vendasSemana: number;
    vendasMes: number;
    despesasHoje: number;
    despesasSemana: number;
    despesasMes: number;
    lucroHoje: number;
    lucroSemana: number;
    lucroMes: number;
    totalVendas: number;
    totalCanceladas: number;
    vendasPorCanal: Array<{
      canal: CanalVenda;
      quantidade: number;
      valorBruto: number;
      valorLiquido: number;
      taxas: number;
    }>;
  };
  
  // Métricas MEI
  getMetricasMEI: () => {
    faturamentoAnoCorrente: number;
    percentualLimite: number;
    statusLimite: 'normal' | 'atencao' | 'critico';
    faturamentoPorMes: Array<{
      mes: number;
      ano: number;
      faturamento: number;
      lucroPJDistribuido: number;
      transferenciaPF: number;
    }>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [canaisVenda, setCanaisVenda] = useState<CanalVenda[]>([]);
  const [despesasVendas, setDespesasVendas] = useState<DespesaVenda[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensal[]>([]);
  const [configuracaoMEI, setConfiguracaoMEI] = useState<ConfiguracaoMEI>({
    limiteMEI: 81000,
    anoCorrente: new Date().getFullYear()
  });
  const [configuracaoLoja, setConfiguracaoLoja] = useState<ConfiguracaoLoja>({
    nomeLoja: 'Açaí Manager',
    logoUrl: '',
    tema: 'claro'
  });
  const [loading, setLoading] = useState(true);

  // Apply theme when configuracaoLoja.tema changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove('dark', 'gray');
    
    // Aplica a classe baseada no tema atual
    if (configuracaoLoja.tema === 'escuro') {
      root.classList.add('dark');
    } else if (configuracaoLoja.tema === 'cinza') {
      root.classList.add('gray');
    }
  }, [configuracaoLoja.tema]);

  // Carregar dados do Supabase quando o usuário fizer login
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await Promise.all([
            carregarProdutos(),
            carregarCanaisVenda(),
            carregarVendas(),
            carregarConfiguracoes(),
            carregarFaturamentoMensal()
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadUserData();
      } else if (event === 'SIGNED_OUT') {
        // Limpar dados quando o usuário sair
        setProdutos([]);
        setVendas([]);
        setCanaisVenda([]);
        setDespesasVendas([]);
        setFaturamentoMensal([]);
        setConfiguracaoMEI({ limiteMEI: 81000, anoCorrente: new Date().getFullYear() });
        setConfiguracaoLoja({ nomeLoja: 'Açaí Manager', logoUrl: '', tema: 'claro' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return;
    }

    const produtosFormatados: Produto[] = data.map(p => ({
      id: p.id,
      nome: p.nome,
      custoUnitario: p.custo_unitario,
      valorVenda: p.valor_venda,
      lucro: p.lucro,
      margemLucro: p.margem_lucro,
      dataCriacao: p.created_at.split('T')[0]
    }));

    setProdutos(produtosFormatados);
  };

  const carregarCanaisVenda = async () => {
    const { data, error } = await supabase
      .from('canais_venda')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar canais:', error);
      return;
    }

    const canaisFormatados: CanalVenda[] = data.map(c => ({
      id: c.id,
      nome: c.nome,
      taxa: c.taxa || 0,
      icon: c.icon || 'Store'
    }));

    setCanaisVenda(canaisFormatados);
  };

  const carregarVendas = async () => {
    const { data: vendasData, error: vendasError } = await supabase
      .from('vendas')
      .select(`
        *,
        itens_venda (
          *,
          produtos (*)
        ),
        canais_venda (*)
      `)
      .order('created_at', { ascending: false });

    if (vendasError) {
      console.error('Erro ao carregar vendas:', vendasError);
      return;
    }

    const vendasFormatadas: Venda[] = vendasData.map(v => ({
      id: v.id,
      itens: v.itens_venda.map((item: any) => ({
        produtoId: item.produto_id,
        produto: {
          id: item.produtos.id,
          nome: item.produtos.nome,
          custoUnitario: item.produtos.custo_unitario,
          valorVenda: item.produtos.valor_venda,
          lucro: item.produtos.lucro,
          margemLucro: item.produtos.margem_lucro,
          dataCriacao: item.produtos.created_at.split('T')[0]
        },
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
        subtotal: item.subtotal
      })),
      canalVendaId: v.canal_venda_id,
      canalVenda: {
        id: v.canais_venda.id,
        nome: v.canais_venda.nome,
        taxa: v.canais_venda.taxa || 0,
        icon: v.canais_venda.icon || 'Store'
      },
      frete: v.frete || 0,
      taxarFrete: v.taxar_frete || false,
      subtotalProdutos: v.subtotal_produtos,
      taxaCanal: v.taxa_canal || 0,
      valorTotal: v.valor_total,
      lucroTotal: v.lucro_total,
      status: v.status as 'ativa' | 'cancelada',
      dataVenda: v.created_at,
      observacoes: v.observacoes || undefined
    }));

    setVendas(vendasFormatadas);
  };

  const carregarConfiguracoes = async () => {
    const { data, error } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar configurações:', error);
      return;
    }

    if (data) {
      setConfiguracaoMEI({
        limiteMEI: data.limite_mei || 81000,
        anoCorrente: data.ano_corrente || new Date().getFullYear()
      });
      
      setConfiguracaoLoja({
        nomeLoja: data.nome_loja || 'Açaí Manager',
        logoUrl: data.logo_url || '',
        tema: data.tema as 'claro' | 'escuro' | 'cinza' || 'claro'
      });
    }
  };

  const carregarFaturamentoMensal = async () => {
    const { data, error } = await supabase
      .from('faturamento_mensal')
      .select('*')
      .order('ano', { ascending: false })
      .order('mes', { ascending: false });

    if (error) {
      console.error('Erro ao carregar faturamento:', error);
      return;
    }

    const faturamentoFormatado: FaturamentoMensal[] = data.map(f => ({
      id: f.id,
      mes: f.mes,
      ano: f.ano,
      faturamento: f.faturamento || 0,
      lucroPJDistribuido: f.lucro_pj_distribuido || 0,
      transferenciaPF: f.transferencia_pf || 0,
      dataFechamento: f.created_at
    }));

    setFaturamentoMensal(faturamentoFormatado);
  };

  const adicionarVenda = async (dadosVenda: Omit<Venda, 'id' | 'dataVenda'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Inserir venda no Supabase
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          user_id: user.id,
          canal_venda_id: dadosVenda.canalVendaId,
          subtotal_produtos: dadosVenda.subtotalProdutos,
          frete: dadosVenda.frete,
          taxar_frete: dadosVenda.taxarFrete,
          taxa_canal: dadosVenda.taxaCanal,
          valor_total: dadosVenda.valorTotal,
          lucro_total: dadosVenda.lucroTotal,
          status: dadosVenda.status,
          observacoes: dadosVenda.observacoes
        })
        .select()
        .single();

      if (vendaError) {
        toast.error('Erro ao salvar venda: ' + vendaError.message);
        return;
      }

      // Inserir itens da venda
      const itensVenda = dadosVenda.itens.map(item => ({
        venda_id: vendaData.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        subtotal: item.subtotal
      }));

      const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensVenda);

      if (itensError) {
        toast.error('Erro ao salvar itens da venda: ' + itensError.message);
        return;
      }

      toast.success('Venda cadastrada com sucesso!');
      
      // Recarregar vendas
      await carregarVendas();
      
    } catch (error: any) {
      toast.error('Erro ao cadastrar venda: ' + error.message);
    }
  };

  const adicionarFaturamentoMensal = async (dadosFaturamento: Omit<FaturamentoMensal, 'id' | 'dataFechamento'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('faturamento_mensal')
        .upsert({
          user_id: user.id,
          mes: dadosFaturamento.mes,
          ano: dadosFaturamento.ano,
          faturamento: dadosFaturamento.faturamento,
          lucro_pj_distribuido: dadosFaturamento.lucroPJDistribuido,
          transferencia_pf: dadosFaturamento.transferenciaPF
        }, {
          onConflict: 'user_id,mes,ano'
        });

      if (error) {
        toast.error('Erro ao salvar faturamento: ' + error.message);
        return;
      }

      toast.success('Faturamento salvo com sucesso!');
      await carregarFaturamentoMensal();
      
    } catch (error: any) {
      toast.error('Erro ao salvar faturamento: ' + error.message);
    }
  };

  const adicionarLucroPJ = async (mes: number, ano: number, valor: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('faturamento_mensal')
        .select('lucro_pj_distribuido')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .single();

      const novoValor = (existing?.lucro_pj_distribuido || 0) + valor;

      const { error } = await supabase
        .from('faturamento_mensal')
        .upsert({
          user_id: user.id,
          mes,
          ano,
          lucro_pj_distribuido: novoValor
        }, {
          onConflict: 'user_id,mes,ano'
        });

      if (error) {
        toast.error('Erro ao salvar lucro PJ: ' + error.message);
        return;
      }

      await carregarFaturamentoMensal();
    } catch (error: any) {
      toast.error('Erro ao salvar lucro PJ: ' + error.message);
    }
  };

  const adicionarTransferenciaPF = async (mes: number, ano: number, valor: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('faturamento_mensal')
        .select('transferencia_pf')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .single();

      const novoValor = (existing?.transferencia_pf || 0) + valor;

      const { error } = await supabase
        .from('faturamento_mensal')
        .upsert({
          user_id: user.id,
          mes,
          ano,
          transferencia_pf: novoValor
        }, {
          onConflict: 'user_id,mes,ano'
        });

      if (error) {
        toast.error('Erro ao salvar transferência PF: ' + error.message);
        return;
      }

      await carregarFaturamentoMensal();
    } catch (error: any) {
      toast.error('Erro ao salvar transferência PF: ' + error.message);
    }
  };

  const cancelarVenda = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from('vendas')
        .update({ status: 'cancelada' })
        .eq('id', vendaId);

      if (error) {
        toast.error('Erro ao cancelar venda: ' + error.message);
        return;
      }

      toast.success('Venda cancelada com sucesso!');
      await carregarVendas();
      
    } catch (error: any) {
      toast.error('Erro ao cancelar venda: ' + error.message);
    }
  };

  const getMetricas = () => {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const vendasAtivas = vendas.filter(v => v.status === 'ativa');
    const vendasCanceladas = vendas.filter(v => v.status === 'cancelada');

    // Vendas por período
    const vendasHoje = vendasAtivas
      .filter(v => new Date(v.dataVenda) >= inicioHoje)
      .reduce((sum, v) => sum + v.valorTotal, 0);

    const vendasSemana = vendasAtivas
      .filter(v => new Date(v.dataVenda) >= inicioSemana)
      .reduce((sum, v) => sum + v.valorTotal, 0);

    const vendasMes = vendasAtivas
      .filter(v => new Date(v.dataVenda) >= inicioMes)
      .reduce((sum, v) => sum + v.valorTotal, 0);

    // Despesas por período (apenas das vendas ativas)
    const vendasAtivasIds = vendasAtivas.map(v => v.id);
    const despesasAtivas = despesasVendas.filter(d => vendasAtivasIds.includes(d.vendaId));

    const despesasHoje = despesasAtivas
      .filter(d => new Date(d.data) >= inicioHoje)
      .reduce((sum, d) => sum + d.valor, 0);

    const despesasSemana = despesasAtivas
      .filter(d => new Date(d.data) >= inicioSemana)
      .reduce((sum, d) => sum + d.valor, 0);

    const despesasMes = despesasAtivas
      .filter(d => new Date(d.data) >= inicioMes)
      .reduce((sum, d) => sum + d.valor, 0);

    // Lucros
    const lucroHoje = vendasHoje - despesasHoje;
    const lucroSemana = vendasSemana - despesasSemana;
    const lucroMes = vendasMes - despesasMes;

    // Vendas por canal
    const vendasPorCanal = canaisVenda.map(canal => {
      const vendasDoCanal = vendasAtivas.filter(v => v.canalVendaId === canal.id);
      const quantidade = vendasDoCanal.length;
      const valorBruto = vendasDoCanal.reduce((sum, v) => sum + v.subtotalProdutos + v.frete, 0);
      const taxas = vendasDoCanal.reduce((sum, v) => sum + v.taxaCanal, 0);
      const valorLiquido = valorBruto - taxas;

      return {
        canal,
        quantidade,
        valorBruto,
        valorLiquido,
        taxas
      };
    });

    return {
      vendasHoje,
      vendasSemana,
      vendasMes,
      despesasHoje,
      despesasSemana,
      despesasMes,
      lucroHoje,
      lucroSemana,
      lucroMes,
      totalVendas: vendasAtivas.length,
      totalCanceladas: vendasCanceladas.length,
      vendasPorCanal: vendasPorCanal.filter(v => v.quantidade > 0)
    };
  };

  const getMetricasMEI = () => {
    const anoCorrente = configuracaoMEI.anoCorrente;
    
    // Calcular faturamento do ano corrente baseado nas vendas
    const vendasAnoCorrente = vendas
      .filter(v => v.status === 'ativa' && new Date(v.dataVenda).getFullYear() === anoCorrente)
      .reduce((sum, v) => sum + v.valorTotal, 0);

    // Somar faturamento registrado manualmente
    const faturamentoRegistrado = faturamentoMensal
      .filter(f => f.ano === anoCorrente)
      .reduce((sum, f) => sum + f.faturamento, 0);

    const faturamentoAnoCorrente = vendasAnoCorrente + faturamentoRegistrado;
    const percentualLimite = (faturamentoAnoCorrente / configuracaoMEI.limiteMEI) * 100;
    
    let statusLimite: 'normal' | 'atencao' | 'critico' = 'normal';
    if (faturamentoAnoCorrente >= 60000) statusLimite = 'atencao';
    if (faturamentoAnoCorrente >= 71000) statusLimite = 'critico';

    const faturamentoPorMes = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const vendasMes = vendas
        .filter(v => {
          const dataVenda = new Date(v.dataVenda);
          return v.status === 'ativa' && 
                 dataVenda.getFullYear() === anoCorrente && 
                 dataVenda.getMonth() + 1 === mes;
        })
        .reduce((sum, v) => sum + v.valorTotal, 0);

      const registroMensal = faturamentoMensal.find(f => f.mes === mes && f.ano === anoCorrente);
      
      return {
        mes,
        ano: anoCorrente,
        faturamento: vendasMes + (registroMensal?.faturamento || 0),
        lucroPJDistribuido: registroMensal?.lucroPJDistribuido || 0,
        transferenciaPF: registroMensal?.transferenciaPF || 0
      };
    });

    return {
      faturamentoAnoCorrente,
      percentualLimite,
      statusLimite,
      faturamentoPorMes
    };
  };

  if (loading) {
    return (
      <AppContext.Provider value={{
        produtos: [],
        setProdutos: () => {},
        vendas: [],
        setVendas: () => {},
        adicionarVenda: async () => {},
        cancelarVenda: async () => {},
        canaisVenda: [],
        setCanaisVenda: () => {},
        despesasVendas: [],
        faturamentoMensal: [],
        setFaturamentoMensal: () => {},
        adicionarFaturamentoMensal: async () => {},
        configuracaoMEI,
        setConfiguracaoMEI: () => {},
        adicionarLucroPJ: async () => {},
        adicionarTransferenciaPF: async () => {},
        configuracaoLoja,
        setConfiguracaoLoja: () => {},
        getMetricas: () => ({
          vendasHoje: 0, vendasSemana: 0, vendasMes: 0,
          despesasHoje: 0, despesasSemana: 0, despesasMes: 0,
          lucroHoje: 0, lucroSemana: 0, lucroMes: 0,
          totalVendas: 0, totalCanceladas: 0, vendasPorCanal: []
        }),
        getMetricasMEI: () => ({
          faturamentoAnoCorrente: 0, percentualLimite: 0,
          statusLimite: 'normal', faturamentoPorMes: []
        })
      }}>
        {children}
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{
      produtos,
      setProdutos,
      vendas,
      setVendas,
      adicionarVenda,
      cancelarVenda,
      canaisVenda,
      setCanaisVenda,
      despesasVendas,
      faturamentoMensal,
      setFaturamentoMensal,
      adicionarFaturamentoMensal,
      configuracaoMEI,
      setConfiguracaoMEI,
      adicionarLucroPJ,
      adicionarTransferenciaPF,
      configuracaoLoja,
      setConfiguracaoLoja,
      getMetricas,
      getMetricasMEI
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}