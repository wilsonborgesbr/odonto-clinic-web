/**
 * Tema Claro / Escuro.
 *
 * Só existem dois temas, e o sistema NÃO segue `prefers-color-scheme`: sem escolha salva, vale o Claro.
 * Os valores são os mesmos que o backend guarda em `preferences.theme` ('light' | 'dark'), então não há mapeamento.
 * O cache local (`localStorage`) é lido também pelo script inline do `index.html`, antes da primeira pintura.
 * Se mudar a chave ou os valores aqui, mude lá.
 */

export type Tema = 'light' | 'dark';

/**
 * INTERRUPTOR DO MODO ESCURO. Só vale `true` com `VITE_TEMA_VISIVEL=true`; sem a variável (produção) o
 * botão de tema some, o app FORÇA Claro (ignora o tema salvo no navegador e no servidor) e não envia PATCH
 * de tema. O resto (variáveis, contexto, hook) fica intacto.
 * Para ligar no seu computador: crie `odonto-clinic-web/.env.development.local` com
 *   VITE_TEMA_VISIVEL=true
 * e reinicie o `npm run dev` (variável de ambiente só é lida na partida). Esses arquivos não vão para o Git.
 * Use `.env.development.local` e não `.env.local`: o `vite build` também lê o `.env.local` e publicaria o botão.
 * Também é lida em `index.html` (script anti-pisca): mantenha o nome da variável igual nos dois lugares.
 */
export const TEMA_VISIVEL = import.meta.env.VITE_TEMA_VISIVEL === 'true';

export const TEMA_STORAGE_KEY = 'bokka:tema';
export const TEMA_PADRAO: Tema = 'light';

/**
 * PONTO DE INTEGRAÇÃO COM O BACKEND. Com `true`, o `ThemeProvider` passa a:
 *  - ler `preferences.theme` de `GET /api/usuarios/me` uma vez por sessão (login e registro não devolvem
 *    preferências) e aplicar: o servidor vence o cache local;
 *  - gravar cada troca via `PATCH /api/usuarios/me/preferences` com só `{ theme }` (PATCH parcial: não mexe em
 *    `hideFinancialInfo`, e o olho de privacidade envia só o dele).
 * Se o backend em produção ainda não tiver o campo `theme`, a troca continua valendo neste navegador e o PATCH
 * falha em silêncio; basta pôr `false` para desligar a sincronia.
 */
export const TEMA_NO_BACKEND = true;

export const ehTema = (v: unknown): v is Tema => v === 'light' || v === 'dark';

export const lerTemaSalvo = (): Tema => {
  if (!TEMA_VISIVEL) return TEMA_PADRAO;
  try {
    const v = localStorage.getItem(TEMA_STORAGE_KEY);
    return ehTema(v) ? v : TEMA_PADRAO;
  } catch {
    return TEMA_PADRAO;
  }
};

export const salvarTema = (tema: Tema): void => {
  if (!TEMA_VISIVEL) return;
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
  } catch {
    // localStorage indisponível (modo privado etc.) — a escolha vale só nesta sessão.
  }
};

export const aplicarTema = (tema: Tema): void => {
  const raiz = document.documentElement;
  raiz.setAttribute('data-theme', tema);
  raiz.style.colorScheme = tema;
};
