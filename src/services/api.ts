const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('@OdontoClinic:token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 5. Tratar token expirado ou inválido (401 e 403)
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('@OdontoClinic:token');
      // Redireciona para o login globalmente
      window.location.href = '/login';
    }

    const errorText = await response.text();
    throw new Error(errorText || `Erro HTTP: ${response.status}`);
  }

  // Retorna vazio para 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
