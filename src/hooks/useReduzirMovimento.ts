import { useEffect, useState } from 'react';

/** true quando o usuário pede menos movimento (prefers-reduced-motion): desliga animações de gráfico. */
export const useReduzirMovimento = (): boolean => {
  const [reduzir, setReduzir] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = () => setReduzir(mq.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);
  return reduzir;
};
