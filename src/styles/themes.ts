/**
 * Sistema de Temas para AI_Doctor v3.0
 * Define paletas de cores, tipografia e componentes reutilizáveis
 */

export const colors = {
  // Primárias
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },
  
  // Secundárias (Cyan)
  cyan: {
    50: '#ecf9ff',
    100: '#cff9ff',
    200: '#a5f3ff',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // Neutras (Slate)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Sucesso (Emerald)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  // Aviso (Amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Erro (Red)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Destaque (Rose)
  rose: {
    50: '#fff5f7',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fbcfe8',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },

  // Purple (Avançado)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
};

export const gradients = {
  // Gradientes principais
  primary: 'from-cyan-600 to-blue-600',
  primaryHover: 'from-cyan-700 to-blue-700',
  
  // Gradientes de módulos
  dashboard: 'from-blue-500 to-cyan-500',
  diagnostic: 'from-blue-500 to-cyan-500',
  board: 'from-amber-500 to-rose-500',
  analytics: 'from-green-500 to-emerald-500',
  livebook: 'from-cyan-500 to-blue-500',
  telemedicine: 'from-rose-500 to-pink-500',
  research: 'from-purple-500 to-pink-500',
  advanced: 'from-purple-600 to-pink-600',
  
  // Gradientes de fundo
  bgDark: 'from-slate-950 via-slate-900 to-slate-950',
  bgCard: 'from-slate-800/50 to-slate-900/50',
  
  // Gradientes de sucesso/erro
  success: 'from-emerald-500 to-green-500',
  error: 'from-red-500 to-rose-500',
  warning: 'from-amber-500 to-orange-500',
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  
  // Sombras com cores
  cyan: 'shadow-lg shadow-cyan-600/50',
  blue: 'shadow-lg shadow-blue-600/50',
  purple: 'shadow-lg shadow-purple-600/50',
  rose: 'shadow-lg shadow-rose-600/50',
  
  // Sombra interna
  inner: 'shadow-inner',
};

export const typography = {
  // Headings
  h1: 'text-5xl md:text-6xl font-black tracking-tighter',
  h2: 'text-4xl font-black tracking-tight',
  h3: 'text-3xl font-bold tracking-tight',
  h4: 'text-2xl font-bold',
  h5: 'text-xl font-bold',
  h6: 'text-lg font-bold',
  
  // Body
  body: 'text-base font-normal',
  bodySmall: 'text-sm font-normal',
  bodyXSmall: 'text-xs font-normal',
  
  // Special
  mono: 'font-mono',
  monoBold: 'font-mono font-bold',
  monoSmall: 'font-mono text-sm',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
  '4xl': '4rem',
};

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: 'transition-all duration-150',
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  slower: 'transition-all duration-500',
};

// Temas predefinidos
export const themes = {
  light: {
    bg: colors.slate[50],
    bgSecondary: colors.slate[100],
    text: colors.slate[900],
    textSecondary: colors.slate[600],
    border: colors.slate[200],
    primary: colors.cyan[600],
  },
  dark: {
    bg: colors.slate[950],
    bgSecondary: colors.slate[900],
    text: colors.slate[50],
    textSecondary: colors.slate[400],
    border: colors.slate[800],
    primary: colors.cyan[500],
  },
};

export default {
  colors,
  gradients,
  shadows,
  typography,
  spacing,
  borderRadius,
  transitions,
  themes,
};
