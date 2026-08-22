# Bokka Web — Frontend

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Deploy](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflarepages&logoColor=white)](https://bokka.com.br)

SPA completa para gestão de clínicas odontológicas, consumindo a [Bokka API](https://github.com/wilsonborgesbr/odonto-clinic-api) (backend). Interface responsiva com design system próprio, odontograma interativo, dashboard com KPIs e módulo financeiro com auditoria.

🔗 **Produção:** [bokka.com.br](https://bokka.com.br)
🔗 **Backend (API):** [github.com/wilsonborgesbr/odonto-clinic-api](https://github.com/wilsonborgesbr/odonto-clinic-api)

---

## Screenshots

> ⚠️ O sistema requer autenticação. Abaixo estão capturas das principais telas.

| Dashboard | Odontograma | Agenda |
|:---------:|:-----------:|:------:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Odontograma](docs/screenshots/odontograma.png) | ![Agenda](docs/screenshots/agenda.png) |

| Financeiro | Pacientes | Login |
|:----------:|:---------:|:-----:|
| ![Financeiro](docs/screenshots/financeiro.png) | ![Pacientes](docs/screenshots/pacientes.png) | ![Login](docs/screenshots/login.png) |


---

## Tecnologias

- **React 19** com **TypeScript 6**
- **Vite 8** — build e dev server
- **Tailwind CSS 4** — estilização utility-first
- **TanStack React Query 5** — gerenciamento de estado do servidor, cache e sincronização
- **React Router 7** — roteamento SPA
- **Recharts 3** — gráficos (receita mensal, agendamentos, auditoria)
- **Headless UI** — componentes acessíveis sem estilo pré-definido
- **Axios** — requisições HTTP
- **Lucide React** — ícones

## Funcionalidades

- **33 páginas** cobrindo todos os módulos da clínica
- **Design system customizado** com 18 componentes reutilizáveis (Card, Button, Modal, Badge, Skeleton, EmptyState, Pagination, Toast, Avatar, Field, entre outros)
- **Dashboard** com KPIs em tempo real e gráficos de receita mensal e agendamentos
- **Odontograma SVG interativo** com representação anatômica de 32 dentes e 5 faces clicáveis por dente
- **Módulo de auditoria financeira** com gráficos de pizza e barras
- **Agenda visual** com navegação por dia/semana
- **Busca global** e **sistema de notificações**
- **Rotas protegidas com RBAC** — sidebar e botões condicionais por permissão do usuário (8 roles, 14 permissões granulares propagadas via JWT do backend)

## Como executar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/wilsonborgesbr/odonto-clinic-web.git
cd odonto-clinic-web

# 2. Instale as dependências
npm install

# 3. Configure a URL da API no arquivo de ambiente
#    Crie um .env com: VITE_API_URL=http://localhost:8080

# 4. Execute
npm run dev
```

O app sobe em `http://localhost:5173` por padrão.

> **Pré-requisito:** o [backend (Bokka API)](https://github.com/wilsonborgesbr/odonto-clinic-api) precisa estar rodando para o frontend funcionar.

## Estrutura de pastas

```
src/
├── components/       # Design system (18 componentes reutilizáveis)
├── contexts/         # AuthContext, NotificationContext
├── hooks/            # Custom hooks (useAuth, usePermissions, etc.)
├── pages/            # 33 páginas organizadas por módulo
├── services/         # Camada de requisições HTTP (Axios)
├── types/            # Tipagens TypeScript
└── utils/            # Funções utilitárias
```

## Deploy

Deploy em produção via **Cloudflare Pages** com auto-deploy a partir do branch `main` no GitHub.

- **Domínio:** [bokka.com.br](https://bokka.com.br)
- **CDN:** Cloudflare (global edge)
- **CORS:** restrito aos domínios de produção

## Autor

**Wilson Borges** — Estudante de Análise e Desenvolvimento de Sistemas

- GitHub: [github.com/wilsonborgesbr](https://github.com/wilsonborgesbr)
- LinkedIn: [linkedin.com/in/wilsonborgeslima](https://www.linkedin.com/in/wilsonborgeslima/)
