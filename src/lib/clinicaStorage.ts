/** Código da clínica do último acesso (localStorage) — pré-preenche login e recuperação de senha. */
export const LAST_CLINICA_KEY = 'bokka:lastClinicaCodigo';

export const lerClinicaSalva = (): string => {
  try {
    return localStorage.getItem(LAST_CLINICA_KEY) ?? '';
  } catch {
    return '';
  }
};

export const salvarClinica = (codigo?: string | null) => {
  const limpo = codigo?.trim().toLowerCase();
  if (!limpo) return;
  try {
    localStorage.setItem(LAST_CLINICA_KEY, limpo);
  } catch {
    /* sem localStorage: só não lembra da clínica */
  }
};
