# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dentista proprietária de clínica odontológica de pequeno/médio porte (1–5 cadeiras) em Aracaju/SE, Brasil. Usa o sistema diariamente entre atendimentos e precisa de acesso rápido a agenda, cadastros e financeiro sem sair da tela. Recepcionistas e auxiliares também operam o sistema — recepção geralmente em desktop (monitor 22–27"), eventualmente em tablet. Ambiente: consultório com iluminação artificial LED/fluorescente, ritmo com pressa moderada entre pacientes.

## Product Purpose

Sistema de gestão completo para clínica odontológica. Centraliza agendamento, prontuário (anamnese e odontograma), cadastros (pacientes, dentistas, funcionários, convênios), financeiro (contas a receber com pagamento parcial, contas a pagar), estoque e documentos. Substitui planilhas e papel. Sucesso é a dentista conseguir operar toda a rotina da clínica sem sair do sistema.

## Positioning

Backend robusto com 12 módulos completos, API REST documentada em Swagger, detecção de conflito de horário em agendamentos no servidor, pagamento parcial com transição automática de status (PENDENTE → PARCIAL → PAGO). Construído por desenvolvedor com vivência real do domínio (esposa dentista) — decisões de produto refletem o fluxo real da clínica, não uma abstração genérica de "software de saúde".

## Operating Context

Clínica odontológica brasileira. Fluxo típico:

1. Paciente chega → recepção confere agendamento na tela do dia.
2. Dentista abre a ficha do paciente, consulta anamnese e odontograma mais recente.
3. Dentista realiza o procedimento e registra observações.
4. Recepção registra pagamento (integral ou parcial).

Termos exclusivamente em português brasileiro. Moeda BRL. Horário de atendimento das 8h às 18h. A dentista alterna entre consultório (foco em prontuário) e recepção (foco em agenda e financeiro).

## Capabilities and Constraints

**Módulos (12):** Pacientes, Dentistas, Funcionários, Agendamentos, Procedimentos, Anamnese, Odontograma, Contas a Receber, Contas a Pagar, Convênios, Estoque, Documentos.

**Regras de negócio load-bearing:**
- Autenticação JWT (header `Authorization: Bearer <token>`).
- Soft delete em Paciente, Dentista, Funcionário e Convênio (`DELETE` marca `ativo=false`; `PATCH /{id}/reativar` restaura).
- Anamnese e Odontograma são **registros históricos imutáveis** — apenas POST e GET; nunca editar ou deletar.
- Pagamento parcial: `PATCH /api/contas-receber/{id}/pagamento?valor=X` com transição de status no servidor.
- Detecção de conflito de horário em `POST /api/agendamentos` (retorna 409).
- Paginação: parâmetros em português — `pagina`, `tamanho`, `ordem`.
- Erro de validação retorna `mensagem: { campo: msg }`; erro geral retorna `mensagem: string`.

**Stack frontend (fixa):** React 19 + Vite + TypeScript + Tailwind CSS v4 (plugin-based via `@tailwindcss/vite`, sem `tailwind.config.js`) + `@tanstack/react-query` + Axios + React Router DOM v7. HTTP centralizado em `src/lib/api.ts` (Axios instance com interceptor JWT). Token em `localStorage['token']`. Sem SSR — SPA pura. Deploy Vercel.

**Backend (não editar):** Java 17 + Spring Boot + Spring Security + JWT + Spring Data MongoDB. URL de produção: `https://odonto-clinic-api-production.up.railway.app`. Swagger: `.../swagger-ui/index.html`. Endpoints e DTOs já estáveis.

## Brand Commitments

- **Nome do produto:** Bokka.
- **Tom:** profissional, limpo, confiável — a dentista vai olhar essa tela dezenas de vezes por dia; nunca deve cansar nem intimidar.
- **Interface em português brasileiro.**
- **Sem** mascotes, ilustrações infantis, estética "médica genérica" (verde-água + cruz), gradiente decorativo, glassmorphism, emoji como ícone, monospace decorativo, hard-offset shadows (neobrutalist), gradient text ou eyebrow acima de headings.
- **Ícones:** Lucide React.
- Nenhum logotipo Bokka existe hoje — precisa ser criado.

## Evidence on Hand

- **Backend completo e em produção:** `https://odonto-clinic-api-production.up.railway.app` — todos os 12 módulos funcionais, Swagger UI disponível.
- **Frontend funcional atual:** consome todos os endpoints; possui `AuthContext`, `ApiError` com validação por campo, toast com "Desfazer", paginação com debounce em Pacientes. Visualmente básico (paleta Tailwind sky/slate crua) — será substituído.
- **Tipos TypeScript sincronizados** com os DTOs do backend em `src/types/index.ts` (~475 linhas).
- **Referências visuais** anexadas pelo usuário: Moru dashboard, DentalPro dashboard, telas mobile (calendar/tasks/patients). Referências de padrão de qualidade e layout, não templates a copiar.
- **Ausências que futuras iterações não devem inventar:** nenhum logo Bokka, nenhum testimonial ou case, nenhum benchmark, nenhuma métrica de uso.

## Product Principles

1. **A tarefa vem primeiro.** O sistema desaparece na rotina. Um caminho a menos entre a dentista e a próxima ação é sempre a decisão certa.
2. **Densidade sem poluição.** A dentista precisa ver muito na mesma tela (agenda do dia + KPIs + alertas). Densidade se paga com hierarquia, não com whitespace excessivo.
3. **Feedback imediato e reversível.** Toda ação destrutiva confirma; toda ação bem-sucedida mostra toast; ações que dá pra desfazer (inativar paciente) oferecem "Desfazer" no toast.
4. **Consistência absoluta.** Doze módulos, um vocabulário visual. Mesmo padrão de tabela, mesmo modal de form, mesmos badges de status, mesma paginação. Aprender um módulo = saber usar os outros onze.
5. **Respeitar as regras do backend.** Imutabilidade de anamnese/odontograma, soft delete com reativar, paginação em pt-BR, pagamento parcial via PATCH — a UI espelha essas garantias, não as reinventa.

## Accessibility & Inclusion

WCAG 2.1 AA como piso mínimo. Contraste ≥ 4.5:1 em body text, ≥ 3:1 em texto grande e componentes UI. Foco visível para navegação por teclado em todos os controles interativos. Alvos de toque ≥ 44px em tablet. Formulários com `label` associado; erros de validação anunciados junto ao campo, não só via toast.
