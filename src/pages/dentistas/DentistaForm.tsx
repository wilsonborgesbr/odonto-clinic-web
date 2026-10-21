import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CepInput, CpfInput, EmailInput, Input, PhoneInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { processImageFile, setPhoto } from '../../lib/profilePhotos';
import { applyApiError } from '../../lib/formErrors';
import {
  buildCro,
  coletarErros,
  omitirVazios,
  parseCro,
  validateCep,
  validateCpf,
  validateEmail,
  validatePhone,
} from '../../lib/utils';
import type { Dentista, SexoEnum, EspecialidadeEnum } from '../../types';

// UFs do Brasil (27 = 26 estados + DF) — usado no seletor do CRO
const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

// Parte o CRO ("CRO-SE 12345" ou "CRO-SE 12345/2022", inclusive variações antigas) em campos editáveis
const croPartes = (cro: string | undefined): { uf: string; numero: string; ano: string } => {
  const p = parseCro(cro);
  if (!p) return { uf: 'SP', numero: '', ano: '' };
  return (UFS as readonly string[]).includes(p.uf) ? p : { ...p, uf: 'SP' };
};

const validarCro = (numero: string, ano: string): string | undefined => {
  if (!numero) return 'Informe o número do CRO.';
  if (!/^\d{4,6}$/.test(numero)) return 'Número do CRO deve ter entre 4 e 6 dígitos.';
  if (ano && (!/^\d{4}$/.test(ano) || Number(ano) < 1900 || Number(ano) > new Date().getFullYear())) {
    return 'Ano do CRO inválido. Use 4 dígitos, ex.: 2022.';
  }
  return undefined;
};

interface DentistaFormProps {
  initial: Dentista | null;
  photoKey?: string | null;
  onSubmit: (dentista: Dentista) => Promise<void>;
  onCancel: () => void;
}

// Campos do formulário que exibem erro do backend (as demais chaves vão para o aviso geral)
const CAMPOS_API = ['nomeCompleto', 'sexo', 'cro', 'cpf', 'especialidades', 'email', 'telefoneCelular', 'endereco.cep'] as const;

const emptyDentista: Dentista = {
  nomeCompleto: '',
  cro: '',
  cpf: '',
  especialidades: [],
  email: '',
  telefoneCelular: '',
  sexo: 'FEMININO' as SexoEnum,
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

const especialidadeOptions: { value: EspecialidadeEnum; label: string }[] = [
  { value: 'CLINICO_GERAL', label: 'Clínico Geral' },
  { value: 'ORTODONTIA', label: 'Ortodontia' },
  { value: 'IMPLANTODONTIA', label: 'Implantodontia' },
  { value: 'ENDODONTIA', label: 'Endodontia' },
  { value: 'PERIODONTIA', label: 'Periodontia' },
  { value: 'ODONTOPEDIATRIA', label: 'Odontopediatria' },
  { value: 'CIRURGIA', label: 'Cirurgia' },
  { value: 'PROTESE', label: 'Prótese' },
  { value: 'ESTETICA', label: 'Estética' },
  { value: 'RADIOLOGIA', label: 'Radiologia' },
];

export const DentistaForm = ({ initial, photoKey, onSubmit, onCancel }: DentistaFormProps) => {
  const [values, setValues] = useState<Dentista>(() => initial ?? emptyDentista);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  // CRO editado como 3 campos separados; parseia o valor inicial se existir
  const initialCro = useMemo(() => croPartes(initial?.cro), [initial?.cro]);
  const [croUf, setCroUf] = useState<string>(initialCro.uf);
  const [croNumero, setCroNumero] = useState<string>(initialCro.numero);
  const [croAno, setCroAno] = useState<string>(initialCro.ano);

  const set = <K extends keyof Dentista>(k: K, v: Dentista[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const setEnd = (k: keyof NonNullable<Dentista['endereco']>, v: string) =>
    setValues((prev) => ({
      ...prev,
      endereco: { ...(prev.endereco ?? {}), [k]: v },
    }));

  const toggleEsp = (esp: EspecialidadeEnum) => {
    setValues((prev) => {
      const current = prev.especialidades ?? [];
      const next = current.includes(esp)
        ? current.filter((e) => e !== esp)
        : [...current, esp];
      return { ...prev, especialidades: next };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // Valida no cliente antes de enviar (o backend também valida o formato canônico)
    const errosCliente = coletarErros({
      cro: validarCro(croNumero, croAno),
      cpf: validateCpf(values.cpf), // opcional: só valida se preenchido
      email: validateEmail(values.email),
      telefoneCelular: validatePhone(values.telefoneCelular, { variant: 'celular' }),
      'endereco.cep': validateCep(values.endereco?.cep),
    });
    setErrors(errosCliente);
    if (Object.keys(errosCliente).length) return;

    const payload: Dentista = omitirVazios({
      ...values,
      cro: buildCro(croUf, croNumero, croAno),
    });

    setSubmitting(true);
    try {
      if (pendingPhoto && photoKey) setPhoto(photoKey, pendingPhoto);
      await onSubmit(payload);
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
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Input
            label="Nome completo"
            required
            value={values.nomeCompleto}
            onChange={(e) => set('nomeCompleto', e.target.value)}
            error={errors.nomeCompleto}
            containerClassName="sm:col-span-4"
          />
          <Select
            label="Sexo"
            required
            value={values.sexo}
            onChange={(e) => set('sexo', e.target.value as SexoEnum)}
            options={sexoOptions}
            containerClassName="sm:col-span-2"
            error={errors.sexo}
          />

          <CpfInput
            label="CPF (opcional)"
            value={values.cpf ?? ''}
            onChange={(v) => set('cpf', v)}
            error={errors.cpf}
            hint="Não é obrigatório para cadastrar o dentista."
            containerClassName="sm:col-span-6"
          />

          {/* CRO: UF + número + ano opcional (padrão dos sistemas brasileiros) */}
          <Select
            label="CRO — UF"
            required
            value={croUf}
            onChange={(e) => setCroUf(e.target.value)}
            options={ufOptions}
            hint="Estado onde o CRO foi emitido"
            containerClassName="sm:col-span-1"
          />
          <Input
            label="Número do CRO"
            required
            value={croNumero}
            onChange={(e) => setCroNumero(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="12345"
            inputMode="numeric"
            error={errors.cro}
            containerClassName="sm:col-span-3"
          />
          <Input
            label="Ano (opcional)"
            value={croAno}
            onChange={(e) => setCroAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="2022"
            inputMode="numeric"
            containerClassName="sm:col-span-2"
          />
        </div>
        {initial?.cro && !parseCro(initial.cro) && (
          <p className="text-xs text-bokka-ink-3 mt-2">
            CRO anterior fora do padrão: <span className="font-mono">{initial.cro}</span>. Confira UF
            e número acima.
          </p>
        )}
        {croNumero && (
          <p className="text-xs text-bokka-ink-3 mt-2">
            Registro completo:{' '}
            <span className="font-mono font-semibold text-bokka-ink">
              {buildCro(croUf, croNumero, croAno)}
            </span>
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {especialidadeOptions.map((opt) => {
            const selected = (values.especialidades ?? []).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleEsp(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selected
                    ? 'bg-bokka-primary text-white border-bokka-primary'
                    : 'bg-bokka-surface-2 text-bokka-ink-2 border-bokka-border hover:border-bokka-primary/40'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.especialidades && (
          <p className="text-xs text-bokka-danger-ink mt-1">{errors.especialidades}</p>
        )}
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
          {initial?.id ? 'Salvar alterações' : 'Cadastrar dentista'}
        </Button>
      </div>
    </form>
  );
};
