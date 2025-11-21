/**
 * OFFCHAIN HUBKEY - UTILITÁRIOS DE TEMA
 * Funções simples para gerenciar temas usando CSS custom properties
 */

export type Theme = 'light' | 'dark';

/**
 * Obtém o tema atual do localStorage ou detecta a preferência do sistema
 */
export const getCurrentTheme = (): Theme => {
  // Primeiro verifica o estado atual do documento
  const currentDataTheme = document.documentElement.getAttribute('data-theme');
  if (currentDataTheme === 'light') {
    return 'light';
  } else if (currentDataTheme === null || currentDataTheme === 'dark') {
    return 'dark';
  }
  
  // Se não conseguir determinar pelo documento, verifica o localStorage
  const savedTheme = localStorage.getItem('offchain-theme') as Theme;
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
    return savedTheme;
  }
  
  // Se não houver tema salvo, detecta a preferência do sistema
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return 'dark'; // Padrão é dark mode
};

/**
 * Aplica o tema no documento
 */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme'); // Remove para usar o :root padrão (dark)
  }
  
  // Salva no localStorage
  localStorage.setItem('offchain-theme', theme);
};

/**
 * Alterna entre os temas
 */
export const toggleTheme = (): Theme => {
  const currentTheme = getCurrentTheme();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  return newTheme;
};

/**
 * Inicializa o tema na aplicação
 * Deve ser chamado no início da aplicação
 */
export const initializeTheme = (): Theme => {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
};

/**
 * Obtém informações sobre o tema atual (sem estado React)
 */
export const getThemeInfo = () => {
  const currentTheme = getCurrentTheme();
  return {
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light'
  };
}; 