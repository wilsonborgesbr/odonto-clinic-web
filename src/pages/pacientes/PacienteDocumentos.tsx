import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Image,
  FileCheck,
  FileSignature,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useDocumentosPorPaciente,
  useCriarDocumento,
  useExcluirDocumento,
} from '../../services/documentoService';
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

const tipoSelectOptions = Object.entries(tipoLabel).map(([value, label]) => ({
  value,
  label,
}));

interface PacienteDocumentosProps {
  pacienteId: string;
}

export const PacienteDocumentos = ({ pacienteId }: PacienteDocumentosProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [confirmar, setConfirmar] = useState<{ id: string; desc: string } | null>(null);

  const documentosQ = useDocumentosPorPaciente(pacienteId);
  const criarM = useCriarDocumento();
  const excluirM = useExcluirDocumento();

  const documentos = documentosQ.data ?? [];

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

  return (
    <>
      <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-bokka-ink">Documentos</h3>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setFormOpen(true)}
          >
            Adicionar
          </Button>
        </div>

        {documentosQ.isLoading ? (
          <div className="px-5 pb-5 space-y-2">
            <Skeleton className="h-12 w-full" rounded="lg" />
            <Skeleton className="h-12 w-full" rounded="lg" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              compact
              icon={<FileText className="w-6 h-6" strokeWidth={1.75} />}
              title="Nenhum documento"
              description="Adicione documentos como radiografias, contratos e laudos."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-5 py-2.5 font-semibold">Documento</th>
                  <th className="px-3 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-bokka-surface-3/50 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
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
                    <td className="px-3 py-2.5">
                      <Badge tone={tipoTone(doc.tipo)}>
                        {doc.tipo ? tipoLabel[doc.tipo] : 'Outro'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-bokka-ink-2 tabular-nums whitespace-nowrap">
                      {formatDate(doc.dataUpload)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmar({ id: doc.id!, desc: doc.descricao || 'documento' })
                        }
                        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
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
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Novo documento"
        subtitle="Registre um novo arquivo para este paciente."
        size="lg"
      >
        <DocumentoFormInline
          pacienteId={pacienteId}
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
    </>
  );
};

const DocumentoFormInline = ({
  pacienteId,
  onSubmit,
  onCancel,
}: {
  pacienteId: string;
  onSubmit: (doc: Documento) => Promise<void>;
  onCancel: () => void;
}) => {
  const [tipo, setTipo] = useState<TipoDocumentoEnum>('OUTRO');
  const [descricao, setDescricao] = useState('');
  const [urlArquivo, setUrlArquivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
