/**
 * Sistema de fotos de perfil por chave (email do usuário logado ou id da entidade).
 * Armazenamento em localStorage como base64 data URI (limite ~2MB por foto).
 * Backend não tem endpoint de upload — quando tiver, migrar pra POST /api/uploads.
 */

const STORAGE_KEY = 'bokka:photos:v1';
const MAX_DIMENSION = 512; // reamostra pra 512px lado maior
const MAX_BYTES = 400 * 1024; // ~400kb depois de comprimir
const EVENT_NAME = 'bokka-photos-changed';

type PhotoStore = Record<string, string>;

const readStore = (): PhotoStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store: PhotoStore) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (err) {
    console.error('Falha ao salvar foto (localStorage cheio?)', err);
    throw new Error('Não foi possível salvar. Foto muito grande.');
  }
};

export const photoKeys = {
  user: (email?: string | null) => (email ? `user:${email.toLowerCase()}` : null),
  paciente: (id?: string | null) => (id ? `paciente:${id}` : null),
  dentista: (id?: string | null) => (id ? `dentista:${id}` : null),
  funcionario: (id?: string | null) => (id ? `funcionario:${id}` : null),
};

export const getPhoto = (key: string | null | undefined): string | null => {
  if (!key) return null;
  return readStore()[key] ?? null;
};

export const setPhoto = (key: string, dataUri: string) => {
  const store = readStore();
  store[key] = dataUri;
  writeStore(store);
};

export const removePhoto = (key: string) => {
  const store = readStore();
  delete store[key];
  writeStore(store);
};

export const subscribeToPhotos = (fn: () => void): (() => void) => {
  const handler = () => fn();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
};

/**
 * Reamostra e comprime uma imagem File pra caber em ~400kb.
 * Retorna data URI base64.
 */
export const processImageFile = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie um arquivo de imagem (JPG, PNG ou WEBP).');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao processar imagem.');
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    // Tenta qualidades decrescentes até caber
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const dataUri = canvas.toDataURL('image/jpeg', q);
      const bytes = Math.round(dataUri.length * 0.75); // approx base64 → bytes
      if (bytes <= MAX_BYTES) return dataUri;
    }
    return canvas.toDataURL('image/jpeg', 0.4);
  } finally {
    bitmap.close?.();
  }
};
