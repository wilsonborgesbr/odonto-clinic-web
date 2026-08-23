import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Image,
  FileCheck,
  FileSignature,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useDocumentos,
  useCriarDocumento,
  useExcluirDocumento,
} from '../../services/documentoService';
import { usePacientes } from '../../services/pacienteService';
import { ApiError } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import type { Documento, TipoDocumentoEnum } from '../../types';

const tipoLabel: Record<TipoDocumentoEnum, string> = {
  RADIOGRAFIA: 'Radiografia',
  FOTO_INTRAORAL: 'Foto Intraoral',
  FOTO_EXTRAORAL: 'Foto Extraoral',
  LAUDO: 'Laudo',
  CONTRATO: 'Contrato',
  ORCAMENTO_ASSINADO: 'Orçamento Assinado',
  TERMO_CONSENTIMENTO: 'Termo de Consentimento',
  OUTRO: 'Outro',
};

const tipoIcon = (tipo?: TipoDocumentoEnum) => {
  switch (tipo) {
    case 'RADIOGRAFIA':
    case 'FOTO_INTRAORAL':
    case 'FOTO_EXTRAORAL':
      return <Image className="w-4 h-4" strokeWidth={1.75} />;
    case 'LAUDO':
      return <FileCheck className="w-4 h-4" strokeWidth={1.75} />;
    case 'CONTRATO':
    case 'ORCAMENTO_ASSINADO':
    case 'TERMO_CONSENTIMENTO':
      return <FileSignature className="w-4 h-4" strokeWidth={1.75} />;
    default:
      return <FileText className="w-4 h-4" strokeWidth={1.75} />;
  }
};

const tipoTone = (tipo?: TipoDocumentoEnum): 'primary' | 'info' | 'warning' | 'success' | 'neutral' => {
  switch (tipo) {
    case 'RADIOGRAFIA':
    case 'FOTO_INTRAORAL':
    case 'FOTO_EXTRAORAL':
      return 'info';
    case 'LAUDO':
      return 'success';
    case 'CONTRATO':
    case 'ORCAMENTO_ASSINADO':
    case 'TERMO_CONSENTIMENTO':
      return 'warning';
    default:
      return 'neutral';
  }
};

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  ...Object.entries(tipoLabel).map(([value, label]) => ({ value, label })),
];

const tipoSelectOptions = Object.entries(tipoLabel).map(([value, label]) => ({
  value,
  label,
}));

export const DocumentosPage = () => {
  const [tipoFilter, setTipoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [confirmar, setConfirmar] = useState<{ id: string; desc: string } | null>(null);

  const documentosQ = useDocumentos();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200 });
  const criarM = useCriarDocumento();
  const excluirM = useExcluirDocumento();

  const pacienteMap = useMemo(() => {
    const map = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => map.set(p.id, p.nomeCompleto));
    return map;
  }, [pacientesQ.data]);

  const documentos = documentosQ.data ?? [];

  const filtrados = useMemo(() => {
    let list = documentos;
    if (tipoFilter) list = list.filter((d) => d.tipo === tipoFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          (d.descricao && d.descricao.toLowerCase().includes(q)) ||
          (d.pacienteId && (pacienteMap.get(d.pacienteId) ?? '').toLowerCase().includes(q)),
      );
    }
    return list;
  }, [documentos, tipoFilter, search, pacienteMap]);

  const handleExcluir = async () => {
    if (!confirmar) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      bokkaToast.success('Documento excluído.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const loading = documentosQ.isLoading || pacientesQ.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Documentos</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Arquivos vinculados aos pacientes da clínica.
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>
          Novo documento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Total</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">{documentos.length}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Radiografias</p>
          <p className="text-2xl font-bold text-bokka-info-ink mt-1 tabular-nums">
            {documentos.filter((d) => d.tipo === 'RADIOGRAFIA').length}
          </p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Contratos</p>
          <p className="text-2xl font-bold text-bokka-warning-ink mt-1 tabular-nums">
            {documentos.filter((d) => d.tipo === 'CONTRATO' || d.tipo === 'ORCAMENTO_ASSINADO' || d.tipo === 'TERMO_CONSENTIMENTO').length}
          </p>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-bokka-border flex flex-wrap items-center gap-3">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
          >
            {tipoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bokka-ink-3" />
            <input
              type="text"
              placeholder="Buscar por descrição ou paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum documento encontrado"
            description={
              search.trim() || tipoFilter
                ? 'Nenhum resultado para os filtros aplicados.'
                : 'Adicione o primeiro documento da clínica.'
            }
            action={
              !search.trim() && !tipoFilter ? (
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>
                  Adicionar documento
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Abaixo de md: lista de cards empilhados */}
            <div className="md:hidden divide-y divide-bokka-border">
              {filtrados.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      tipoTone(doc.tipo) === 'info'
                        ? 'bg-bokka-info-soft text-bokka-info-ink'
                        : tipoTone(doc.tipo) === 'success'
                          ? 'bg-bokka-success-soft text-bokka-success-ink'
                          : tipoTone(doc.tipo) === 'warning'
                            ? 'bg-bokka-warning-soft text-bokka-warning-ink'
                            : 'bg-bokka-surface-3 text-bokka-ink-3',
                    )}
                  >
                    {tipoIcon(doc.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-bokka-ink truncate">
                      {doc.descricao || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-bokka-ink-3 mt-0.5 truncate">
                      {doc.pacienteId ? pacienteMap.get(doc.pacienteId) ?? `#${doc.pacienteId.slice(-6)}` : '—'}
                      {' · '}
                      {formatDate(doc.dataUpload)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={tipoTone(doc.tipo)}>{doc.tipo ? tipoLabel[doc.tipo] : 'Outro'}</Badge>
                      {doc.urlArquivo && (
                        <a
                          href={doc.urlArquivo}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-bokka-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          Ver arquivo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmar({ id: doc.id!, desc: doc.descricao || 'documento' })}
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors shrink-0"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-5 py-3 font-semibold">Documento</th>
                  <th className="px-3 py-3 font-semibold">Paciente</th>
                  <th className="px-3 py-3 font-semibold">Tipo</th>
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {filtrados.map((doc) => (
                  <tr key={doc.id} className="hover:bg-bokka-surface-3/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                            tipoTone(doc.tipo) === 'info'
                              ? 'bg-bokka-info-soft text-bokka-info-ink'
                              : tipoTone(doc.tipo) === 'success'
                                ? 'bg-bokka-success-soft text-bokka-success-ink'
                                : tipoTone(doc.tipo) === 'warning'
                                  ? 'bg-bokka-warning-soft text-bokka-warning-ink'
                                  : 'bg-bokka-surface-3 text-bokka-ink-3',
                          )}
                        >
                          {tipoIcon(doc.tipo)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-bokka-ink truncate">
                            {doc.descricao || 'Sem descrição'}
                          </p>
                          {doc.urlArquivo && (
                            <a
                              href={doc.urlArquivo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-bokka-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              Ver arquivo <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-bokka-ink-2 truncate max-w-[160px]">
                      {doc.pacienteId ? pacienteMap.get(doc.pacienteId) ?? `#${doc.pacienteId.slice(-6)}` : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={tipoTone(doc.tipo)}>
                        {doc.tipo ? tipoLabel[doc.tipo] : 'Outro'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-bokka-ink-2 tabular-nums whitespace-nowrap">
                      {formatDate(doc.dataUpload)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmar({ id: doc.id!, desc: doc.descricao || 'documento' })
                        }
                        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Novo documento"
        subtitle="Registre um novo arquivo vinculado a um paciente."
        size="lg"
      >
        <DocumentoForm
          pacientes={(pacientesQ.data?.content ?? []).map((p) => ({
            value: p.id,
            label: p.nomeCompleto,
          }))}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (doc) => {
            await criarM.mutateAsync(doc);
            bokkaToast.success('Documento registrado.');
            setFormOpen(false);
          }}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Excluir documento"
        message={`Tem certeza que deseja excluir "${confirmar?.desc}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleExcluir}
      />
    </div>
  );
};

const DocumentoForm = ({
  pacientes,
  onSubmit,
  onCancel,
}: {
  pacientes: { value: string; label: string }[];
  onSubmit: (doc: Documento) => Promise<void>;
  onCancel: () => void;
}) => {
  const [pacienteId, setPacienteId] = useState('');
  const [tipo, setTipo] = useState<TipoDocumentoEnum>('OUTRO');
  const [descricao, setDescricao] = useState('');
  const [urlArquivo, setUrlArquivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pacienteId) {
      setGlobalError('Selecione um paciente.');
      return;
    }
    setSubmitting(true);
    setGlobalError(null);
    try {
      await onSubmit({ pacienteId, tipo, descricao, urlArquivo });
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar.',
      );
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
      <Select
        label="Paciente"
        required
        value={pacienteId}
        onChange={(e) => setPacienteId(e.target.value)}
        options={[{ value: '', label: 'Selecione o paciente...' }, ...pacientes]}
      />
      <Select
        label="Tipo"
        required
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoDocumentoEnum)}
        options={tipoSelectOptions}
      />
      <Input
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex: Radiografia panorâmica inicial"
      />
      <Input
        label="URL do arquivo"
        value={urlArquivo}
        onChange={(e) => setUrlArquivo(e.target.value)}
        placeholder="https://..."
      />
      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Registrar documento
        </Button>
      </div>
    </form>
  );
};
