const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getClientToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('jhefdammys.token');
}

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getClientToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('jhefdammys.token');
      window.localStorage.removeItem('jhefdammys.user');

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const message = await response.text();
    throw new Error(message || 'Erro ao comunicar com a API.');
  }

  return response.json() as Promise<T>;
}
