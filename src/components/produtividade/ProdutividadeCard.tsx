import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Eye, EyeOff, LineChart, Minus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReduzirMovimento } from '../../hooks/useReduzirMovimento';
import { useFinancialVisibility } from '../../context/FinancialVisibilityContext';
import { NOMES_FORMATO, type FormatoExportacao } from '../../lib/exportacao';
import {
  deslocarReferencia,
  dicaMesmoIntervalo,
  ehMetrica,
  ehPeriodo,
  formatarValor,
  gravarPreferencia,
  hojeLocalIso,
  infoMetrica,
  inicioDoPeriodo,
  lerIso,
  lerPreferencia,
  MASCARA_MOEDA,
  METRICA_PADRAO,
  METRICAS,
  montarIso,
  nomeArquivoProdutividade,
  nomeMes,
  PERIODO_PADRAO,
  PREF_COMPARAR,
  PREF_METRICA,
  PREF_PERIODO,
  periodoVazio,
  resumirVariacao,
  rotuloDoPonto,
  rotuloPeriodoCurto,
  somarDias,
  textoResumoGrafico,
  textoVariacaoCurto,
  type MetricaInfo,
} from '../../lib/produtividade';
import { montarRelatorioProdutividade } from '../../lib/relatorioProdutividade';
import { cn } from '../../lib/utils';
import { useProdutividade } from '../../services/produtividadeService';
import type { MetricaProdutividade, PeriodoProdutividade } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { ControlePeriodo } from './ControlePeriodo';
import { GraficoProdutividade } from './GraficoProdutividade';
import { MenuExportar } from './MenuExportar';
import { PainelEstado } from './PainelEstado';
import { nomeDaClinica, useExportacao } from './useExportacao';
import { SeletorMetrica } from './SeletorMetrica';

/** Métrica gravada no navegador, se ainda for válida. */
const metricaInicial = (): MetricaProdutividade => {
  const salva = lerPreferencia(PREF_METRICA);
  return ehMetrica(salva) ? salva : METRICA_PADRAO;
};

const periodoInicial = (): PeriodoProdutividade => {
  const salvo = lerPreferencia(PREF_PERIODO);
  return ehPeriodo(salvo) ? salvo : PERIODO_PADRAO;
};

const SeloVariacao = ({
  info,
  periodo,
  variacao,
  textoVariacao,
  rotuloComparacao,
}: {
  info: MetricaInfo;
  periodo: PeriodoProdutividade;
  variacao: number | null;
  textoVariacao: string | null;
  rotuloComparacao: string;
}) => {
  const resumo = resumirVariacao(info, periodo, variacao);
  if (!resumo) return null;
  const Seta = resumo.direcao === 'subiu' ? ArrowUpRight : resumo.direcao === 'desceu' ? ArrowDownRight : Minus;
  const falado =
    resumo.direcao === 'igual'
      ? `sem variação em relação ${rotuloComparacao}`
      : `${resumo.direcao === 'subiu' ? 'aumento' : 'queda'} de ${resumo.texto.replace(/^[+−]/, '')} em relação ${rotuloComparacao}${
          resumo.tom === 'ruim' ? ', o que é ruim' : resumo.tom === 'bom' ? ', o que é bom' : ''
        }`;
  return (
    <>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
          resumo.tom === 'bom' && 'bg-bokka-success-soft text-bokka-success-ink',
          resumo.tom === 'ruim' && 'bg-bokka-danger-soft text-bokka-danger-ink',
          resumo.tom === 'neutro' && 'bg-bokka-neutral-soft text-bokka-neutral-ink',
        )}
      >
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          <Seta className="h-3.5 w-3.5" strokeWidth={2.25} />
          {resumo.texto}
        </span>
        <span className="sr-only">{falado}</span>
      </span>
      <span className="text-xs text-bokka-ink-3" title={dicaMesmoIntervalo(textoVariacao)}>
        {textoVariacaoCurto(textoVariacao)}
      </span>
    </>
  );
};

/**
 * Card "Produtividade" do painel: uma métrica por vez (9, filtradas pelas permissões), um período, um número
 * grande e o gráfico de área. Os dados vêm agregados do servidor (GET /api/dashboard/produtividade).
 */
export const ProdutividadeCard = () => {
  const { user, hasPermissao } = useAuth();
  const { visible, toggleVisible, pronto } = useFinancialVisibility();
  const reduzirMovimento = useReduzirMovimento();

  const hoje = useMemo(() => hojeLocalIso(), []);
  const anoAtual = lerIso(hoje).ano;

  const permitidasLocal = useMemo(() => METRICAS.filter((m) => hasPermissao(m.permissao)), [hasPermissao]);

  const [metricaEscolhida, setMetricaEscolhida] = useState<MetricaProdutividade>(metricaInicial);
  const [periodo, setPeriodo] = useState<PeriodoProdutividade>(periodoInicial);
  const [referenciaEscolhida, setReferencia] = useState<string>(hoje);
  const [comparar, setComparar] = useState<boolean>(() => lerPreferencia(PREF_COMPARAR) === '1');

  // Métrica efetiva: a escolhida, se permitida; senão a padrão ou a primeira permitida
  const metrica: MetricaProdutividade | null = permitidasLocal.some((m) => m.id === metricaEscolhida)
    ? metricaEscolhida
    : (permitidasLocal.find((m) => m.id === METRICA_PADRAO)?.id ?? permitidasLocal[0]?.id ?? null);
  const info = metrica ? infoMetrica(metrica) : null;

  // Métricas que não olham para o futuro não navegam para períodos que ainda não começaram
  const referencia =
    info && !info.projetaFuturo && inicioDoPeriodo(periodo, referenciaEscolhida) > hoje
      ? hoje
      : referenciaEscolhida;

  const consulta = useProdutividade(
    { metrica: metrica ?? METRICA_PADRAO, periodo, referencia },
    { enabled: !!metrica },
  );
  const dados = consulta.data;
  const dadosAtuais = dados && !consulta.isPlaceholderData ? dados : undefined;

  // Lista final de métricas: a do servidor (metricasPermitidas) refina a das permissões locais
  const disponiveis = useMemo(() => {
    const doServidor = dados?.metricasPermitidas;
    if (!doServidor?.length) return permitidasLocal;
    const cruzada = permitidasLocal.filter((m) => doServidor.includes(m.id));
    return cruzada.length ? cruzada : permitidasLocal;
  }, [dados?.metricasPermitidas, permitidasLocal]);

  const primeiraCarga = consulta.isLoading;
  const atualizando = !primeiraCarga && (consulta.isFetching || consulta.isPlaceholderData);
  const erro = consulta.isError;

  // Privacidade: financeiro fica oculto até o /me confirmar a preferência do usuário
  const infoVista = dados ? infoMetrica(dados.metrica) : info;
  const mascarado = !!infoVista?.financeira && (!visible || !pronto);
  const bloqueadoMenu = !!info?.financeira && (!visible || !pronto);

  const anos = useMemo(() => {
    const lista = dados?.anosDisponiveis?.length ? dados.anosDisponiveis : [anoAtual];
    return lista;
  }, [dados?.anosDisponiveis, anoAtual]);

  // ---- navegação de período
  const anosOrdenados = useMemo(() => [...anos].sort((a, b) => a - b), [anos]);
  const menorAno = anosOrdenados[0] ?? anoAtual;
  const maiorAno = Math.max(anosOrdenados[anosOrdenados.length - 1] ?? anoAtual, anoAtual);

  const anteriorDesabilitado = useMemo(() => {
    const anterior = deslocarReferencia(periodo, referencia, -1);
    const inicio = inicioDoPeriodo(periodo, anterior);
    const fim = periodo === 'SEMANA' ? somarDias(inicio, 6) : inicio;
    return lerIso(fim).ano < menorAno;
  }, [periodo, referencia, menorAno]);

  const proximoDesabilitado = useMemo(() => {
    const inicio = inicioDoPeriodo(periodo, deslocarReferencia(periodo, referencia, 1));
    if (!info?.projetaFuturo) return inicio > hoje;
    return lerIso(inicio).ano > maiorAno;
  }, [periodo, referencia, info?.projetaFuturo, hoje, maiorAno]);

  const trocarMetrica = (id: MetricaProdutividade) => {
    setMetricaEscolhida(id);
    gravarPreferencia(PREF_METRICA, id);
  };
  const trocarPeriodo = (p: PeriodoProdutividade) => {
    setPeriodo(p);
    setReferencia(hoje);
    gravarPreferencia(PREF_PERIODO, p);
  };
  const trocarAno = (ano: number) => {
    const { mes } = lerIso(referencia);
    setReferencia(montarIso(ano, periodo === 'MES' ? mes : 1, 1));
  };
  const alternarComparar = (v: boolean) => {
    setComparar(v);
    gravarPreferencia(PREF_COMPARAR, v ? '1' : '0');
  };

  // ---- textos derivados
  const rotuloCurto = rotuloPeriodoCurto(periodo, referencia);
  const rotuloCompleto = dadosAtuais?.rotuloPeriodo ?? rotuloCurto;
  const rotuloAnterior = useMemo(() => {
    if (periodo === 'MES') return nomeMes(lerIso(deslocarReferencia(periodo, referencia, -1)).mes);
    if (periodo === 'ANO') return String(lerIso(referencia).ano - 1);
    return 'Semana anterior';
  }, [periodo, referencia]);
  const rotuloComparacao =
    periodo === 'SEMANA' ? 'à semana anterior' : periodo === 'MES' ? 'ao mês anterior' : 'ao ano anterior';

  const vazio = !!info && !!dadosAtuais && periodoVazio(info, dadosAtuais);
  const resumoGrafico =
    info && dadosAtuais ? textoResumoGrafico(info, dadosAtuais, mascarado, rotuloCompleto) : '';

  // ---- anúncio para leitor de tela (só após o primeiro carregamento, uma vez por troca)
  const [anuncio, setAnuncio] = useState('');
  const jaCarregouUmaVez = useRef(false);
  useEffect(() => {
    if (!info || !dadosAtuais) return;
    if (!jaCarregouUmaVez.current) {
      jaCarregouUmaVez.current = true;
      return;
    }
    setAnuncio(
      `Mostrando ${info.rotulo}, ${rotuloCompleto}${
        mascarado ? ', valores ocultos.' : `, total ${formatarValor(info.unidade, dadosAtuais.total)}.`
      }`,
    );
    // Só reage à troca de dados (métrica, período, referência), não ao olho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosAtuais]);

  // ---- exportação
  const { gerando, exportar: exportarArquivo } = useExportacao();
  const exportar = (formato: FormatoExportacao) => {
    if (!info || !dadosAtuais) return;
    void exportarArquivo({
      formato,
      financeiro: info.financeira,
      descricao: 'de produtividade',
      montarRelatorio: () =>
        montarRelatorioProdutividade({
          info,
          dados: dadosAtuais,
          rotuloPeriodo: rotuloCompleto,
          nomeClinica: nomeDaClinica(user),
        }),
      nomeArquivo: (ext) => nomeArquivoProdutividade(info, periodo, referencia, dadosAtuais.anosDisponiveis, ext),
    });
  };

  const motivoIndisponivel = primeiraCarga
    ? 'Aguarde o carregamento para exportar.'
    : erro
      ? 'Não foi possível carregar este indicador.'
      : !dadosAtuais
        ? 'Aguarde o carregamento para exportar.'
        : vazio
          ? 'Sem dados neste período para exportar.'
          : undefined;

  // Sem nenhuma métrica permitida o card não aparece
  if (!info || !infoVista || !metrica) return null;

  const total = dadosAtuais?.total ?? dados?.total ?? null;
  const textoNumero = mascarado ? MASCARA_MOEDA : vazio ? formatarValor(infoVista.unidade, 0) : formatarValor(infoVista.unidade, total);
  const numeroLongo = textoNumero.length > 12;
  const variacaoBase = dados ?? dadosAtuais;

  const semAnteriorComDados =
    !!variacaoBase &&
    periodo !== 'TODOS' &&
    variacaoBase.variacaoPercentual == null &&
    (variacaoBase.total ?? 0) > 0 &&
    variacaoBase.totalAnterior === 0;

  return (
    <Card
      role="region"
      aria-label="Produtividade"
      aria-busy={primeiraCarga || atualizando}
      className="order-4 flex min-h-[440px] min-w-0 flex-col rounded-2xl p-5 lg:order-3 lg:col-span-2 lg:p-6"
    >
      <h2 className="sr-only">Produtividade</h2>

      {/* Cabeçalho: métrica (título), período e exportar */}
      <div className="relative flex shrink-0 flex-wrap items-center gap-x-3 gap-y-3 sm:flex-nowrap">
        <div className="order-1 min-w-0 flex-1">
          <SeletorMetrica metrica={metrica} disponiveis={disponiveis} onChange={trocarMetrica} />
        </div>
        <div className="order-2 shrink-0 sm:order-3">
          <MenuExportar
            contexto={`${rotuloCompleto} · ${info.rotulo}`}
            bloqueado={bloqueadoMenu}
            gerando={gerando}
            indisponivel={motivoIndisponivel}
            onExportar={exportar}
            onMostrarValores={() => {
              if (!visible) toggleVisible();
            }}
          />
        </div>
        <div className="order-3 w-full sm:order-2 sm:w-auto">
          <ControlePeriodo
            periodo={periodo}
            rotulo={rotuloCurto}
            anos={periodo === 'MES' || periodo === 'ANO' ? anos : []}
            anoSelecionado={lerIso(referencia).ano}
            desabilitado={primeiraCarga}
            anteriorDesabilitado={anteriorDesabilitado}
            proximoDesabilitado={proximoDesabilitado}
            comparar={comparar}
            onAnterior={() => setReferencia(deslocarReferencia(periodo, referencia, -1))}
            onProximo={() => setReferencia(deslocarReferencia(periodo, referencia, 1))}
            onPeriodo={trocarPeriodo}
            onAno={trocarAno}
            onComparar={alternarComparar}
          />
        </div>
      </div>

      {/* Número grande, olho e variação */}
      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
        {primeiraCarga ? (
          <>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-20" rounded="full" />
          </>
        ) : (
          <>
            <span
              key={mascarado ? 'oculto' : 'visivel'}
              className={cn(
                'font-bold tabular-nums tracking-tight text-bokka-ink tv:text-5xl',
                numeroLongo ? 'text-2xl sm:text-3xl' : 'text-3xl',
              )}
            >
              {erro && !dados ? '—' : textoNumero}
            </span>
            {infoVista.financeira && (
              <button
                type="button"
                onClick={toggleVisible}
                disabled={!pronto}
                aria-pressed={!visible}
                aria-label={visible ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
                title={visible ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
                className="-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-bokka-ink-3 transition-colors hover:bg-bokka-hover hover:text-bokka-ink disabled:opacity-50"
              >
                {mascarado ? (
                  <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            )}
            {!mascarado && !vazio && variacaoBase && (
              <>
                <SeloVariacao
                  info={infoVista}
                  periodo={periodo}
                  variacao={variacaoBase.variacaoPercentual}
                  textoVariacao={variacaoBase.textoVariacao}
                  rotuloComparacao={rotuloComparacao}
                />
                {semAnteriorComDados && (
                  <span className="text-xs text-bokka-ink-3">Sem dados no período anterior</span>
                )}
                {periodo === 'TODOS' && anosOrdenados.length > 0 && (
                  <span className="text-xs text-bokka-ink-3">
                    desde {menorAno} · {Math.max(1, maiorAno - menorAno + 1)}{' '}
                    {maiorAno - menorAno + 1 === 1 ? 'ano' : 'anos'}
                  </span>
                )}
              </>
            )}
          </>
        )}
      </div>

      {infoVista.id === 'A_RECEBER' && !mascarado && dadosAtuais?.inadimplenciaHistorica &&
        dadosAtuais.inadimplenciaHistorica.totalAtrasado > 0 && (
          <p className="mt-1 text-xs text-bokka-ink-3">
            + {formatarValor('MOEDA', dadosAtuais.inadimplenciaHistorica.totalAtrasado)} em atraso de períodos
            anteriores
          </p>
        )}

      {/* Gráfico: relative + min-w-0 e o gráfico absoluto cortado (causa do estouro de 728px no celular) */}
      <div
        className={cn(
          'relative mt-4 min-h-[220px] min-w-0 flex-1 transition-opacity sm:min-h-[240px] motion-reduce:transition-none',
          atualizando && 'opacity-60',
        )}
      >
        {primeiraCarga ? (
          <div className="absolute inset-0 overflow-hidden rounded-lg bg-(--skeleton) animate-pulse" aria-hidden="true">
            {[25, 50, 75].map((topo) => (
              <div key={topo} className="absolute inset-x-0 border-t border-bokka-surface" style={{ top: `${topo}%` }} />
            ))}
          </div>
        ) : erro ? (
          <PainelEstado
            alerta
            icone={<AlertCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
            titulo="Não foi possível carregar este indicador."
          >
            <Button variant="secondary" size="sm" onClick={() => void consulta.refetch()}>
              Tentar de novo
            </Button>
          </PainelEstado>
        ) : vazio ? (
          <PainelEstado
            icone={<LineChart className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
            titulo={infoVista.vazio}
            texto="Escolha outro período ou outra métrica."
          >
            {infoVista.linkAgenda && hasPermissao('AGENDAMENTOS') && (
              <Link to="/agenda" className="text-xs font-semibold text-bokka-link hover:text-bokka-link-hover">
                Abrir agenda
              </Link>
            )}
          </PainelEstado>
        ) : dados ? (
          <GraficoProdutividade
            info={infoVista}
            dados={dados}
            mascarado={mascarado}
            comparar={comparar}
            rotuloAnterior={rotuloAnterior}
            reduzirMovimento={reduzirMovimento}
            resumo={resumoGrafico}
          />
        ) : null}
      </div>

      {!primeiraCarga && !erro && !vazio && dadosAtuais && comparar && !mascarado && periodo !== 'TODOS' && (
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-xs text-bokka-ink-2">
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="18" y2="2" className="stroke-(--line)" strokeWidth="2.5" />
            </svg>
            {rotuloCompleto}
          </span>
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="18" y2="2" className="stroke-(--compare)" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            {rotuloPeriodoCurto(periodo, deslocarReferencia(periodo, referencia, -1))}
          </span>
        </div>
      )}

      {!primeiraCarga && !erro && !vazio && dadosAtuais && periodo === 'TODOS' && dadosAtuais.pontos.filter((p) => p.valor != null).length < 2 && (
        <p className="mt-3 shrink-0 text-xs text-bokka-ink-3">Só há dados de {menorAno} até agora.</p>
      )}

      {/* Alternativa textual do gráfico */}
      {dadosAtuais && !vazio && !erro && (
        <div className="sr-only">
          <table>
            <caption>
              {infoVista.rotulo} em {rotuloCompleto}
            </caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {dadosAtuais.pontos.map((p) => (
                <tr key={p.chave}>
                  <td>{rotuloDoPonto(dadosAtuais.periodo, p)}</td>
                  <td>
                    {mascarado
                      ? 'oculto'
                      : p.semExpediente
                        ? 'sem expediente'
                        : p.valor == null
                          ? 'sem dados'
                          : formatarValor(infoVista.unidade, p.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {gerando ? `Gerando arquivo ${NOMES_FORMATO[gerando]}.` : anuncio}
      </div>
    </Card>
  );
};
