import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CepInput, Input, PhoneInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { processImageFile, setPhoto } from '../../lib/profilePhotos';
import { ApiError } from '../../lib/api';
import type { Dentista, SexoEnum, EspecialidadeEnum } from '../../types';

// UFs do Brasil (27 = 26 estados + DF) — usado no seletor do CRO
const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

// Parseia string tipo "CRO-SE 12345" ou "CRO-SE 12345/2022" em partes editáveis
const parseCro = (cro: string | undefined): { uf: string; numero: string; ano: string } => {
  if (!cro) return { uf: 'SP', numero: '', ano: '' };
  const m = cro.match(/^CRO-([A-Z]{2})\s+(\d{4,6})(?:\/(\d{4}))?$/);
  if (!m) return { uf: 'SP', numero: '', ano: '' };
  return { uf: m[1], numero: m[2], ano: m[3] ?? '' };
};

// Monta string no formato exigido pelo backend
const buildCro = (uf: string, numero: string, ano: string): string => {
  if (!numero) return '';
  const base = `CRO-${uf} ${numero}`;
  return ano ? `${base}/${ano}` : base;
};

interface DentistaFormProps {
  initial: Dentista | null;
  photoKey?: string | null;
  onSubmit: (dentista: Dentista) => Promise<void>;
  onCancel: () => void;
}

const emptyDentista: Dentista = {
  nomeCompleto: '',
  cro: '',
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
  const initialCro = useMemo(() => parseCro(initial?.cro), [initial?.cro]);
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
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);

    // Valida CRO local antes de enviar (backend também valida via @Pattern)
    if (!croNumero) {
      setErrors({ cro: 'Informe o número do CRO.' });
      setSubmitting(false);
      return;
    }
    if (!/^\d{4,6}$/.test(croNumero)) {
      setErrors({ cro: 'Número do CRO deve ter entre 4 e 6 dígitos.' });
      setSubmitting(false);
      return;
    }
    if (croAno && !/^\d{4}$/.test(croAno)) {
      setErrors({ cro: 'Ano deve ter 4 dígitos (ex: 2022).' });
      setSubmitting(false);
      return;
    }

    const croCompleto = buildCro(croUf, croNumero, croAno);
    const payload: Dentista = { ...values, cro: croCompleto };

    try {
      if (pendingPhoto && photoKey) setPhoto(photoKey, pendingPhoto);
      await onSubmit(payload);
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
          {initial?.id ? 'Salvar alterações' : 'Cadastrar dentista'}
        </Button>
      </div>
    </form>
  );
};
