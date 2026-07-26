import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Paciente, Endereco } from '../../types';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ApiError } from '../../services/api';

interface PacienteFormProps {
  initial?: Paciente | null;
  onCancel: () => void;
  onSubmit: (paciente: Paciente) => Promise<void>;
}

// Estado interno do formulário — usamos strings para todos os campos porque
// inputs HTML sempre trabalham com string. A conversão para o formato do backend
// acontece no submit (ex: date-string vazia vira undefined em vez de "").
type FormState = {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  email: string;
  telefoneCelular: string;
  telefoneFixo: string;
  nomeContatoEmergencia: string;
  telefoneEmergencia: string;
  tipoSanguineo: string;
  tipoPaciente: string;
  tipoPagamento: string;
  comoConheceu: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
};

const emptyState: FormState = {
  nomeCompleto: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  sexo: '',
  estadoCivil: '',
  profissao: '',
  email: '',
  telefoneCelular: '',
  telefoneFixo: '',
  nomeContatoEmergencia: '',
  telefoneEmergencia: '',
  tipoSanguineo: '',
  tipoPaciente: '',
  tipoPagamento: '',
  comoConheceu: '',
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

const fromPaciente = (p: Paciente): FormState => ({
  nomeCompleto: p.nomeCompleto ?? '',
  cpf: p.cpf ?? '',
  rg: p.rg ?? '',
  dataNascimento: p.dataNascimento ?? '',
  sexo: p.sexo ?? '',
  estadoCivil: p.estadoCivil ?? '',
  profissao: p.profissao ?? '',
  email: p.email ?? '',
  telefoneCelular: p.telefoneCelular ?? '',
  telefoneFixo: p.telefoneFixo ?? '',
  nomeContatoEmergencia: p.nomeContatoEmergencia ?? '',
  telefoneEmergencia: p.telefoneEmergencia ?? '',
  tipoSanguineo: p.tipoSanguineo ?? '',
  tipoPaciente: p.tipoPaciente ?? '',
  tipoPagamento: p.tipoPagamento ?? '',
  comoConheceu: p.comoConheceu ?? '',
  endereco: {
    cep: p.endereco?.cep ?? '',
    logradouro: p.endereco?.logradouro ?? '',
    numero: p.endereco?.numero ?? '',
    complemento: p.endereco?.complemento ?? '',
    bairro: p.endereco?.bairro ?? '',
    cidade: p.endereco?.cidade ?? '',
    estado: p.endereco?.estado ?? '',
  },
});

const CEP_RE = /^\d{5}-?\d{3}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Espelha as validações do backend (Paciente e Endereco).
const validate = (s: FormState): Record<string, string> => {
  const err: Record<string, string> = {};

  if (!s.nomeCompleto.trim()) err.nomeCompleto = 'Nome completo é obrigatório';
  if (!s.cpf.trim()) err.cpf = 'CPF é obrigatório';
  if (!s.dataNascimento) err.dataNascimento = 'Data de nascimento é obrigatória';
  if (!s.sexo) err.sexo = 'Sexo é obrigatório';
  if (!s.tipoPaciente) err.tipoPaciente = 'Tipo de paciente é obrigatório';
  if (s.email && !EMAIL_RE.test(s.email)) err.email = 'E-mail inválido';

  const e = s.endereco;
  const enderecoPreenchido =
    e.cep || e.logradouro || e.bairro || e.cidade || e.estado || e.numero || e.complemento;

  if (enderecoPreenchido) {
    if (!e.cep) err['endereco.cep'] = 'CEP é obrigatório';
    else if (!CEP_RE.test(e.cep)) err['endereco.cep'] = 'CEP inválido (00000-000)';
    if (!e.logradouro) err['endereco.logradouro'] = 'Logradouro é obrigatório';
    if (!e.bairro) err['endereco.bairro'] = 'Bairro é obrigatório';
    if (!e.cidade) err['endereco.cidade'] = 'Cidade é obrigatória';
    if (!e.estado) err['endereco.estado'] = 'Estado é obrigatório';
  }

  return err;
};

const toPaciente = (s: FormState): Paciente => {
  const enderecoTemAlgo = Object.values(s.endereco).some((v) => v.trim() !== '');
  const endereco: Endereco | undefined = enderecoTemAlgo
    ? {
        cep: s.endereco.cep || undefined,
        logradouro: s.endereco.logradouro || undefined,
        numero: s.endereco.numero || undefined,
        complemento: s.endereco.complemento || undefined,
        bairro: s.endereco.bairro || undefined,
        cidade: s.endereco.cidade || undefined,
        estado: s.endereco.estado || undefined,
      }
    : undefined;

  return {
    nomeCompleto: s.nomeCompleto.trim(),
    cpf: s.cpf.trim(),
    rg: s.rg.trim() || undefined,
    dataNascimento: s.dataNascimento,
    sexo: s.sexo as Paciente['sexo'],
    estadoCivil: (s.estadoCivil || undefined) as Paciente['estadoCivil'],
    profissao: s.profissao.trim() || undefined,
    email: s.email.trim() || undefined,
    telefoneCelular: s.telefoneCelular.trim() || undefined,
    telefoneFixo: s.telefoneFixo.trim() || undefined,
    nomeContatoEmergencia: s.nomeContatoEmergencia.trim() || undefined,
    telefoneEmergencia: s.telefoneEmergencia.trim() || undefined,
    endereco,
    tipoSanguineo: s.tipoSanguineo.trim() || undefined,
    tipoPaciente: s.tipoPaciente as Paciente['tipoPaciente'],
    tipoPagamento: (s.tipoPagamento || undefined) as Paciente['tipoPagamento'],
    comoConheceu: (s.comoConheceu || undefined) as Paciente['comoConheceu'],
  };
};

const opt = (arr: string[]) => arr.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

const sexos = opt(['MASCULINO', 'FEMININO', 'OUTRO']);
const estadoCivis = opt(['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'OUTRO']);
const tiposPaciente = opt(['PARTICULAR', 'CONVENIO', 'MISTO']);
const tiposPagamento = opt(['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO']);
const comoConheceuOpts = opt(['INDICACAO', 'INSTAGRAM', 'GOOGLE', 'OUTRO']);

export const PacienteForm = ({ initial, onCancel, onSubmit }: PacienteFormProps) => {
  // O estado do formulário fica todo neste useState — cada input é "controlado":
  // seu `value` vem de `form.<campo>` e `onChange` chama `setForm(...)` para atualizar.
  // Isso mantém React como fonte única da verdade e permite validar antes do submit.
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Quando abrimos o modal em modo edição, `initial` traz o paciente carregado.
  // Este effect reseta o estado do formulário com os dados dele.
  useEffect(() => {
    setForm(initial ? fromPaciente(initial) : emptyState);
    setErrors({});
    setGlobalError(null);
  }, [initial]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // limpa o erro deste campo assim que o usuário digita
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setEndereco = (field: keyof FormState['endereco'], value: string) => {
    setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, [field]: value } }));
    const key = `endereco.${field}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toPaciente(form));
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrs = err.fieldErrors();
        if (Object.keys(fieldErrs).length > 0) {
          setErrors(fieldErrs);
        } else {
          setGlobalError(err.friendlyMessage());
        }
      } else {
        setGlobalError('Erro inesperado ao salvar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {globalError}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Dados pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TextField
            label="Nome completo"
            required
            value={form.nomeCompleto}
            onChange={(e) => setField('nomeCompleto', e.target.value)}
            error={errors.nomeCompleto}
            containerClassName="sm:col-span-2 lg:col-span-3"
          />
          <TextField
            label="CPF"
            required
            value={form.cpf}
            onChange={(e) => setField('cpf', e.target.value)}
            error={errors.cpf}
            placeholder="000.000.000-00"
          />
          <TextField
            label="RG"
            value={form.rg}
            onChange={(e) => setField('rg', e.target.value)}
          />
          <TextField
            label="Data de nascimento"
            type="date"
            required
            value={form.dataNascimento}
            onChange={(e) => setField('dataNascimento', e.target.value)}
            error={errors.dataNascimento}
          />
          <Select
            label="Sexo"
            required
            options={sexos}
            placeholder="Selecione"
            value={form.sexo}
            onChange={(e) => setField('sexo', e.target.value)}
            error={errors.sexo}
          />
          <Select
            label="Estado civil"
            options={estadoCivis}
            placeholder="Selecione"
            value={form.estadoCivil}
            onChange={(e) => setField('estadoCivil', e.target.value)}
          />
          <TextField
            label="Profissão"
            value={form.profissao}
            onChange={(e) => setField('profissao', e.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Contato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TextField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Telefone celular"
            value={form.telefoneCelular}
            onChange={(e) => setField('telefoneCelular', e.target.value)}
          />
          <TextField
            label="Telefone fixo"
            value={form.telefoneFixo}
            onChange={(e) => setField('telefoneFixo', e.target.value)}
          />
          <TextField
            label="Contato emergência (nome)"
            value={form.nomeContatoEmergencia}
            onChange={(e) => setField('nomeContatoEmergencia', e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <TextField
            label="Telefone emergência"
            value={form.telefoneEmergencia}
            onChange={(e) => setField('telefoneEmergencia', e.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Endereço</h3>
        <p className="text-xs text-slate-500 mb-3">
          Opcional. Se começar a preencher, os campos obrigatórios precisam estar completos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <TextField
            label="CEP"
            value={form.endereco.cep}
            onChange={(e) => setEndereco('cep', e.target.value)}
            error={errors['endereco.cep']}
            placeholder="00000-000"
            containerClassName="sm:col-span-2"
          />
          <TextField
            label="Logradouro"
            value={form.endereco.logradouro}
            onChange={(e) => setEndereco('logradouro', e.target.value)}
            error={errors['endereco.logradouro']}
            containerClassName="sm:col-span-4"
          />
          <TextField
            label="Número"
            value={form.endereco.numero}
            onChange={(e) => setEndereco('numero', e.target.value)}
            containerClassName="sm:col-span-1"
          />
          <TextField
            label="Complemento"
            value={form.endereco.complemento}
            onChange={(e) => setEndereco('complemento', e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <TextField
            label="Bairro"
            value={form.endereco.bairro}
            onChange={(e) => setEndereco('bairro', e.target.value)}
            error={errors['endereco.bairro']}
            containerClassName="sm:col-span-3"
          />
          <TextField
            label="Cidade"
            value={form.endereco.cidade}
            onChange={(e) => setEndereco('cidade', e.target.value)}
            error={errors['endereco.cidade']}
            containerClassName="sm:col-span-4"
          />
          <TextField
            label="UF"
            value={form.endereco.estado}
            onChange={(e) => setEndereco('estado', e.target.value.toUpperCase())}
            error={errors['endereco.estado']}
            maxLength={2}
            containerClassName="sm:col-span-2"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Dados administrativos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TextField
            label="Tipo sanguíneo"
            value={form.tipoSanguineo}
            onChange={(e) => setField('tipoSanguineo', e.target.value)}
            placeholder="Ex: O+"
          />
          <Select
            label="Tipo paciente"
            required
            options={tiposPaciente}
            placeholder="Selecione"
            value={form.tipoPaciente}
            onChange={(e) => setField('tipoPaciente', e.target.value)}
            error={errors.tipoPaciente}
          />
          <Select
            label="Tipo pagamento"
            options={tiposPagamento}
            placeholder="Selecione"
            value={form.tipoPagamento}
            onChange={(e) => setField('tipoPagamento', e.target.value)}
          />
          <Select
            label="Como conheceu"
            options={comoConheceuOpts}
            placeholder="Selecione"
            value={form.comoConheceu}
            onChange={(e) => setField('comoConheceu', e.target.value)}
          />
        </div>
      </section>

      <footer className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar paciente'}
        </Button>
      </footer>
    </form>
  );
};
