import { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { getPhoto, setPhoto, subscribeToPhotos, processImageFile } from '../../lib/profilePhotos';
import { cn, initials } from '../../lib/utils';
import { bokkaToast } from './Toast';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeClasses: Record<Size, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const cameraSize: Record<Size, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

const cameraBoxSize: Record<Size, string> = {
  xs: 'w-4 h-4 -right-0.5 -bottom-0.5',
  sm: 'w-5 h-5 -right-0.5 -bottom-0.5',
  md: 'w-6 h-6 -right-0.5 -bottom-0.5',
  lg: 'w-6 h-6 right-0 bottom-0',
  xl: 'w-7 h-7 right-0 bottom-0',
  '2xl': 'w-9 h-9 right-0 bottom-0',
};

const toneVariants = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
];

const hashTone = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return toneVariants[Math.abs(h) % toneVariants.length];
};

export const usePhoto = (key: string | null | undefined): string | null => {
  const [photo, setPhotoState] = useState<string | null>(() => getPhoto(key));

  useEffect(() => {
    setPhotoState(getPhoto(key));
    const unsub = subscribeToPhotos(() => {
      setPhotoState(getPhoto(key));
    });
    return unsub;
  }, [key]);

  return photo;
};

interface AvatarProps {
  photoKey?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
  editable?: boolean;
  ring?: boolean;
  previewSrc?: string | null;
  /** Foto vinda do backend (campo fotoUrl da entidade). Tem prioridade sobre o localStorage. */
  remoteSrc?: string | null;
  onFileSelect?: (file: File) => void;
}

export const Avatar = ({
  photoKey,
  name,
  size = 'md',
  className,
  editable,
  ring,
  previewSrc,
  remoteSrc,
  onFileSelect,
}: AvatarProps) => {
  const photo = usePhoto(photoKey);
  const [uploading, setUploading] = useState(false);

  const tone = hashTone(name || photoKey || 'x');

  const displaySrc = previewSrc ?? remoteSrc ?? photo;

  const handleUpload = async (file: File) => {
    if (onFileSelect) {
      onFileSelect(file);
      return;
    }
    if (!photoKey) return;
    setUploading(true);
    try {
      const uri = await processImageFile(file);
      setPhoto(photoKey, uri);
      bokkaToast.success('Foto atualizada.');
    } catch (err) {
      bokkaToast.error(err instanceof Error ? err.message : 'Erro ao processar imagem');
    } finally {
      setUploading(false);
    }
  };

  const inner = (
    <>
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover shrink-0',
            sizeClasses[size],
            ring && 'ring-2 ring-bokka-surface',
            className,
          )}
        />
      ) : (
        <span
          className={cn(
            'rounded-full flex items-center justify-center font-bold shrink-0',
            sizeClasses[size],
            tone,
            ring && 'ring-2 ring-bokka-surface',
            className,
          )}
        >
          {initials(name)}
        </span>
      )}
      {editable && photoKey && (
        <span
          className={cn(
            'absolute rounded-full bg-bokka-primary text-white flex items-center justify-center border-2 border-bokka-surface',
            cameraBoxSize[size],
          )}
        >
          {uploading ? (
            <Loader2 className={cn(cameraSize[size], 'animate-spin')} />
          ) : (
            <Camera className={cameraSize[size]} strokeWidth={2} />
          )}
        </span>
      )}
    </>
  );

  if (editable && photoKey) {
    return (
      <label className={cn('relative inline-block cursor-pointer group')}>
        {inner}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = '';
          }}
        />
      </label>
    );
  }

  return <span className="relative inline-block">{inner}</span>;
};
