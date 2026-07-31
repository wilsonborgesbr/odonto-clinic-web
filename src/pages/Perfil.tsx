import { useMemo } from 'react';
import { Trash2, Mail, User as UserIcon, Shield, LogOut } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/Modal';
import { bokkaToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { photoKeys, removePhoto } from '../lib/profilePhotos';
import { useState } from 'react';

export const Perfil = () => {
  const { user, logout } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const photoKey = useMemo(() => photoKeys.user(user?.email), [user?.email]);

  const handleRemovePhoto = () => {
    if (!photoKey) return;
    removePhoto(photoKey);
    setConfirmRemove(false);
    bokkaToast.success('Foto removida.');
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
          <InfoRow
            icon={<UserIcon className="w-4 h-4" strokeWidth={1.75} />}
            label="Nome"
            value={user?.name || '—'}
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
            label="E-mail"
            value={user?.email || '—'}
          />
          <InfoRow
            icon={<Shield className="w-4 h-4" strokeWidth={1.75} />}
            label="Papel"
            value="Proprietária do consultório"
          />
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
