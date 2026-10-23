import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { escalaFluxo, nomeMesCompleto, rotuloEixoMoeda, type MesFluxo } from '../../lib/fluxoCaixa';
import { cn, formatCurrency, MASKED_CURRENCY } from '../../lib/utils';

// Cores só por variável CSS (src/index.css, :root) e por classe: o tema escuro troca as variáveis, não este arquivo.
const ESTILO_EIXO = { fill: 'var(--axis)' } as const;

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: MesFluxo }[];
  mascarado: boolean;
}

const Linha = ({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="inline-flex items-center gap-2 text-(--tip-fg-3)">
      <span className={cn('h-2 w-2 rounded-full', cor)} aria-hidden="true" />
      {rotulo}
    </span>
    <span className="font-semibold tabular-nums text-(--tip-fg)">{valor}</span>
  </div>
);

const ConteudoTooltip = ({ active, payload, mascarado }: TooltipProps) => {
  const mes = active ? payload?.[0]?.payload : undefined;
  if (!mes) return null;
  const valor = (v: number) => (mascarado ? MASKED_CURRENCY : formatCurrency(v));
  return (
    <div className="min-w-48 rounded-[10px] border border-(--tip-border) bg-(--tip-bg) px-3 py-2.5 text-xs shadow-(--tip-shadow)">
      <p className="mb-1.5 text-xs font-semibold text-(--tip-fg-3)">{nomeMesCompleto(mes.chave)}</p>
      <div className="space-y-1">
        <Linha cor="bg-(--positive)" rotulo="Receita" valor={valor(mes.receita)} />
        <Linha cor="bg-(--negative)" rotulo="Despesa" valor={valor(mes.despesa)} />
        <Linha cor="bg-(--profit)" rotulo="Lucro líquido" valor={valor(mes.lucro)} />
      </div>
    </div>
  );
};

interface GraficoFluxoProps {
  fluxo: MesFluxo[];
  mascarado: boolean;
  reduzirMovimento: boolean;
  resumo: string;
}

/**
 * Barras de Receita e Despesa por mês e linha de Lucro líquido por cima. Container `absolute inset-0
 * overflow-hidden` dentro de um bloco `relative min-w-0` (o recharts fixa a largura em px e só a atualiza quando o
 * ResizeObserver dispara; sem o corte, uma largura velha alargava a página).
 */
export const GraficoFluxoCaixa = ({ fluxo, mascarado, reduzirMovimento, resumo }: GraficoFluxoProps) => {
  const [largura, setLargura] = useState(0);
  const estreito = largura > 0 && largura < 420;
  const escala = useMemo(() => escalaFluxo(fluxo), [fluxo]);
  const rotulos = escala.marcas.map((m) => rotuloEixoMoeda(m, estreito));
  const larguraY = mascarado ? 8 : Math.round(Math.max(...rotulos.map((r) => r.length)) * 6.4 + 12);
  const temNegativo = escala.minimo < 0;

  // A grade do Recharts vem com stroke fixo no SVG: a regra de CSS do container troca pela variável --grid
  return (
    <div
      className="absolute inset-0 touch-pan-y overflow-hidden [&_.recharts-cartesian-grid_line]:stroke-(--grid)"
      role="group"
      aria-label={resumo}
    >
      <ResponsiveContainer width="100%" height="100%" onResize={(w) => setLargura(w)}>
        <ComposedChart
          data={fluxo}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          barGap={3}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            tick={{ style: ESTILO_EIXO, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[escala.minimo, escala.maximo]}
            ticks={escala.marcas}
            tickFormatter={(v: number) => rotuloEixoMoeda(v, estreito)}
            tick={mascarado ? false : { style: ESTILO_EIXO, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={larguraY}
          />
          {temNegativo && <ReferenceLine y={0} className="[&_line]:stroke-(--baseline)" strokeWidth={1} />}
          <Tooltip
            content={(p) => (
              <ConteudoTooltip
                active={p.active}
                payload={p.payload as TooltipProps['payload']}
                mascarado={mascarado}
              />
            )}
            cursor={{ style: { fill: 'var(--band)' }, stroke: 'none' }}
            filterNull={false}
            isAnimationActive={false}
          />
          <Bar
            dataKey="receita"
            name="Receita"
            radius={[8, 8, 0, 0]}
            maxBarSize={estreito ? 16 : 24}
            className="[&_.recharts-rectangle]:fill-(--positive)"
            isAnimationActive={!reduzirMovimento}
            animationDuration={500}
          />
          <Bar
            dataKey="despesa"
            name="Despesa"
            radius={[8, 8, 0, 0]}
            maxBarSize={estreito ? 16 : 24}
            className="[&_.recharts-rectangle]:fill-(--negative)"
            isAnimationActive={!reduzirMovimento}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="lucro"
            name="Lucro líquido"
            strokeWidth={2.5}
            style={{ stroke: 'var(--profit)' }}
            dot={false}
            activeDot={{ r: 5, style: { fill: 'var(--dot-bg)', stroke: 'var(--profit)' }, strokeWidth: 2.5 }}
            isAnimationActive={!reduzirMovimento}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
