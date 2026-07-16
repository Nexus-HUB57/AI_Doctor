# Fase 3 - Componentes de UI e Navegação

## 📋 Resumo

A Fase 3 implementa a estrutura completa de navegação, componentes base reutilizáveis e sistema de temas para o AI_Doctor v3.0. Esta fase estabelece a fundação visual e de interação para todos os módulos da plataforma.

## 🎯 Objetivos Alcançados

### ✅ 1. Estrutura de Navegação Principal

#### NavigationContext (`src/contexts/NavigationContext.tsx`)
- **Propósito**: Gerenciar estado global de navegação
- **Funcionalidades**:
  - Rastreamento da aba ativa
  - Histórico de navegação (previousTab)
  - Estado do sidebar (aberto/fechado)
  - Hook `useNavigation()` para acesso em qualquer componente

#### Tipos de Abas Suportadas
```typescript
'dashboard' | 'diagnostic' | 'board' | 'analytics' | 'livebook' | 
'telemedicine' | 'research' | 'advanced' | 'moltbook' | 'cerebro' | 
'wormhole' | 'blackhole' | 'onco_research' | 'eradication'
```

### ✅ 2. Componentes de Layout

#### Sidebar (`src/components/Sidebar.tsx`)
- **Características**:
  - Navegação colapsável (64px quando fechado, 256px quando aberto)
  - Organização em categorias: Módulos Principais e Avançado
  - Logo com versão (v3.0)
  - Perfil do usuário
  - Botão de logout
  - Transições suaves
  - Ícones com descrições
  - Indicadores visuais de módulo ativo

#### TopBar (`src/components/TopBar.tsx`)
- **Características**:
  - Exibição dinâmica do módulo ativo
  - Ícone e descrição do módulo
  - Barra de busca responsiva
  - Notificações com indicador
  - Status do usuário (Online/Offline)
  - Sticky no topo
  - Gradientes por módulo

#### MainLayout (`src/components/MainLayout.tsx`)
- **Características**:
  - Integração de Sidebar + TopBar
  - Área de conteúdo responsiva
  - Fundo com gradiente
  - Padding automático

### ✅ 3. Componentes Base Reutilizáveis

#### Card (`src/components/base/Card.tsx`)
```typescript
<Card variant="default|elevated|ghost|gradient" hover={true}>
  Conteúdo
</Card>
```
- Variantes: default, elevated, ghost, gradient
- Suporte a hover effects
- Classes customizáveis

#### Button (`src/components/base/Button.tsx`)
```typescript
<Button 
  variant="primary|secondary|danger|ghost|gradient"
  size="sm|md|lg"
  isLoading={false}
  icon={IconComponent}
  iconPosition="left|right"
>
  Clique aqui
</Button>
```
- 5 variantes de estilo
- 3 tamanhos
- Suporte a ícones
- Estado de carregamento

#### Badge (`src/components/base/Badge.tsx`)
```typescript
<Badge variant="success|warning|error|info|primary|secondary" size="sm|md|lg">
  Status
</Badge>
```
- 6 variantes de cor
- 3 tamanhos
- Borders coloridos

#### StatCard (`src/components/base/StatCard.tsx`)
```typescript
<StatCard 
  label="Pacientes Ativos"
  value={342}
  icon={UsersIcon}
  trend={12}
  color="cyan"
  description="Últimos 30 dias"
/>
```
- Exibição de métricas
- Indicadores de tendência
- Cores customizáveis

#### Modal (`src/components/base/Modal.tsx`)
```typescript
<Modal 
  isOpen={true}
  onClose={() => {}}
  title="Título"
  size="md|lg|xl"
  footer={<FooterContent />}
>
  Conteúdo do Modal
</Modal>
```
- Backdrop com blur
- 4 tamanhos
- Suporte a footer
- Scroll automático

#### TabGroup (`src/components/base/TabGroup.tsx`)
```typescript
<TabGroup 
  tabs={[
    { id: 'tab1', label: 'Tab 1', icon: Icon1, content: <Content1 /> },
    { id: 'tab2', label: 'Tab 2', icon: Icon2, content: <Content2 /> },
  ]}
  activeTabId="tab1"
  onTabChange={(id) => {}}
  variant="default|pills|underline"
/>
```
- 3 variantes de estilo
- Suporte a ícones
- Gerenciamento de estado

### ✅ 4. Sistema de Temas e Estilos

#### Arquivo de Temas (`src/styles/themes.ts`)

**Paletas de Cores**:
- Primary (Cyan): 50-900
- Secondary (Slate): 50-950
- Success (Emerald): 50-900
- Warning (Amber): 50-900
- Error (Red): 50-900
- Rose: 50-900
- Purple: 50-900

**Gradientes Predefinidos**:
- `gradient-primary`: Cyan → Blue
- `gradient-dashboard`: Blue → Cyan
- `gradient-diagnostic`: Blue → Cyan
- `gradient-board`: Amber → Rose
- `gradient-analytics`: Green → Emerald
- `gradient-livebook`: Cyan → Blue
- `gradient-telemedicine`: Rose → Pink
- `gradient-research`: Purple → Pink
- `gradient-advanced`: Purple → Pink

**Sombras**:
- sm, md, lg, xl
- Sombras coloridas (cyan, blue, purple, rose)
- Sombra interna

**Tipografia**:
- Headings: h1-h6
- Body: body, bodySmall, bodyXSmall
- Mono: mono, monoBold, monoSmall

**Espaçamento**: xs-4xl

**Border Radius**: sm-full

**Transições**: fast, base, slow, slower

#### Estilos Globais (`src/index.css`)

**Animações Customizadas**:
- `fadeIn`: Fade in suave
- `slideInUp/Down/Left/Right`: Slides direcionais
- `pulse-glow`: Pulso com brilho
- `float`: Flutuação suave

**Classes Utilitárias**:
- `.fade-in`, `.slide-in-*`, `.pulse-glow`, `.float`
- `.gradient-*`: Gradientes por módulo
- `.shadow-*`: Sombras coloridas
- `.glass`, `.glass-dark`: Glassmorphism
- `.hover-lift`, `.hover-glow`: Efeitos de hover
- `.focus-ring`: Estados de foco

**Elementos Customizados**:
- Scrollbar personalizada
- Inputs e textareas estilizados
- Tabelas com hover
- Links com cores do tema
- Code blocks

#### Hook useTheme (`src/hooks/useTheme.ts`)
```typescript
const { theme, toggleTheme, isDark, isLight } = useTheme();
```
- Gerenciamento de tema (light/dark)
- Persistência em localStorage
- Detecção de preferência do sistema

### ✅ 5. Configurações e Constantes

#### Arquivo de Constantes (`src/config/constants.ts`)

**Configurações Globais**:
- APP_NAME, APP_VERSION, APP_DESCRIPTION
- MODULES: Todos os módulos disponíveis
- AGENT_STATUS: Estados de agentes
- PATIENT_STATUS: Estados de pacientes
- TREATMENT_STATUS: Estados de tratamentos
- RECOMMENDATION_STATUS: Estados de recomendações

**Dados Clínicos**:
- TUMOR_TYPES: 12 tipos de tumores
- CANCER_STAGES: 5 estágios de câncer
- MEDICAL_SPECIALTIES: 12 especialidades
- BIOMARKER_TYPES: 12 biomarcadores
- MUTATION_TYPES: 8 tipos de mutações

**Configurações de API**:
- API_ENDPOINTS: Endpoints principais
- PAGINATION: Configurações de paginação
- TIMEOUTS: Timeouts para requisições
- SESSION_CONFIG: Configurações de sessão

**Validação**:
- MIN_PASSWORD_LENGTH: 8
- MAX_NAME_LENGTH: 255
- MAX_EMAIL_LENGTH: 320

**Armazenamento Local**:
- LOCAL_STORAGE_KEYS: Chaves para localStorage
- BREAKPOINTS: Breakpoints do Tailwind

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── Sidebar.tsx              # Navegação lateral
│   ├── TopBar.tsx               # Barra superior
│   ├── MainLayout.tsx           # Layout principal
│   └── base/
│       ├── Card.tsx             # Componente Card
│       ├── Button.tsx           # Componente Button
│       ├── Badge.tsx            # Componente Badge
│       ├── StatCard.tsx         # Componente StatCard
│       ├── Modal.tsx            # Componente Modal
│       ├── TabGroup.tsx         # Componente TabGroup
│       └── index.ts             # Exportações
├── contexts/
│   └── NavigationContext.tsx    # Contexto de navegação
├── hooks/
│   └── useTheme.ts              # Hook de tema
├── styles/
│   └── themes.ts                # Configurações de tema
├── config/
│   └── constants.ts             # Constantes globais
└── index.css                    # Estilos globais
```

## 🎨 Paleta de Cores

### Cores Principais
- **Cyan**: #06b6d4 (Primária)
- **Blue**: #0284c7 (Secundária)
- **Slate**: #1e293b (Neutra)

### Cores de Status
- **Emerald**: #22c55e (Sucesso)
- **Amber**: #f59e0b (Aviso)
- **Red**: #ef4444 (Erro)
- **Rose**: #ec4899 (Destaque)

### Cores de Módulos
- **Dashboard**: Blue → Cyan
- **Diagnostic**: Blue → Cyan
- **Board**: Amber → Rose
- **Analytics**: Green → Emerald
- **LiveBook**: Cyan → Blue
- **Telemedicine**: Rose → Pink
- **Research**: Purple → Pink
- **Advanced**: Purple → Pink

## 🔧 Como Usar

### Importar Componentes Base
```typescript
import { Card, Button, Badge, StatCard, Modal, TabGroup } from '@/components/base';

// Usar componentes
<Card variant="elevated">
  <Button variant="primary">Clique aqui</Button>
  <Badge variant="success">Ativo</Badge>
</Card>
```

### Usar Navegação
```typescript
import { useNavigation } from '@/contexts/NavigationContext';

function MyComponent() {
  const { activeTab, setActiveTab } = useNavigation();
  
  return (
    <button onClick={() => setActiveTab('diagnostic')}>
      Ir para Diagnóstico
    </button>
  );
}
```

### Usar Tema
```typescript
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Tema: {theme}
    </button>
  );
}
```

### Usar Constantes
```typescript
import { MODULES, TUMOR_TYPES, MEDICAL_SPECIALTIES } from '@/config/constants';

// Acessar valores
console.log(MODULES.DIAGNOSTIC);
console.log(TUMOR_TYPES);
```

## 📊 Responsividade

Todos os componentes são responsivos usando Tailwind CSS:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Comportamentos Responsivos
- **Sidebar**: Colapsável em mobile
- **TopBar**: Barra de busca oculta em mobile
- **Grid**: Ajusta colunas automaticamente
- **Tipografia**: Redimensiona em mobile

## 🚀 Próximas Fases

### Fase 4: Integração de Dados
- Conectar componentes com APIs
- Implementar tRPC routers
- Gerenciamento de estado com React Query

### Fase 5: Módulos Específicos
- Dashboard Hub completo
- Diagnóstico Assistido
- Junta Médica PhD
- Analytics em Tempo Real
- LiveBook-rRNA
- Telemedicina Acolhedora
- Research Dashboard
- Painéis Avançados

### Fase 6: Testes e Otimização
- Testes unitários
- Testes de integração
- Performance optimization
- Acessibilidade (a11y)

## 📝 Notas

- Todos os componentes suportam TypeScript
- Estilos usando Tailwind CSS v4
- Animações suaves e transições
- Tema escuro como padrão
- Suporte a light mode (implementado)
- Ícones usando Lucide React

## 🔗 Referências

- [Tailwind CSS](https://tailwindcss.com)
- [Lucide React Icons](https://lucide.dev)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Status**: ✅ Completo
**Data**: Julho 2026
**Versão**: 3.0.0
