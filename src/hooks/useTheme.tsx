import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

export function useTheme() {
  const { configuracaoLoja } = useApp();

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
    // Para tema 'claro', não adiciona nenhuma classe (usa o :root padrão)
  }, [configuracaoLoja.tema]);

  return configuracaoLoja.tema;
}