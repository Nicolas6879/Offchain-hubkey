# Offchain Hubs - Design System & UI/UX Guidelines

> **Guia oficial de design para desenvolvimento consistente e profissional**
> 
> Versão 2.0 | Atualizado: 2025

---

## 📋 Índice

1. [Filosofia de Design](#filosofia-de-design)
2. [Sistema de Cores](#sistema-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento & Grid](#espaçamento--grid)
5. [Componentes](#componentes)
6. [Padrões de Layout](#padrões-de-layout)
7. [Interações & Animações](#interações--animações)
8. [Responsividade](#responsividade)
9. [Acessibilidade](#acessibilidade)
10. [Exemplos de Código](#exemplos-de-código)

---

## 🎨 Filosofia de Design

### Princípios Fundamentais

#### 1. **Flat Design**
- ❌ **NUNCA** usar cards aninhados dentro de cards
- ✅ Hierarquia visual através de espaçamento e tipografia
- ✅ Bordas sutis em vez de elevações exageradas
- ✅ Uso mínimo de sombras (apenas para hover/focus)

#### 2. **Consistência Visual**
- Sempre usar variáveis CSS de `themes.css`
- Nunca usar cores hardcoded
- Manter espaçamento harmônico
- Seguir padrões estabelecidos

#### 3. **Performance First**
- Animações via CSS Transforms (GPU accelerated)
- useMemo para cálculos pesados
- Lazy loading quando apropriado
- Bundle size otimizado

#### 4. **Mobile First**
- Design responsivo desde o início
- Touch targets mínimos de 44x44px
- Layouts adaptativos, não apenas responsivos

#### 5. **Accessibility by Default**
- Contraste WCAG 2.1 AA mínimo
- Navegação por teclado completa
- ARIA labels onde necessário
- Screen reader friendly

---

## 🎨 Sistema de Cores

### Cores Primárias

Sempre usar variáveis CSS do arquivo `themes.css`:

```css
/* Fundos */
--bg-main: hsl(0, 0%, 0%);         /* Fundo principal */
--bg-surface-1: hsl(0, 0%, 5%);    /* Cards/superfícies nível 1 */
--bg-surface-2: hsl(0, 0%, 10%);   /* Botões/superfícies nível 2 */

/* Textos */
--text-primary: hsl(0, 0%, 95%);   /* Títulos */
--text-secondary: hsl(0, 0%, 70%); /* Subtítulos */

/* Cor de Marca (Vermelho Alaranjado) */
--primary-light: hsl(14, 100%, 67%);  /* Hover states */
--primary-main: hsl(14, 100%, 57%);   /* Cor principal */
--primary-dark: hsl(14, 100%, 47%);   /* Estados ativos */
--primary-contrast: hsl(0, 0%, 100%); /* Texto sobre primária */

/* Bordas */
--border-color: hsl(0, 0%, 15%);
--border-light: hsl(0, 0%, 20%);
```

### Cores Semânticas

Use cores HSL diretas para significados específicos:

```css
/* Success (Verde) */
hsl(150, 80%, 40%)    /* Verde escuro */
hsl(150, 60%, 50%)    /* Verde médio */

/* Error/Danger (Vermelho) */
hsl(0, 80%, 50%)      /* Vermelho principal */
hsl(0, 70%, 45%)      /* Vermelho escuro */

/* Warning (Amarelo/Laranja) */
hsl(40, 80%, 50%)     /* Amarelo/laranja */

/* Info (Cinza) */
hsl(0, 0%, 40%)       /* Cinza médio */
```

### Uso de Cores

#### ✅ Fazer

```css
.my-component {
  background: var(--bg-surface-1);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.success-badge {
  background: hsla(150, 80%, 40%, 0.95);
  color: white;
}
```

#### ❌ Não Fazer

```css
.my-component {
  background: #0d0d0d;  /* ❌ Hardcoded */
  color: #f2f2f2;       /* ❌ Hardcoded */
  border: 1px solid #262626; /* ❌ Hardcoded */
}
```

---

## 📝 Tipografia

### Família de Fontes

```css
font-family: "Styrene A Web", "Helvetica Neue", Sans-Serif;
```

### Hierarquia de Tamanhos

| Elemento | Desktop | Mobile | Weight | Line Height |
|----------|---------|--------|--------|-------------|
| **Page Title** | 2.25rem (36px) | 1.75rem (28px) | 700 | 1.2 |
| **Section Title** | 1.75rem (28px) | 1.5rem (24px) | 700 | 1.3 |
| **Card Title** | 1.375rem (22px) | 1.25rem (20px) | 700 | 1.3 |
| **Subtitle** | 1rem (16px) | 0.9375rem (15px) | 400 | 1.5 |
| **Body Text** | 0.9375rem (15px) | 0.875rem (14px) | 400 | 1.6 |
| **Small Text** | 0.875rem (14px) | 0.8125rem (13px) | 500 | 1.4 |
| **Caption** | 0.75rem (12px) | 0.75rem (12px) | 700 | 1.3 |

### Pesos de Fonte

- **100-300**: Light (use raramente)
- **400**: Regular (body text)
- **500**: Medium (labels, buttons)
- **600**: Semibold (subtitles, strong emphasis)
- **700**: Bold (titles, headings)
- **900**: Black (use raramente, apenas para impacto)

### Letter Spacing

```css
/* Titles - mais compacto */
letter-spacing: -0.02em;

/* Body - padrão */
letter-spacing: 0;

/* Labels/Captions - mais espaçado */
letter-spacing: 0.05em;
text-transform: uppercase;
```

### Exemplo de Uso

```css
.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

---

## 📐 Espaçamento & Grid

### Sistema de Espaçamento (rem)

Use múltiplos de `0.25rem` (4px):

| Tamanho | rem | px | Uso |
|---------|-----|----|----|
| **XXS** | 0.25rem | 4px | Gaps mínimos |
| **XS** | 0.5rem | 8px | Spacing interno pequeno |
| **SM** | 0.75rem | 12px | Gaps entre elementos relacionados |
| **MD** | 1rem | 16px | Spacing padrão |
| **LG** | 1.5rem | 24px | Sections, cards |
| **XL** | 2rem | 32px | Major sections |
| **XXL** | 3rem | 48px | Page sections |

### Grid System

#### Container Max Width

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
```

#### CSS Grid Layout

```css
/* Cards Grid - Responsivo */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

/* Stats Grid - 4 colunas em desktop */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}
```

### Padding Padrões

```css
/* Page sections */
.page-header {
  padding: 2rem 1.5rem 1.5rem;
}

.page-content {
  padding: 1.5rem;
}

/* Cards */
.card {
  padding: 1.5rem;
}

/* Buttons */
.button {
  padding: 0.75rem 1.25rem;
}

/* Small buttons */
.button-sm {
  padding: 0.5rem 1rem;
}
```

---

## 🧩 Componentes

### 1. Botões

#### Botão Primário

```css
.btn-primary {
  background: var(--primary-main);
  color: var(--primary-contrast);
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px hsla(14, 100%, 57%, 0.3);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px hsla(14, 100%, 57%, 0.4);
}
```

#### Botão Secundário

```css
.btn-secondary {
  background: var(--bg-surface-2);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.875rem 2rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-main);
  background: var(--bg-main);
}
```

#### Botão Danger

```css
.btn-danger {
  background: var(--bg-surface-2);
  color: hsl(0, 80%, 50%);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: hsl(0, 80%, 50%);
  color: white;
  border-color: hsl(0, 80%, 50%);
  box-shadow: 0 4px 12px hsla(0, 80%, 50%, 0.3);
}
```

### 2. Cards

#### Card Básico

```css
.card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-main);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2),
              0 0 0 1px var(--primary-main);
}
```

#### ❌ NÃO fazer cards aninhados

```html
<!-- ❌ ERRADO -->
<div class="card">
  <div class="card">  <!-- Card dentro de card -->
    Conteúdo
  </div>
</div>

<!-- ✅ CORRETO -->
<div class="card">
  <div class="card-section">  <!-- Section, não card -->
    Conteúdo
  </div>
</div>
```

### 3. Inputs & Search

#### Search Box

```css
.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0 1rem;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: var(--primary-main);
  box-shadow: 0 0 0 3px hsla(14, 100%, 57%, 0.1);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.875rem 0;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
}
```

### 4. Badges

#### Status Badges

```css
.badge {
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.badge-success {
  background: hsla(150, 80%, 40%, 0.95);
  color: white;
}

.badge-danger {
  background: hsla(0, 80%, 50%, 0.95);
  color: white;
}

.badge-warning {
  background: hsla(40, 80%, 50%, 0.95);
  color: white;
}

.badge-neutral {
  background: hsla(0, 0%, 40%, 0.95);
  color: white;
}
```

### 5. Toggle Switch

```css
.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: var(--bg-surface-2);
  border: 2px solid var(--border-color);
  border-radius: 13px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: var(--text-secondary);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active {
  background: var(--primary-main);
  border-color: var(--primary-main);
}

.toggle-switch.active::before {
  left: 24px;
  background: white;
}
```

### 6. Filter Chips

```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--primary-main);
  background: var(--bg-main);
}

.filter-chip.active {
  background: var(--primary-main);
  border-color: var(--primary-main);
  color: var(--primary-contrast);
}
```

---

## 🏗️ Padrões de Layout

### Layout de Página Completa

```html
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-text">
        <h1 class="page-title">Título da Página</h1>
        <p class="page-subtitle">Subtítulo ou descrição</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary">+ Ação Principal</button>
      </div>
    </div>
  </div>

  <!-- Stats Bar (opcional) -->
  <div class="stats-bar">
    <div class="stats-container">
      <!-- Stats items -->
    </div>
  </div>

  <!-- Controls (filtros, busca, etc) -->
  <div class="controls-bar">
    <div class="controls-container">
      <!-- Search, filters, sort, view toggle -->
    </div>
  </div>

  <!-- Content -->
  <div class="page-content">
    <div class="content-grid">
      <!-- Content items -->
    </div>
  </div>
</div>
```

### Header Pattern

```css
.page-header {
  background: var(--bg-surface-1);
  border-bottom: 1px solid var(--border-color);
  padding: 2rem 1.5rem 1.5rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
}
```

### Stats Bar Pattern (Compact Version)

**Design Philosophy**: Stats should be informative but not dominate page space. Keep them compact and scannable.

```css
.stats-bar {
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem; /* Reduced from 1.5rem */
}

.stats-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Reduced from 200px */
  gap: 1rem; /* Reduced from 1.5rem */
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Reduced from 1rem */
  padding: 0.875rem 1rem; /* Reduced from 1.25rem */
  background: var(--bg-surface-1);
  border: 1px solid var(--border-color);
  border-radius: 10px; /* Reduced from 12px */
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: var(--primary-main);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.75rem; /* Reduced from 2.5rem */
  color: var(--primary-main);
  opacity: 0.9;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem; /* Reduced from 0.25rem */
}

.stat-value {
  font-size: 1.375rem; /* Reduced from 1.75rem */
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.75rem; /* Reduced from 0.875rem */
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
}
```

**Usage Guidelines:**
- Use for dashboard metrics and key performance indicators
- Keep to 3-4 stats maximum per row for optimal scanning
- Icons should be simple and recognizable at smaller sizes
- Values should be concise (use abbreviations: 1.2K, 5M, etc.)
- Labels should be short (2-3 words max)

### Empty State Pattern

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 6rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  color: var(--text-secondary);
  opacity: 0.3;
}

.empty-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.empty-text {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 400px;
}
```

---

## ⚡ Interações & Animações

### Transições Padrão

```css
/* Transição padrão para a maioria dos elementos */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Transição rápida para hover states */
transition: all 0.2s ease;

/* Transição para transforms (mais suave) */
transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover States

#### Elevação (Cards, Botões)

```css
.element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.element:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}
```

#### Border Color Change

```css
.element {
  border: 1px solid var(--border-color);
  transition: border-color 0.3s ease;
}

.element:hover {
  border-color: var(--primary-main);
}
```

### Focus States

```css
.interactive-element:focus {
  outline: 2px solid var(--primary-main);
  outline-offset: 2px;
}

/* Para inputs */
.input:focus {
  border-color: var(--primary-main);
  box-shadow: 0 0 0 3px hsla(14, 100%, 57%, 0.1);
}
```

### Animações de Entrada

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Down */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Uso */
.page {
  animation: fadeIn 0.4s ease-out;
}

.header {
  animation: slideDown 0.5s ease-out;
}

.content {
  animation: fadeInUp 0.6s ease-out;
}
```

### Ripple Effect (Botões)

```css
.btn {
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}
```

---

## 📱 Responsividade

### Breakpoints

```css
/* Extra Small (< 480px) */
@media (max-width: 480px) {
  /* Mobile pequeno */
}

/* Small (480px - 768px) */
@media (max-width: 768px) {
  /* Mobile/Tablet pequeno */
}

/* Medium (768px - 1200px) */
@media (max-width: 1200px) {
  /* Tablet/Desktop pequeno */
}

/* Large (> 1200px) */
/* Desktop - estilos padrão */
```

### Padrões Responsivos

#### Grid Responsivo

```css
/* Desktop: 3-4 colunas */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

/* Tablet */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

#### Header Responsivo

```css
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
```

#### Padding Responsivo

```css
/* Desktop */
.page-header {
  padding: 2rem 1.5rem 1.5rem;
}

/* Mobile */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 1rem 1rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1.5rem 1rem 1rem;
  }
}
```

#### Tipografia Responsiva

```css
/* Desktop */
.page-title {
  font-size: 2.25rem;
}

/* Tablet */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }
}
```

---

## ♿ Acessibilidade

### Contraste de Cores

Sempre manter contraste mínimo WCAG 2.1 Level AA:
- **Texto normal**: 4.5:1
- **Texto grande**: 3:1
- **Elementos UI**: 3:1

### Focus States

```css
/* SEMPRE fornecer focus visible */
.interactive:focus {
  outline: 2px solid var(--primary-main);
  outline-offset: 2px;
}

/* Remover outline apenas se houver alternativa visual */
.button:focus {
  outline: none; /* OK porque temos box-shadow abaixo */
  box-shadow: 0 0 0 3px hsla(14, 100%, 57%, 0.3);
}
```

### Tamanhos de Touch Targets

```css
/* Mínimo 44x44px para elementos interativos */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.25rem;
}
```

### ARIA Labels

```html
<!-- Botões com ícones apenas -->
<button aria-label="Pesquisar" title="Pesquisar">
  <SearchIcon />
</button>

<!-- Status dinâmico -->
<div role="status" aria-live="polite">
  {filteredItems.length} resultados encontrados
</div>

<!-- Loading -->
<div role="status" aria-label="Carregando">
  <div class="spinner"></div>
</div>
```

### Navegação por Teclado

```css
/* Tab order lógico */
.container {
  /* Usar order do flexbox com cuidado */
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-main);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## 💻 Exemplos de Código

### Exemplo Completo: Página de Lista

```tsx
import React, { useState, useMemo } from 'react';
import { SearchIcon, FilterIcon, GridViewIcon } from '@mui/icons-material';
import './MyPage.css';

interface Item {
  id: string;
  name: string;
  description: string;
}

const MyPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtered items with useMemo for performance
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Minha Página</h1>
            <p className="page-subtitle">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <button className="btn-primary">
            + Criar Novo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <SearchIcon className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{items.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="controls-container">
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <SearchIcon className="empty-icon" />
            <h3 className="empty-title">Nenhum item encontrado</h3>
            <p className="empty-text">
              Tente ajustar sua busca ou adicione um novo item
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="card">
                <h3 className="card-title">{item.name}</h3>
                <p className="card-description">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
```

### CSS Correspondente

```css
/* Page Container */
.page {
  min-height: 100vh;
  background: var(--bg-main);
  animation: fadeIn 0.4s ease-out;
}

/* Header */
.page-header {
  background: var(--bg-surface-1);
  border-bottom: 1px solid var(--border-color);
  padding: 2rem 1.5rem 1.5rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Stats */
.stats-bar {
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem;
}

.stats-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* Content */
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

/* Card */
.card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-main);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2),
              0 0 0 1px var(--primary-main);
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 📋 Checklist de Implementação

Ao criar uma nova página, verifique:

### Design
- [ ] Usa variáveis CSS de `themes.css`
- [ ] Sem cards aninhados (flat design)
- [ ] Hierarquia visual clara
- [ ] Espaçamento consistente (múltiplos de 0.25rem)
- [ ] Border radius padronizado (10-14px)
- [ ] Sombras apenas em hover/focus

### Tipografia
- [ ] Tamanhos de fonte da escala definida
- [ ] Pesos de fonte apropriados
- [ ] Line-height adequado (1.2-1.6)
- [ ] Letter-spacing em títulos (-0.02em)

### Interatividade
- [ ] Hover states em elementos clicáveis
- [ ] Focus states visíveis
- [ ] Transições suaves (0.3s cubic-bezier)
- [ ] Animações de entrada

### Responsividade
- [ ] Mobile first approach
- [ ] Breakpoints definidos (768px, 1200px)
- [ ] Grid adaptativo
- [ ] Touch targets mínimos (44px)

### Acessibilidade
- [ ] Contraste WCAG AA (4.5:1)
- [ ] Navegação por teclado funcional
- [ ] ARIA labels onde necessário
- [ ] Focus states adequados
- [ ] Alt text em imagens

### Performance
- [ ] useMemo para cálculos pesados
- [ ] CSS Transforms para animações
- [ ] Lazy loading quando apropriado
- [ ] Bundle size otimizado

---

## 🎯 Princípios de Código

### React/TypeScript

```tsx
// ✅ FAZER - Componentes funcionais com hooks
const MyComponent: React.FC<Props> = ({ data }) => {
  const [state, setState] = useState<Type>(initialValue);
  
  const computed = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);

  return <div>{/* JSX */}</div>;
};

// ✅ FAZER - Interfaces para props
interface CardProps {
  title: string;
  description?: string;
  onClick: () => void;
}

// ✅ FAZER - useMemo para listas filtradas
const filtered = useMemo(() => {
  return items.filter(predicate);
}, [items, predicate]);
```

### CSS

```css
/* ✅ FAZER - Variáveis CSS */
.element {
  background: var(--bg-surface-1);
  color: var(--text-primary);
}

/* ✅ FAZER - Mobile first */
.element {
  font-size: 1rem; /* Mobile */
}

@media (min-width: 768px) {
  .element {
    font-size: 1.25rem; /* Desktop */
  }
}

/* ❌ NÃO FAZER - Cores hardcoded */
.element {
  background: #0d0d0d; /* ❌ */
  color: #f2f2f2; /* ❌ */
}

/* ❌ NÃO FAZER - !important */
.element {
  color: red !important; /* ❌ */
}
```

---

## 📚 Recursos e Referências

### Inspirações de Design
- **Material Design 3**: Elevation, shadows, ripple
- **Tailwind UI**: Grid patterns, spacing
- **Stripe Dashboard**: Clean design, hierarchy
- **Linear App**: Typography, animations
- **Vercel**: Color usage, micro-interactions

### Ferramentas Úteis
- **Figma**: Prototipagem e design
- **Coolors**: Paletas de cores
- **Type Scale**: Escalas tipográficas
- **Can I Use**: Compatibilidade de CSS
- **WebAIM Contrast Checker**: Verificar contraste

### Documentação
- [MDN Web Docs](https://developer.mozilla.org)
- [CSS-Tricks](https://css-tricks.com)
- [A11y Project](https://www.a11yproject.com)
- [Material-UI](https://mui.com)

---

## 🔄 Changelog

### v2.0 (2025)
- ✅ Design System completo baseado no EventList
- ✅ Flat design principles
- ✅ Sistema de cores HSL
- ✅ Guia de componentes
- ✅ Padrões de responsividade
- ✅ Guidelines de acessibilidade
- ✅ Exemplos de código completos

### v1.0
- Sistema de temas basic
- Componentes básicos

---

## 📧 Contato

Para dúvidas ou sugestões sobre o Design System:
- Abra uma issue no repositório
- Consulte a equipe de design

---

**Última atualização**: 2025
**Versão**: 2.0
**Status**: ✅ Production Ready

**Lembre-se**: Consistência é chave. Siga este guia para manter a qualidade e coerência visual em todo o aplicativo Offchain Hubs! 🎨✨

