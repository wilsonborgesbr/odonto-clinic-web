import { AlertCircle, LineChart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinancialVisibility } from '../../context/FinancialVisibilityContext';
import { useReduzirMovimento } from '../../hooks/useReduzirMovimento';
import { NOMES_FORMATO } from '../../lib/exportacao';
import {
  fluxoVazio,
  montarRelatorioFluxo,
  nomeArquivoFluxo,
  nomeMesCompleto,
  periodoFluxoTexto,
  textoResumoFluxo,
  totaisFluxo,
  type MesFluxo,
} from '../../lib/fluxoCaixa';
import { cn, formatCurrency, MASKED_CURRENCY } from '../../lib/utils';
import { MenuExportar } from '../produtividade/MenuExportar';
import { PainelEstado } from '../produtividade/PainelEstado';
import { nomeDaClinica, useExportacao } from '../produtividade/useExportacao';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { GraficoFluxoCaixa } from './GraficoFluxoCaixa';

interface FluxoCaixaCardProps {
  fluxo: MesFluxo[];
  loading: boolean;
  erro: boolean;
  onTentarDeNovo: () => void;
}

const ItemTotal = ({
  cor,
  rotulo,
  valor,
  carregando,
}: {
  cor: string;
  rotulo: string;
  valor: string;
  carregando: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 py-2 @[520px]:block @[520px]:py-0">
    <dt className="flex items-center gap-2 text-xs text-bokka-ink-2">
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', cor)} aria-hidden="true" />
      {rotulo}
    </dt>
    <dd className="text-base font-bold tabular-nums text-bokka-ink @[520px]:mt-1 lg:text-xl">
      {carregando ? <Skeleton className="h-6 w-24" /> : valor}
    </dd>
  </div>
);

/**
 * Card "Fluxo de caixa" da Auditoria (versão clara): totais, barras de receita e despesa por mês e linha de lucro.
 * Só variáveis e tokens (nenhuma cor escrita aqui): o modo escuro troca as variáveis.
 */
export const FluxoCaixaCard = ({ fluxo, loading, erro, onTentarDeNovo }: FluxoCaixaCardProps) => {
  const { user } = useAuth();
  const { visible, toggleVisible, pronto } = useFinancialVisibility();
  const reduzirMovimento = useReduzirMovimento();
  const { gerando, exportar } = useExportacao();

  // Financeiro fica oculto até o /me confirmar a preferência do usuário
  const mascarado = !visible || !pronto;
  const vazio = !loading && !erro && fluxoVazio(fluxo);
  const totais = totaisFluxo(fluxo);
  const contexto = periodoFluxoTexto(fluxo);
  const valor = (v: number) => (mascarado ? MASKED_CURRENCY : formatCurrency(v));

  const motivoIndisponivel = loading
    ? 'Aguarde o carregamento para exportar.'
    : erro
      ? 'Não foi possível carregar o fluxo de caixa.'
      : vazio
        ? 'Sem dados neste período para exportar.'
        : undefined;

  return (
    <Card
      role="region"
      aria-label="Fluxo de caixa"
      aria-busy={loading}
      className="@container min-w-0 rounded-2xl p-5 lg:p-6"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-bokka-ink">Fluxo de caixa</h2>
          <p className="mt-0.5 text-xs text-bokka-ink-3">Últimos 6 meses · receitas, despesas e lucro líquido</p>
        </div>
        <MenuExportar
          contexto={contexto}
          bloqueado={mascarado}
          gerando={gerando}
          indisponivel={motivoIndisponivel}
          onExportar={(formato) =>
            void exportar({
              formato,
              financeiro: true,
              descricao: 'do fluxo de caixa',
              montarRelatorio: () => montarRelatorioFluxo(fluxo, nomeDaClinica(user)),
              nomeArquivo: (ext) => nomeArquivoFluxo(fluxo, ext),
            })
          }
          onMostrarValores={() => {
            if (!visible) toggleVisible();
          }}
        />
      </div>

      {/* Totais: lista vertical no celular, três colunas a partir de 520px (também faz o papel de legenda) */}
      {!erro && !vazio && (
        <dl className="mt-4 divide-y divide-bokka-border @[520px]:grid @[520px]:grid-cols-3 @[520px]:gap-x-8 @[520px]:divide-y-0">
          <ItemTotal cor="bg-(--positive)" rotulo="Receita" valor={valor(totais.receita)} carregando={loading} />
          <ItemTotal cor="bg-(--negative)" rotulo="Despesa" valor={valor(totais.despesa)} carregando={loading} />
          <ItemTotal cor="bg-(--profit)" rotulo="Lucro líquido" valor={valor(totais.lucro)} carregando={loading} />
        </dl>
      )}

      {/* Gráfico: relative + min-w-0 e o gráfico absoluto e cortado (evita estouro horizontal) */}
      <div className="relative mt-4 h-56 min-w-0 sm:h-64 lg:h-72">
        {loading ? (
          <div className="absolute inset-0 overflow-hidden rounded-lg bg-(--skeleton) animate-pulse" aria-hidden="true">
            {[25, 50, 75].map((topo) => (
              <div key={topo} className="absolute inset-x-0 border-t border-bokka-surface" style={{ top: `${topo}%` }} />
            ))}
          </div>
        ) : erro ? (
          <PainelEstado
            alerta
            icone={<AlertCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
            titulo="Não foi possível carregar o fluxo de caixa."
          >
            <Button variant="secondary" size="sm" onClick={onTentarDeNovo}>
              Tentar de novo
            </Button>
          </PainelEstado>
        ) : vazio ? (
          <PainelEstado
            icone={<LineChart className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
            titulo="Sem movimentações nos últimos 6 meses"
            texto="Receitas e despesas pagas aparecem aqui."
          />
        ) : (
          <GraficoFluxoCaixa
            fluxo={fluxo}
            mascarado={mascarado}
            reduzirMovimento={reduzirMovimento}
            resumo={textoResumoFluxo(fluxo, mascarado)}
          />
        )}
      </div>

      {/* Alternativa textual do gráfico */}
      {!loading && !erro && !vazio && (
        <div className="sr-only">
          <table>
            <caption>Fluxo de caixa dos últimos 6 meses</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Receita</th>
                <th scope="col">Despesa</th>
                <th scope="col">Lucro líquido</th>
              </tr>
            </thead>
            <tbody>
              {fluxo.map((m) => (
                <tr key={m.chave}>
                  <td>{nomeMesCompleto(m.chave)}</td>
                  <td>{valor(m.receita)}</td>
                  <td>{valor(m.despesa)}</td>
                  <td>{valor(m.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {gerando ? `Gerando arquivo ${NOMES_FORMATO[gerando]}.` : ''}
      </div>
    </Card>
  );
};
