# Design

<!-- impeccable:design-schema 1 -->

Bokka é um sistema clínico operado por dentista brasileira entre atendimentos. Modo **Operate**: a interface serve a tarefa. Nenhum ornamento sobrevive à decisão de scanability. Direção assinada pelas cinco referências convergentes do usuário (Moru, DentalPro, Dentora, ficha do paciente Jerome Bellingham, telas mobile): **canon SaaS clínico moderno executado ao topo da categoria**, com identidade Bokka própria.

---

## Direção (contract)

- **THESIS:** o painel clínico que a dentista consulta doze vezes por dia sem cansar. Densidade legível. Um azul que carrega a marca sem cobrir a informação. Fundo claro sempre.
- **OWN-WORLD:** superfícies branco/quase-branco com um azul-cobalto único como carrier de marca (`#2A6BF2`), grafite grave para texto principal (`#0B1220`), superfícies elevadas em cinza-frio muito leve, badges de status em quatro tonalidades semânticas fixas. Cards com border 1px + shadow-sm — nunca `shadow-lg`, nunca glass, nunca gradient. Sidebar branca com item ativo em `#EAF1FF` e texto `#2A6BF2`.
- **STORY:** a dentista abre o Dashboard, vê agenda do dia + KPIs + estoque baixo em um viewport; clica no paciente da próxima consulta e cai direto na ficha com abas (Dados / Anamnese / Odontograma / Agendamentos). Zero fricção.
- **FIRST VIEWPORT (Dashboard):** sidebar 240px à esquerda, top bar com data e avatar, saudação personalizada, quatro KPI cards em linha (Agendamentos hoje, Receita mês, Saldo pendente, Pacientes ativos), tabela da agenda do dia ocupando 2/3 do restante e coluna lateral com estoque baixo + alertas.
- **FORM:** dashboard denso à la Moru/DentalPro. Não invento composição — sigo o canon que a categoria já provou funcionar em uso diário.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.

---

## Color tokens (Tailwind v4 `@theme`)

Paleta restrained: neutrals + um azul carrier + quatro semânticas fixas.

| Token | Hex | Uso |
|---|---|---|
| `--color-bokka-primary` | `#2A6BF2` | Botões primary, item ativo sidebar, links |
| `--color-bokka-primary-hover` | `#1E56D6` | Hover primary |
| `--color-bokka-primary-soft` | `#EAF1FF` | Background badge info, item ativo bg, chip selecionado |
| `--color-bokka-primary-ring` | `#93B8FC` | Focus ring |
| `--color-bokka-ink` | `#0B1220` | Texto principal, títulos |
| `--color-bokka-ink-2` | `#334155` | Texto secundário |
| `--color-bokka-ink-3` | `#64748B` | Texto meta, hints, labels de tabela |
| `--color-bokka-surface` | `#FFFFFF` | Cards, modals, sidebar |
| `--color-bokka-surface-2` | `#F8FAFC` | App background |
| `--color-bokka-surface-3` | `#F1F5F9` | Card secundário, hover row |
| `--color-bokka-border` | `#E2E8F0` | Bordas de card, table divider |
| `--color-bokka-border-strong` | `#CBD5E1` | Bordas de input, divisores fortes |
| `--color-bokka-success` | `#10B981` | Confirmado, pago |
| `--color-bokka-success-soft` | `#D1FAE5` | Badge success bg |
| `--color-bokka-warning` | `#F59E0B` | Pendente, atenção, estoque baixo |
| `--color-bokka-warning-soft` | `#FEF3C7` | Badge warning bg |
| `--color-bokka-danger` | `#EF4444` | Cancelado, erro, faltou |
| `--color-bokka-danger-soft` | `#FEE2E2` | Badge danger bg |
| `--color-bokka-neutral-soft` | `#F1F5F9` | Badge neutro bg (realizado) |

**Contraste verificado:** `bokka-ink` sobre `bokka-surface` = 18.7:1 (AAA). `bokka-primary` sobre `bokka-surface` = 4.9:1 (AA large + AA body). Semânticas soft carregam texto em tom escuro do mesmo hue.

---

## Typography

- **Face:** **Inter** (brief-pinada), via Google Fonts `wght@400;500;600;700`. Fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Scale (ratio 1.125):** `12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48`.
- **Tracking floor:** `-0.011em` em body, `-0.02em` em headings ≥ 24px, `-0.03em` em display ≥ 36px.
- **Line-height:** 1.5 em body 14/16, 1.35 em headings, 1.2 em display.
- **Weights:** 400 body, 500 UI labels/table cells, 600 headings/buttons, 700 KPI números.
- **Números:** `font-variant-numeric: tabular-nums` em toda tabela e KPI (evita jitter de linha em atualização).

---

## Spacing & radius

- **Spacing:** sistema 4px de Tailwind. Padrões: `p-4` (16) em cards padrão, `p-6` (24) em cards grandes, `gap-3` (12) entre KPI cards, `gap-6` (24) entre seções principais. Mais espaço acima de heading que abaixo.
- **Radius:**
  - `rounded-md` (6px) — botões, inputs, selects, badges retangulares
  - `rounded-lg` (8px) — cards de lista
  - `rounded-xl` (12px) — cards padrão, modals
  - `rounded-2xl` (16px) — KPI cards, cards de destaque
  - `rounded-full` — avatares, badges pill, botões redondos

## Shadows

- `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.04)`) — cards padrão em repouso
- `shadow` (`0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)`) — cards em hover, popovers
- `shadow-md` (`0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)`) — modals, dropdowns
- **Nunca:** `shadow-xl`, `shadow-2xl`, hard-offset shadow, colored halo shadow.

---

## Motion

- **Duração padrão:** 150ms (`ease-out`) para hover/focus, 200ms para toggles, 250ms para modal enter, 180ms para toast enter.
- **Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (exponential ease-out) para tudo que aparece.
- **Uma cena autoral:** modal enter faz scale 0.98 → 1 + opacity 0 → 1 em 200ms. Todo o resto é fade + subtle transform.
- **Sem:** parallax, scattered hover effects, spinning icons como decoração.

---

## Componentes base

Todos em `src/components/ui/`. Cada componente estritamente sob os tokens acima.

- **Button** — 4 variantes (`primary` cobalt, `secondary` outline slate, `ghost` transparent, `danger` red), 3 sizes (`sm`, `md`, `lg`), estados: default/hover/focus/active/disabled/loading. Loading = spinner Lucide `Loader2` girando em vez do label. Focus visible: `outline` + `outline-offset-2` em `--color-bokka-primary-ring`.
- **Input, Textarea, Select** — border-strong, focus ring 2px em primary-ring, error state em `bokka-danger` com mensagem `text-sm` abaixo.
- **Card** — variantes `default`, `kpi`, `panel`. Sempre `bg-bokka-surface` + `border` + `shadow-sm` + `rounded-xl`. Nunca aninhado. `KpiCard` tem ícone Lucide 20px em box `rounded-lg` de fundo soft por tom + label + valor 30px bold tabular + delta opcional.
- **Table** — header em `bg-bokka-surface-3`, texto uppercase `text-xs tracking-wide` cinza. Rows com `hover:bg-bokka-surface-3`. Divide-y em `bokka-border`. Actions à direita como ícones ghost (Edit, Eye, Trash) com tooltip nativo `title`.
- **Badge** — 5 variantes semânticas fixas (success, warning, danger, info, neutral), sempre `text-xs font-medium` em background soft com texto em hue escuro do mesmo tom. Não emitir cor arbitrária.
- **Modal** — `@headlessui/react Dialog` + Transition. Overlay `bg-black/40 backdrop-blur-sm`. Card `rounded-2xl shadow-md p-6`, max-w responsivo por prop (`sm`/`md`/`lg`/`xl`). Fechar com Esc + click fora + botão X.
- **Sidebar** — 240px desktop, drawer em mobile (com backdrop). Logo Bokka 32px no topo. Grupos com label uppercase `text-xs` cinza em `px-3 pt-4 pb-1`. Items com ícone Lucide 18px + label. Item ativo: `bg-bokka-primary-soft text-bokka-primary`. Logout no rodapé em separado.
- **TopBar** — 64px altura, sticky top-0, border-bottom `bokka-border`, `bg-bokka-surface/80 backdrop-blur`. Contém: hamburger (mobile), breadcrumb/título, busca (icon Lucide + input ghost), sino de notificação, avatar + nome + data.
- **StatusBadge** — mapeamento fixo por enum:
  - Agendamento: AGENDADO=info, CONFIRMADO=success, REALIZADO=neutral, FALTOU=warning, CANCELADO=danger
  - Financeiro: PENDENTE=warning, PARCIAL=info, PAGO=success, ATRASADO=danger, CANCELADO=neutral
- **Skeleton** — retângulos `rounded-md bg-bokka-surface-3` com `animate-pulse`. Padrão de tabela: 5 linhas de altura h-10.
- **EmptyState** — ícone Lucide 32px em círculo `bg-bokka-primary-soft text-bokka-primary`, título 18px medium, descrição 14px cinza, CTA opcional. Copy útil sempre em pt-BR ("Nenhum paciente cadastrado. Comece adicionando o primeiro!").
- **Pagination** — botões Anterior/Próxima + indicador "Página X de Y" + total de itens. Params: `pagina`, `tamanho`, `ordem` (backend em pt-BR).
- **Toast** — `react-hot-toast` com tema custom (bg surface, border, ícone Lucide). Suporte a "Desfazer" via action button (preservar UX atual).

---

## Layout global

- **App shell:** `flex min-h-screen bg-bokka-surface-2` — sidebar fixed left + main container `flex-1 min-w-0`.
- **Page container:** `mx-auto max-w-[1440px] px-4 lg:px-8 py-6`.
- **Section heading:** `text-2xl font-semibold text-bokka-ink` + eventual `text-sm text-bokka-ink-3` como sublinha (fato, não eyebrow).

---

## Anti-referências (banidas nesta build)

- Gradient text, glass decorativo, hard offset shadow, border-left colorida grossa, emoji como ícone, monospace decorativo, kicker/eyebrow acima de heading, section numbers (01/02/03), cards uniformes com ícone+heading+texto como estrutura da página, nested cards, sparklines substituindo conteúdo, spinning icons decorativas, dark mode default.

---

## Assets

- **Logo Bokka:** SVG inline em `src/components/BokkaMark.tsx` — mark abstrata construída (não figurativa; sem dente estilizado — evita "dental clip-art") composta por um "B" em cobalt sobre fundo transparente. Uso: 32px na sidebar, 40px na tela de login. Peso alto (700), tracking apertado.
- **Ícones:** Lucide React exclusivamente. Strokes 1.75, size 18 na sidebar/tables, 20 em KPIs, 16 inline em texto.
