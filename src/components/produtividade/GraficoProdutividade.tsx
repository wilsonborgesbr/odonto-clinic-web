import { useId, useMemo, useState } from 'react';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  escalaY,
  formatarValor,
  formatarValorTooltip,
  indicesRotuloX,
  linhaExtra,
  MASCARA_MOEDA,
  rotuloDoPonto,
  rotuloEixoY,
  type MetricaInfo,
} from '../../lib/produtividade';
import type { PontoProdutividade, ProdutividadeDTO } from '../../types';

// Cores só por variável CSS (src/index.css, :root): o tema escuro troca as variáveis, não este arquivo.
// Nas props do Recharts vão em `style` (var() em atributo de apresentação SVG não é garantido em todos os navegadores).
const ESTILO_EIXO = { fill: 'var(--axis)' } as const;

interface Ponto {
  i: number;
  valor: number | null;
  anterior: number | null;
  ponto: PontoProdutividade;
}

interface GraficoProps {
  info: MetricaInfo;
  dados: ProdutividadeDTO;
  mascarado: boolean;
  comparar: boolean;
  /** Nome do período anterior para a linha extra do tooltip (ex.: "Setembro"). */
  rotuloAnterior: string;
  reduzirMovimento: boolean;
  resumo: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: Ponto }[];
  info: MetricaInfo;
  periodo: ProdutividadeDTO['periodo'];
  mascarado: boolean;
  comparar: boolean;
  rotuloAnterior: string;
}

const ConteudoTooltip = ({ active, payload, info, periodo, mascarado, comparar, rotuloAnterior }: TooltipProps) => {
  const item = active ? payload?.[0]?.payload : undefined;
  if (!item) return null;
  const { ponto } = item;
  // Futuro sem valor (métricas de fato passado): nada a mostrar
  if (ponto.valor == null && ponto.futuro) return null;
  const extra = mascarado ? '' : linhaExtra(info, ponto);
  const anterior =
    comparar && !mascarado && ponto.anterior != null
      ? `${rotuloAnterior}: ${formatarValor(info.unidade, ponto.anterior)}`
      : '';
  return (
    <div className="max-w-[16rem] rounded-lg border border-(--tip-border) bg-(--tip-bg) px-3 py-2 shadow-(--tip-shadow)">
      <p className="text-xs text-(--tip-fg-3)">{rotuloDoPonto(periodo, ponto)}</p>
      <p className="text-sm font-bold tabular-nums text-(--tip-fg)">
        {mascarado ? MASCARA_MOEDA : formatarValorTooltip(info, ponto.valor)}
      </p>
      {extra && <p className="text-xs text-(--tip-fg-3)">{extra}</p>}
      {anterior && <p className="text-xs text-(--tip-fg-3)">{anterior}</p>}
    </div>
  );
};

interface PropsTick {
  x?: number;
  y?: number;
  payload?: { value: number };
}

/**
 * Gráfico de área da produtividade. O container é `absolute inset-0 overflow-hidden` dentro de um bloco
 * `relative min-w-0`: o recharts fixa a largura em px e só a atualiza quando o ResizeObserver dispara; sem o
 * corte, uma largura velha (ao trocar de viewport) alargava a página.
 */
export const GraficoProdutividade = ({
  info,
  dados,
  mascarado,
  comparar,
  rotuloAnterior,
  reduzirMovimento,
  resumo,
}: GraficoProps) => {
  // id do gradiente único por instância (evita colisão com outros SVGs da página)
  const idGradiente = `produtividade-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [largura, setLargura] = useState(0);
  const estreito = largura > 0 && largura < 440;
  const duasLinhas = dados.periodo === 'SEMANA';

  // Dias sem expediente não são plotados: o eixo é numérico (índice) e a linha liga os vizinhos.
  const serie = useMemo<Ponto[]>(
    () =>
      dados.pontos
        .filter((p) => !p.semExpediente)
        .map((p, i) => ({
          i,
          valor: p.valor,
          anterior: comparar && !mascarado ? p.anterior : null,
          ponto: p,
        })),
    [dados.pontos, comparar, mascarado],
  );

  const mostrarComparacao = comparar && !mascarado && dados.periodo !== 'TODOS';
  const escala = useMemo(() => {
    const valores = serie.flatMap((d) => [d.valor, mostrarComparacao ? d.anterior : null]);
    return escalaY(
      info.unidade,
      valores.filter((v): v is number => v != null),
    );
  }, [serie, info.unidade, mostrarComparacao]);

  const rotulosY = escala.marcas.map((m) => rotuloEixoY(info.unidade, m));
  const larguraY = mascarado ? 8 : Math.round(Math.max(...rotulosY.map((r) => r.length)) * 6.4 + 12);
  const visiveisX = useMemo(
    () =>
      indicesRotuloX(
        dados.periodo,
        serie.map((d) => ({ rotulo: d.ponto.rotulo, chave: d.ponto.chave })),
        estreito,
      ),
    [dados.periodo, serie, estreito],
  );
  const dominioX: [number, number] = serie.length <= 1 ? [-0.5, 0.5] : [0, serie.length - 1];

  const TickX = ({ x = 0, y = 0, payload }: PropsTick) => {
    const d = payload ? serie[Math.round(payload.value)] : undefined;
    if (!d) return <g />;
    return (
      <g transform={`translate(${x},${y})`}>
        <text y={14} textAnchor="middle" style={ESTILO_EIXO} fontSize={11} fontWeight={500}>
          {d.ponto.rotulo}
        </text>
        {duasLinhas && d.ponto.rotuloSecundario && (
          <text y={28} textAnchor="middle" style={ESTILO_EIXO} fontSize={11} fontWeight={500}>
            {d.ponto.rotuloSecundario}
          </text>
        )}
      </g>
    );
  };

  const ticksX = serie.length <= 1 ? [0] : serie.map((d) => d.i).filter((i) => visiveisX.has(i));

  return (
    <div className="absolute inset-0 touch-pan-y overflow-hidden" role="group" aria-label={resumo}>
      <ResponsiveContainer width="100%" height="100%" onResize={(w) => setLargura(w)}>
        <ComposedChart data={serie} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--line-fill)', stopOpacity: 'var(--line-fill-a)' }} />
              <stop offset="1" style={{ stopColor: 'var(--line-fill)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            dataKey="i"
            domain={dominioX}
            ticks={serie.length <= 1 ? [0] : ticksX}
            allowDecimals={false}
            interval={0}
            tick={<TickX />}
            axisLine={false}
            tickLine={false}
            height={duasLinhas ? 38 : 26}
          />
          <YAxis
            type="number"
            domain={[0, escala.topo]}
            ticks={escala.marcas}
            tickFormatter={(v: number) => rotuloEixoY(info.unidade, v)}
            tick={mascarado ? false : { style: ESTILO_EIXO, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={larguraY}
          />
          <Tooltip
            content={(p) => (
              <ConteudoTooltip
                active={p.active}
                payload={p.payload as TooltipProps['payload']}
                info={info}
                periodo={dados.periodo}
                mascarado={mascarado}
                comparar={comparar}
                rotuloAnterior={rotuloAnterior}
              />
            )}
            cursor={{ style: { stroke: 'var(--cursor)' }, strokeWidth: 1 }}
            filterNull={false}
            isAnimationActive={false}
          />
          {mostrarComparacao && (
            <Line
              type="monotone"
              dataKey="anterior"
              style={{ stroke: 'var(--compare)' }}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
              legendType="none"
            />
          )}
          <Area
            type="monotone"
            dataKey="valor"
            style={{ stroke: 'var(--line)' }}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill={`url(#${idGradiente})`}
            connectNulls={false}
            isAnimationActive={!reduzirMovimento}
            animationDuration={500}
            activeDot={{ r: 5, style: { fill: 'var(--dot-bg)', stroke: 'var(--dot-ring)' }, strokeWidth: 2.5 }}
            dot={(p) => {
              const idx = p.index ?? 0;
              const isolado =
                serie[idx]?.valor != null && serie[idx - 1]?.valor == null && serie[idx + 1]?.valor == null;
              return isolado ? (
                <circle key={`ponto-${idx}`} cx={p.cx} cy={p.cy} r={4} style={{ fill: 'var(--line)' }} />
              ) : (
                <g key={`ponto-${idx}`} />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
