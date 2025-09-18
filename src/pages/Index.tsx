import { useState } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import Fornecedores from "@/components/Fornecedores";
import Produtos from "@/components/Produtos";
import Vendas from "@/components/Vendas";
import Despesas from "@/components/Despesas";
import Configuracoes from "@/components/Configuracoes";
import FechaCaixa from "@/components/FechaCaixa";

interface IndexProps {
  onLogout: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'vendas':
        return <Vendas />;
      case 'despesas':
        return <Despesas />;
      case 'produtos':
        return <Produtos />;
      case 'fornecedores':
        return <Fornecedores />;
      case 'fechar-caixa':
        return <FechaCaixa />;
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
