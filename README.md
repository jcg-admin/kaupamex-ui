# PracticaYoruba UI

Frontend del e-commerce de productos Yoruba. Construido con React 19 + Redux Toolkit + Webpack 5.

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 19 + JSX |
| Estado global | Redux Toolkit 2 + React Query 5 |
| Routing | React Router 6 |
| Estilos | SCSS Modules + sistema de design tokens Yoruba |
| Tests | Jest 29 + React Testing Library 16 |
| Build | Webpack 5 (code splitting, contenthash, tree shaking) |

## Estructura

```
src/
├── app/              Componente raíz y providers
├── components/       Componentes UI reutilizables
│   ├── common/       Button, Card, Form, Toast, Badge, Skeleton...
│   ├── layout/       Header, Footer, Sidebar
│   └── shared/       ProtectedRoute, ErrorBoundary, LazyLoad
├── constants/        Constantes del dominio (estados, rutas, moneda)
├── context/          ToastContext
├── hooks/            Hooks de dominio (useAuth, useCart)
├── layouts/          StorefrontLayout, AccountLayout, AdminLayout
├── lib/              queryClient (React Query)
├── mocks/            Datos mock para desarrollo
├── pages/            Páginas por ruta (lazy-loaded)
├── redux/
│   ├── slices/       auth, ui, catalog, cart, checkout, orders, wishlist
│   └── selectors/    Selectores memoizados (reselect)
├── router/           AppRouter con rutas públicas, protegidas y admin
├── services/         apiService (fetch con retry y timeout)
├── styles/
│   ├── abstracts/    _variables.scss, _mixins.scss (paleta Yoruba)
│   ├── base/         _reset.scss, _typography.scss
│   ├── components/   _buttons.scss, _cards.scss, _forms.scss...
│   ├── layouts/      _header.scss, _sidebar.scss
│   └── utils/        _utilities.scss
└── utils/            formatters.js (precios, fechas, SKU)
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar API_URL=http://localhost:8000

# Iniciar servidor de desarrollo (puerto 3001)
npm run dev

# Tests
npm test
npm run test:coverage

# Build de producción
npm run build
npm run build:analyze   # con reporte de bundle
```

## Feature flags

En `.env.local`, cada dominio puede usar `mock` o `real`:

```
PY_AUTH_SOURCE=mock      # usa datos locales
PY_CATALOG_SOURCE=real   # llama al backend
```

## Paleta de colores Yoruba

| Token | Valor | Uso |
|-------|-------|-----|
| `$primary-color` | `#B8860B` | CTA, botones, highlights |
| `$secondary-color` | `#3D1F0D` | Headers, texto oscuro |
| `$accent-color` | `#CC4A1B` | Badges, urgencia, descuentos |
| `$bg-page` | `#FAFAF7` | Fondo de página |

## Documentación

| Documento | Tema |
|-----------|------|
| [docs/scss-pipeline.md](docs/scss-pipeline.md) | Arquitectura de estilos, stylelint, sass-check y pre-push hook |
| [docs/scss-audit.md](docs/scss-audit.md) | Auditoría de uso real de SCSS: tokens, duplicación, imports |
| [docs/scss-remediation-plan.md](docs/scss-remediation-plan.md) | Plan de remediación SCSS por fases y tareas atómicas |

## Relación con el backend

Este proyecto consume la API REST de `PracticaYoruba-api` (Django 5 + DRF).
Ver la documentación completa de UCs y endpoints en `PracticaYoruba-doc`.

Los tokens JWT los maneja el backend en **httpOnly cookies** — nunca
se almacenan en Redux ni en localStorage.
