import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput, Input, Select, Textarea } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { useDentistasAtivos } from '../../services/dentistaService';
import { usePaciente, usePacientes } from '../../services/pacienteService';
import { formatCurrency } from '../../lib/utils';
import type {
  Agendamento,
  NomeProcedimentoEnum,
  StatusAgendamentoEnum,
  TipoAgendamentoEnum,
  TipoPagamentoProcedimentoEnum,
} from '../../types';

const tipoPagamentoOptions: { value: TipoPagamentoProcedimentoEnum; label: string }[] = [
  { value: 'A_VISTA', label: 'À vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
];

const parcelaOptions = Array.from({ length: 23 }, (_, i) => ({
  value: String(i + 2),
  label: `${i + 2}x`,
}));

// Mesmo mapa usado em PacienteProcedimentos — mantém rótulos consistentes.
const nomeProcedimentoLabel: Record<NomeProcedimentoEnum, string> = {
  RESTAURACAO_RESINA: 'Restauração em Resina',
  RESTAURACAO_AMALGAMA: 'Restauração em Amálgama',
  INLAY: 'Inlay',
  ONLAY: 'Onlay',
  FACETA_PORCELANA: 'Faceta de Porcelana',
  FACETA_RESINA: 'Faceta de Resina',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'Tratamento de Canal (Uni)',
  TRATAMENTO_CANAL_BIRRADICULAR: 'Tratamento de Canal (Bi)',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'Tratamento de Canal (Multi)',
  RETRATAMENTO_CANAL: 'Retratamento de Canal',
  PROFILAXIA: 'Profilaxia',
  RASPAGEM_SUPRAGENGIVAL: 'Raspagem Supragengival',
  RASPAGEM_SUBGENGIVAL: 'Raspagem Subgengival',
  GENGIVECTOMIA: 'Gengivectomia',
  ENXERTO_GENGIVAL: 'Enxerto Gengival',
  EXTRACAO_SIMPLES: 'Extração Simples',
  EXTRACAO_DENTE_SISO: 'Extração de Siso',
  CIRURGIA_PERIODONTAL: 'Cirurgia Periodontal',
  FRENECTOMIA: 'Frenectomia',
  BIOPSIA: 'Biópsia',
  INSTALACAO_IMPLANTE: 'Instalação de Implante',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'Prótese sobre Implante',
  ENXERTO_OSSEO: 'Enxerto Ósseo',
  PROTESE_PARCIAL_REMOVIVEL: 'Prótese Parcial Removível',
  PROTESE_TOTAL: 'Prótese Total',
  COROA_PORCELANA: 'Coroa de Porcelana',
  COROA_METALICA: 'Coroa Metálica',
  PONTE_FIXA: 'Ponte Fixa',
  APARELHO_METALICO: 'Aparelho Metálico',
  APARELHO_ESTETICO: 'Aparelho Estético',
  APARELHO_INVISIVEL: 'Aparelho Invisível',
  MANUTENCAO_ORTODONTICA: 'Manutenção Ortodôntica',
  CONTENCAO: 'Contenção',
  SELANTE: 'Selante',
  FLUORTERAPIA: 'Fluorterapia',
  COROA_PEDIATRICA: 'Coroa Pediátrica',
  PULPOTOMIA: 'Pulpotomia',
  CLAREAMENTO_CASEIRO: 'Clareamento Caseiro',
  CLAREAMENTO_CONSULTORIO: 'Clareamento em Consultório',
  MICROABRASAO: 'Microabrasão',
  RADIOGRAFIA_PERIAPICAL: 'Radiografia Periapical',
  RADIOGRAFIA_PANORAMICA: 'Radiografia Panorâmica',
  TOMOGRAFIA: 'Tomografia',
};

const nomeProcedimentoOptions = (
  Object.entries(nomeProcedimentoLabel) as [NomeProcedimentoEnum, string][]
)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const tipoAgendamentoOptions: { value: TipoAgendamentoEnum; label: string }[] = [
  { value: 'AVALIACAO', label: 'Avaliação' },
  { value: 'CONSULTA', label: 'Consulta de rotina' },
  { value: 'RETORNO', label: 'Retorno / Reavaliação' },
  { value: 'PROCEDIMENTO', label: 'Procedimento' },
  { value: 'MANUTENCAO', label: 'Manutenção (ortodontia / prótese)' },
  { value: 'URGENCIA', label: 'Urgência / Emergência' },
  { value: 'DOCUMENTACAO', label: 'Documentação (radiografia / fotos)' },
];

interface AgendamentoFormProps {
  initial: Agendamento | null;
  onSubmit: (ag: Agendamento) => Promise<void>;
  onCancel: () => void;
}

const emptyAgendamento: Agendamento = {
  pacienteId: '',
  dentistaId: '',
  dataHoraInicio: '',
  dataHoraFim: '',
  status: 'AGENDADO' as StatusAgendamentoEnum,
  tipoAgendamento: 'AVALIACAO',
  observacoes: '',
};

const statusOptions = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'FALTOU', label: 'Faltou' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

// Converte "2026-08-02T10:00" (input datetime-local) para ISO com segundos
const toIso = (v: string) => (v ? `${v}:00` : '');
// Converte ISO para o formato do input
const fromIso = (v?: string) => (v ? v.slice(0, 16) : '');

export const AgendamentoForm = ({ initial, onSubmit, onCancel }: AgendamentoFormProps) => {
  const [values, setValues] = useState<Agendamento>(() => ({
    ...emptyAgendamento,
    ...(initial ?? {}),
    dataHoraInicio: fromIso(initial?.dataHoraInicio),
    dataHoraFim: fromIso(initial?.dataHoraFim),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200, ordem: 'nomeCompleto' });
  const dentistasQ = useDentistasAtivos();
  const pacienteSelecionadoQ = usePaciente(values.pacienteId || undefined);

  const isConveniado = pacienteSelecionadoQ.data?.tipoPaciente === 'CONVENIO';
  const showPagamento =
    values.tipoAgendamento === 'PROCEDIMENTO' && !!values.pacienteId && !isConveniado;

  const pacienteOptions = [
    { value: '', label: '— Selecione um paciente —' },
    ...(pacientesQ.data?.content.map((p) => ({
      value: p.id,
      label: p.nomeCompleto,
    })) ?? []),
  ];

  const dentistaOptions = [
    { value: '', label: '— Selecione um dentista —' },
    ...(dentistasQ.data?.map((d) => ({
      value: d.id,
      label: `Dr(a). ${d.nomeCompleto} · ${d.cro}`,
    })) ?? []),
  ];

  const set = <K extends keyof Agendamento>(k: K, v: Agendamento[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        dataHoraInicio: toIso(values.dataHoraInicio),
        dataHoraFim: toIso(values.dataHoraFim),
        // Só envia o nome do procedimento se for tipo PROCEDIMENTO
        nomeProcedimento:
          values.tipoAgendamento === 'PROCEDIMENTO' ? values.nomeProcedimento : undefined,
        // Campos financeiros só quando aplicáveis (paciente particular + procedimento)
        valor: showPagamento ? values.valor : undefined,
        tipoPagamento: showPagamento ? (values.tipoPagamento ?? 'A_VISTA') : undefined,
        numeroParcelas:
          showPagamento && values.tipoPagamento === 'PARCELADO'
            ? (values.numeroParcelas ?? 2)
            : undefined,
        dataPrimeiroPagamento: showPagamento ? values.dataPrimeiroPagamento : undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar o agendamento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Paciente"
          required
          value={values.pacienteId}
          onChange={(e) => set('pacienteId', e.target.value)}
          options={pacienteOptions}
          error={errors.pacienteId}
          containerClassName="sm:col-span-2"
          disabled={pacientesQ.isLoading}
        />
        <Select
          label="Dentista"
          required
          value={values.dentistaId}
          onChange={(e) => set('dentistaId', e.target.value)}
          options={dentistaOptions}
          error={errors.dentistaId}
          containerClassName="sm:col-span-2"
          disabled={dentistasQ.isLoading}
        />

        <Select
          label="Tipo de agendamento"
          required
          value={values.tipoAgendamento ?? 'AVALIACAO'}
          onChange={(e) =>
            set('tipoAgendamento', e.target.value as TipoAgendamentoEnum)
          }
          options={tipoAgendamentoOptions}
          error={errors.tipoAgendamento}
          containerClassName={
            values.tipoAgendamento === 'PROCEDIMENTO' ? '' : 'sm:col-span-2'
          }
        />
        {values.tipoAgendamento === 'PROCEDIMENTO' && (
          <Select
            label="Procedimento"
            required
            value={values.nomeProcedimento ?? ''}
            onChange={(e) =>
              set(
                'nomeProcedimento',
                (e.target.value || undefined) as NomeProcedimentoEnum | undefined,
              )
            }
            options={[
              { value: '', label: '— Selecione —' },
              ...nomeProcedimentoOptions,
            ]}
            error={errors.nomeProcedimento}
            hint="Será criado automaticamente na aba Procedimentos do paciente."
          />
        )}

        {showPagamento && (
          <>
            <CurrencyInput
              label="Valor do procedimento"
              value={values.valor}
              onChange={(v) => set('valor', v)}
              error={errors.valor}
            />
            <Select
              label="Tipo de pagamento"
              value={values.tipoPagamento ?? 'A_VISTA'}
              onChange={(e) =>
                set('tipoPagamento', e.target.value as TipoPagamentoProcedimentoEnum)
              }
              options={tipoPagamentoOptions}
              error={errors.tipoPagamento}
            />
            <Input
              label="Data do primeiro pagamento"
              type="date"
              value={values.dataPrimeiroPagamento ?? ''}
              onChange={(e) => set('dataPrimeiroPagamento', e.target.value)}
              error={errors.dataPrimeiroPagamento}
              containerClassName={
                values.tipoPagamento === 'PARCELADO' ? '' : 'sm:col-span-2'
              }
            />
            {values.tipoPagamento === 'PARCELADO' && (
              <Select
                label="Número de parcelas"
                required
                value={String(values.numeroParcelas ?? 2)}
                onChange={(e) => set('numeroParcelas', parseInt(e.target.value, 10))}
                options={parcelaOptions}
                hint={
                  values.valor && values.numeroParcelas
                    ? `${values.numeroParcelas}x de ${formatCurrency(values.valor / values.numeroParcelas)}`
                    : 'Até 24 parcelas'
                }
                error={errors.numeroParcelas}
              />
            )}
          </>
        )}

        {values.tipoAgendamento === 'PROCEDIMENTO' && isConveniado && (
          <div className="sm:col-span-2 text-xs text-bokka-ink-3 bg-bokka-primary-soft/50 border border-bokka-primary/15 rounded-md px-3 py-2">
            Paciente conveniado — o valor e parcelamento serão cobrados via convênio.
          </div>
        )}

        <Input
          label="Início"
          type="datetime-local"
          required
          value={values.dataHoraInicio}
          onChange={(e) => set('dataHoraInicio', e.target.value)}
          error={errors.dataHoraInicio}
        />
        <Input
          label="Término"
          type="datetime-local"
          required
          value={values.dataHoraFim}
          onChange={(e) => set('dataHoraFim', e.target.value)}
          error={errors.dataHoraFim}
        />
        <Select
          label="Status"
          required
          value={values.status}
          onChange={(e) => set('status', e.target.value as StatusAgendamentoEnum)}
          options={statusOptions}
          containerClassName="sm:col-span-2"
        />
        <Textarea
          label="Observações"
          value={values.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={3}
          containerClassName="sm:col-span-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bokka-border -mx-6 px-6 max-sm:sticky max-sm:bottom-0 max-sm:-mb-6 max-sm:pb-4 max-sm:bg-bokka-surface max-sm:z-10">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Criar agendamento'}
        </Button>
      </div>
    </form>
  );
};
