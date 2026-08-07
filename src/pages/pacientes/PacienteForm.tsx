import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CepInput, CpfInput, Input, PhoneInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { processImageFile, setPhoto } from '../../lib/profilePhotos';
import { ApiError } from '../../lib/api';
import { useConvenios } from '../../services/convenioService';
import type { Paciente, SexoEnum, TipoPaciente } from '../../types';

interface PacienteFormProps {
  initial: Paciente | null;
  photoKey?: string | null;
  onSubmit: (paciente: Paciente) => Promise<void>;
  onCancel: () => void;
}

const emptyPaciente: Paciente = {
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  sexo: 'FEMININO' as SexoEnum,
  tipoPaciente: 'PARTICULAR' as TipoPaciente,
  email: '',
  telefoneCelular: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  },
};

const sexoOptions = [
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'OUTRO', label: 'Outro' },
];

const tipoPacienteOptions = [
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'CONVENIO', label: 'Convênio' },
  { value: 'MISTO', label: 'Misto' },
];

const estadoCivilOptions = [
  { value: '', label: '—' },
  { value: 'SOLTEIRO', label: 'Solteiro(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUVO', label: 'Viúvo(a)' },
  { value: 'OUTRO', label: 'Outro' },
];

export const PacienteForm = ({ initial, photoKey, onSubmit, onCancel }: PacienteFormProps) => {
  const [values, setValues] = useState<Paciente>(() => initial ?? emptyPaciente);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const conveniosQ = useConvenios();
  const showConvenio = values.tipoPaciente === 'CONVENIO' || values.tipoPaciente === 'MISTO';
  const convenioOptions = (conveniosQ.data ?? [])
    .filter((c) => c.ativo)
    .map((c) => ({ value: c.id!, label: c.nome ?? c.id! }));

  const set = <K extends keyof Paciente>(k: K, v: Paciente[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const setEnd = (k: keyof NonNullable<Paciente['endereco']>, v: string) =>
    setValues((prev) => ({
      ...prev,
      endereco: { ...(prev.endereco ?? {}), [k]: v },
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    try {
      if (pendingPhoto && photoKey) setPhoto(photoKey, pendingPhoto);
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      {photoKey && (
        <section className="flex items-center gap-4">
          <Avatar
            photoKey={photoKey}
            name={values.nomeCompleto}
            size="xl"
            editable
            previewSrc={pendingPhoto}
            onFileSelect={async (file) => {
              const uri = await processImageFile(file);
              setPendingPhoto(uri);
            }}
            ring
          />
          <div>
            <p className="text-sm font-semibold text-bokka-ink">Foto de perfil</p>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {pendingPhoto ? 'Nova foto selecionada — será salva ao confirmar.' : 'Clique no avatar para alterar.'}
            </p>
            {pendingPhoto && (
              <button
                type="button"
                onClick={() => setPendingPhoto(null)}
                className="text-xs text-bokka-danger-ink hover:underline mt-1"
              >
                Remover nova foto
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome completo"
            required
            value={values.nomeCompleto}
            onChange={(e) => set('nomeCompleto', e.target.value)}
            error={errors.nomeCompleto}
            containerClassName="sm:col-span-2"
          />
          <CpfInput
            label="CPF"
            required
            value={values.cpf}
            onChange={(v) => set('cpf', v)}
            error={errors.cpf}
          />
          <Input
            label="Data de nascimento"
            type="date"
            required
            value={values.dataNascimento}
            onChange={(e) => set('dataNascimento', e.target.value)}
            error={errors.dataNascimento}
          />
          <Select
            label="Sexo"
            required
            value={values.sexo}
            onChange={(e) => set('sexo', e.target.value as SexoEnum)}
            options={sexoOptions}
            error={errors.sexo}
          />
          <Select
            label="Tipo de paciente"
            required
            value={values.tipoPaciente}
            onChange={(e) => {
              const v = e.target.value as TipoPaciente;
              set('tipoPaciente', v);
              if (v === 'PARTICULAR') set('convenioId', undefined);
            }}
            options={tipoPacienteOptions}
            error={errors.tipoPaciente}
          />
          {showConvenio && (
            <Select
              label="Convênio"
              required
              value={values.convenioId ?? ''}
              onChange={(e) => set('convenioId', e.target.value || undefined)}
              options={[
                { value: '', label: 'Selecione o convênio' },
                ...convenioOptions,
              ]}
              error={errors.convenioId}
            />
          )}
          <Select
            label="Estado civil"
            value={values.estadoCivil ?? ''}
            onChange={(e) => set('estadoCivil', (e.target.value || undefined) as Paciente['estadoCivil'])}
            options={estadoCivilOptions}
          />
          <Input
            label="Profissão"
            value={values.profissao ?? ''}
            onChange={(e) => set('profissao', e.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Contato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="E-mail"
            type="email"
            value={values.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <PhoneInput
            label="Celular"
            value={values.telefoneCelular ?? ''}
            onChange={(v) => set('telefoneCelular', v)}
            error={errors.telefoneCelular}
          />
          <PhoneInput
            label="Telefone fixo"
            variant="fixo"
            value={values.telefoneFixo ?? ''}
            onChange={(v) => set('telefoneFixo', v)}
          />
          <Input
            label="Contato de emergência"
            value={values.nomeContatoEmergencia ?? ''}
            onChange={(e) => set('nomeContatoEmergencia', e.target.value)}
          />
          <PhoneInput
            label="Telefone de emergência"
            value={values.telefoneEmergencia ?? ''}
            onChange={(v) => set('telefoneEmergencia', v)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Endereço</h3>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <CepInput
            label="CEP"
            value={values.endereco?.cep ?? ''}
            onChange={(v) => setEnd('cep', v)}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Logradouro"
            value={values.endereco?.logradouro ?? ''}
            onChange={(e) => setEnd('logradouro', e.target.value)}
            containerClassName="sm:col-span-4"
          />
          <Input
            label="Número"
            value={values.endereco?.numero ?? ''}
            onChange={(e) => setEnd('numero', e.target.value)}
            containerClassName="sm:col-span-1"
          />
          <Input
            label="Complemento"
            value={values.endereco?.complemento ?? ''}
            onChange={(e) => setEnd('complemento', e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Bairro"
            value={values.endereco?.bairro ?? ''}
            onChange={(e) => setEnd('bairro', e.target.value)}
            containerClassName="sm:col-span-3"
          />
          <Input
            label="Cidade"
            value={values.endereco?.cidade ?? ''}
            onChange={(e) => setEnd('cidade', e.target.value)}
            containerClassName="sm:col-span-4"
          />
          <Input
            label="UF"
            maxLength={2}
            value={values.endereco?.estado ?? ''}
            onChange={(e) => setEnd('estado', e.target.value.toUpperCase())}
            containerClassName="sm:col-span-2"
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar paciente'}
        </Button>
      </div>
    </form>
  );
};
