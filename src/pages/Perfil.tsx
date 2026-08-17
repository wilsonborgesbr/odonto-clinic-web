import { useMemo, useRef, useState } from 'react';
import { Trash2, Mail, User as UserIcon, Shield, Building2, LogOut, Pencil, Check, X } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/Modal';
import { bokkaToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { photoKeys, removePhoto } from '../lib/profilePhotos';
import type { RoleEnum } from '../types';

const roleLabel: Record<RoleEnum, string> = {
  PROPRIETARIO: 'Proprietário(a) — controle total',
  SOCIO: 'Sócio(a) — controle total',
  ADMINISTRADOR: 'Administrador(a)',
  DENTISTA: 'Dentista',
  RECEPCIONISTA: 'Recepcionista',
  FINANCEIRO: 'Financeiro',
  ESTOQUISTA: 'Responsável pelo estoque',
  AUXILIAR_CLINICO: 'Auxiliar clínico (ASB/TSB)',
};

export const Perfil = () => {
  const { user, logout, updateName, updateEmail } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const photoKey = useMemo(() => photoKeys.user(user?.email), [user?.email]);

  const handleRemovePhoto = () => {
    if (!photoKey) return;
    removePhoto(photoKey);
    setConfirmRemove(false);
    bokkaToast.success('Foto removida.');
  };

  const startEditingName = () => {
    setNameValue(user?.name || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNameValue('');
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      bokkaToast.error('O nome não pode ficar vazio.');
      return;
    }
    if (trimmed === user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateName(trimmed);
      bokkaToast.success('Nome atualizado.');
      setEditingName(false);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao atualizar o nome.',
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') cancelEditingName();
  };

  const startEditingEmail = () => {
    setEmailValue(user?.email || '');
    setEditingEmail(true);
    setTimeout(() => emailInputRef.current?.focus(), 50);
  };

  const cancelEditingEmail = () => {
    setEditingEmail(false);
    setEmailValue('');
  };

  const saveEmail = async () => {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      bokkaToast.error('O e-mail não pode ficar vazio.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      bokkaToast.error('E-mail inválido.');
      return;
    }
    if (trimmed.toLowerCase() === user?.email?.toLowerCase()) {
      setEditingEmail(false);
      return;
    }
    setSavingEmail(true);
    try {
      await updateEmail(trimmed);
      bokkaToast.success('E-mail atualizado.');
      setEditingEmail(false);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao atualizar o e-mail.',
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEmail();
    if (e.key === 'Escape') cancelEditingEmail();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Meu perfil</h1>
        <p className="text-sm text-bokka-ink-3 mt-1">
          Como proprietária do consultório, você pode trocar sua foto e a de qualquer dentista ou funcionário na ficha dele.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Sua foto"
          subtitle="Aparece na sidebar, no topo e em toda ação sua no sistema."
        />
        <div className="flex flex-wrap items-center gap-6">
          <Avatar
            photoKey={photoKey}
            name={user?.name || user?.email}
            size="2xl"
            editable
            ring
          />
          <div className="flex-1 min-w-[240px] space-y-2">
            <p className="text-sm text-bokka-ink-2 leading-relaxed">
              Clique na foto (ou no ícone de câmera) pra enviar uma nova imagem.
              A foto é reduzida pra 512px e otimizada automaticamente antes de salvar.
            </p>
            <p className="text-xs text-bokka-ink-3">
              Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo depois de comprimida: 400 KB.
            </p>
            <div className="pt-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 />}
                onClick={() => setConfirmRemove(true)}
                disabled={!photoKey}
              >
                Remover foto atual
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Dados da conta" />
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
                Nome
              </p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    disabled={savingName}
                    className="text-sm font-semibold text-bokka-ink bg-bokka-surface border border-bokka-border-strong rounded-md px-3 h-9 flex-1 min-w-0 outline-none focus:border-bokka-primary-ring"
                    placeholder="Seu nome completo"
                  />
                  <button
                    type="button"
                    onClick={saveName}
                    disabled={savingName}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-success-ink hover:bg-bokka-success-soft transition-colors"
                    title="Salvar"
                  >
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditingName}
                    disabled={savingName}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-surface-3 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-semibold text-bokka-ink break-words">
                    {user?.name || '—'}
                  </p>
                  <button
                    type="button"
                    onClick={startEditingName}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                    title="Editar nome"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
                E-mail
              </p>
              {editingEmail ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    disabled={savingEmail}
                    className="text-sm font-semibold text-bokka-ink bg-bokka-surface border border-bokka-border-strong rounded-md px-3 h-9 flex-1 min-w-0 outline-none focus:border-bokka-primary-ring"
                    placeholder="seu@email.com"
                  />
                  <button
                    type="button"
                    onClick={saveEmail}
                    disabled={savingEmail}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-success-ink hover:bg-bokka-success-soft transition-colors"
                    title="Salvar"
                  >
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditingEmail}
                    disabled={savingEmail}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-surface-3 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-semibold text-bokka-ink break-words">
                    {user?.email || '—'}
                  </p>
                  <button
                    type="button"
                    onClick={startEditingEmail}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                    title="Editar e-mail"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
              {editingEmail && (
                <p className="text-[11px] text-bokka-warning-ink mt-1.5">
                  Você continuará logada com este e-mail — o token será renovado.
                </p>
              )}
            </div>
          </li>
          <InfoRow
            icon={<Shield className="w-4 h-4" strokeWidth={1.75} />}
            label="Cargo"
            value={roleLabel[user?.role ?? 'DENTISTA']}
          />
          {user?.clinicaCodigo && (
            <InfoRow
              icon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
              label="Clínica"
              value={user.clinicaCodigo}
            />
          )}
        </ul>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          icon={<LogOut />}
          onClick={() => setConfirmLogout(true)}
        >
          Sair da conta
        </Button>
      </div>

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemovePhoto}
        title="Remover foto?"
        message="Sua foto voltará a exibir as iniciais do seu nome."
        confirmLabel="Remover"
        danger
      />

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Sair da conta?"
        message="Você precisará entrar novamente pra continuar."
        confirmLabel="Sair"
        danger
      />
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <li className="flex items-start gap-3">
    <span className="w-9 h-9 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-bokka-ink mt-0.5 break-words">{value}</p>
    </div>
  </li>
);
