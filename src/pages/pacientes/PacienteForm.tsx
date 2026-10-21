import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CepInput, CpfInput, EmailInput, Input, PhoneInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { processImageFile, setPhoto } from '../../lib/profilePhotos';
import { applyApiError } from '../../lib/formErrors';
import {
  calcularIdade,
  coletarErros,
  hojeIso,
  omitirVazios,
  onlyDigits,
  validateCep,
  validateCpf,
  validateDataNascimento,
  validateEmail,
  validatePhone,
} from '../../lib/utils';
import { useConvenios } from '../../services/convenioService';
import type { Paciente, SexoEnum, TipoPaciente } from '../../types';

interface PacienteFormProps {
  initial: Paciente | null;
  photoKey?: string | null;
  onSubmit: (paciente: Paciente) => Promise<void>;
  onCancel: () => void;
}

// Campos do formulário que exibem erro do backend (as demais chaves vão para o aviso geral)
const CAMPOS_API = ['nomeCompleto', 'cpf', 'dataNascimento', 'responsavelNome', 'responsavelCpf', 'sexo', 'tipoPaciente', 'convenioId', 'email', 'telefoneCelular', 'telefoneFixo', 'telefoneEmergencia', 'endereco.cep'] as const;

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

const IDADE_MAIORIDADE = 18;

/** Nome e CPF do responsável são opcionais, mas só valem em par; CPF não pode ser o do paciente. */
const validarResponsavel = (v: Paciente): Record<string, string | undefined> => {
  const nome = (v.responsavelNome ?? '').trim();
  const cpf = onlyDigits(v.responsavelCpf);
  if (!nome && !cpf) return {};
  if (nome && !cpf) return { responsavelCpf: 'Informe o CPF do responsável.' };
  if (!nome) return { responsavelNome: 'Informe o nome do responsável.' };
  const erroCpf = validateCpf(v.responsavelCpf);
  if (erroCpf) return { responsavelCpf: erroCpf };
  if (cpf === onlyDigits(v.cpf)) {
    return { responsavelCpf: 'O CPF do responsável deve ser diferente do CPF do paciente.' };
  }
  return {};
};

const AVISO_BLOCO_VISIVEL =
  'Paciente menor de idade. Campos do responsável disponíveis abaixo da data de nascimento.';
const AVISO_BLOCO_OCULTO = 'Campos do responsável ocultados.';

// Cadastros legados podem vir sem CPF/data (null); o formulário trabalha sempre com string.
const iniciar = (initial: Paciente | null): Paciente =>
  initial
    ? { ...initial, cpf: initial.cpf ?? '', dataNascimento: initial.dataNascimento ?? '' }
    : emptyPaciente;

export const PacienteForm = ({ initial, photoKey, onSubmit, onCancel }: PacienteFormProps) => {
  const [values, setValues] = useState<Paciente>(() => iniciar(initial));
  const [aviso, setAviso] = useState('');
  const idBloco = useId();

  // O bloco do responsável aparece para menor de 18 anos (com data preenchida) ou quando o
  // cadastro já tem responsável gravado — esse nunca some da tela sem o usuário perceber.
  const temResponsavelGravado = Boolean(initial?.responsavelNome || initial?.responsavelCpf);
  const blocoVisivelPara = (dataNascimento?: string) => {
    const idade = calcularIdade(dataNascimento);
    return temResponsavelGravado || (idade !== null && idade < IDADE_MAIORIDADE);
  };
  const mostrarResponsavel = blocoVisivelPara(values.dataNascimento);

  const mudarDataNascimento = (novaData: string) => {
    const depois = blocoVisivelPara(novaData);
    if (depois !== mostrarResponsavel) setAviso(depois ? AVISO_BLOCO_VISIVEL : AVISO_BLOCO_OCULTO);
    set('dataNascimento', novaData);
  };
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
    setGlobalError(null);

    const errosResponsavel = mostrarResponsavel ? validarResponsavel(values) : {};

    const errosCliente = coletarErros({
      cpf: validateCpf(values.cpf, { required: true }),
      dataNascimento: validateDataNascimento(values.dataNascimento),
      ...errosResponsavel,
      email: validateEmail(values.email),
      telefoneCelular: validatePhone(values.telefoneCelular, { variant: 'celular' }),
      telefoneFixo: validatePhone(values.telefoneFixo, { variant: 'fixo' }),
      telefoneEmergencia: validatePhone(values.telefoneEmergencia),
      'endereco.cep': validateCep(values.endereco?.cep),
    });
    setErrors(errosCliente);
    if (Object.keys(errosCliente).length) return;

    setSubmitting(true);
    try {
      if (pendingPhoto && photoKey) setPhoto(photoKey, pendingPhoto);
      // Bloco oculto: o que foi digitado ali fica só na tela, não vai (nem é validado) no envio
      const payload: Paciente = { ...values };
      if (!mostrarResponsavel) {
        delete payload.responsavelNome;
        delete payload.responsavelCpf;
      }
      await onSubmit(omitirVazios(payload));
    } catch (err) {
      applyApiError(err, {
        campos: CAMPOS_API,
        setErrors,
        setGlobalError,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sempre montada, para o leitor de tela anunciar só quando o texto mudar após uma ação do usuário */}
      <div role="status" aria-live="polite" className="sr-only">
        {aviso}
      </div>

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
            min="1900-01-01"
            max={hojeIso()}
            value={values.dataNascimento ?? ''}
            onChange={(e) => mudarDataNascimento(e.target.value)}
            error={errors.dataNascimento}
          />
          {mostrarResponsavel && (
            <div
              role="group"
              aria-labelledby={`${idBloco}-titulo`}
              aria-describedby={`${idBloco}-apoio`}
              className="sm:col-span-2 rounded-lg border border-bokka-border bg-bokka-surface-2 p-4 space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
                  <UserRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h4 id={`${idBloco}-titulo`} className="text-sm font-semibold text-bokka-ink">
                    Paciente menor de idade
                  </h4>
                  <p id={`${idBloco}-apoio`} className="text-xs text-bokka-ink-2 mt-0.5">
                    Se houver, informe quem é o responsável. Nome e CPF devem ser preenchidos juntos.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome do responsável"
                  autoComplete="off"
                  value={values.responsavelNome ?? ''}
                  onChange={(e) => set('responsavelNome', e.target.value)}
                  error={errors.responsavelNome}
                />
                <CpfInput
                  label="CPF do responsável"
                  value={values.responsavelCpf}
                  onChange={(v) => set('responsavelCpf', v)}
                  error={errors.responsavelCpf}
                />
              </div>
            </div>
          )}
          <Select
            label="Sexo"
            required
            value={values.sexo ?? ''}
            onChange={(e) => set('sexo', e.target.value as SexoEnum)}
            options={sexoOptions}
            error={errors.sexo}
          />
          <Select
            label="Tipo de paciente"
            required
            value={values.tipoPaciente ?? ''}
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
          <EmailInput
            label="E-mail"
            value={values.email ?? ''}
            onChange={(v) => set('email', v)}
            error={errors.email}
          />
          <PhoneInput
            label="Celular"
            variant="celular"
            value={values.telefoneCelular ?? ''}
            onChange={(v) => set('telefoneCelular', v)}
            error={errors.telefoneCelular}
          />
          <PhoneInput
            label="Telefone fixo"
            variant="fixo"
            value={values.telefoneFixo ?? ''}
            onChange={(v) => set('telefoneFixo', v)}
            error={errors.telefoneFixo}
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
            error={errors.telefoneEmergencia}
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
            error={errors['endereco.cep']}
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

      <div className="flex justify-end gap-3 border-t border-bokka-border -mx-6 px-6 pt-4 max-sm:sticky max-sm:bottom-0 max-sm:-mb-6 max-sm:pb-4 max-sm:bg-bokka-surface max-sm:z-10">
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
