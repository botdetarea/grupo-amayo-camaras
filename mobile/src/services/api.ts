import * as Keychain from 'react-native-keychain';

const DEFAULT_API_BASE_URL = 'http://10.164.219.117:3000/api';
const SESSION_KEY = 'grupo-amayo.session-token';
const API_URL_KEY = 'grupo-amayo.api-base-url';

export type UserRole = 'superadmin' | 'administrador' | 'trabajador';

export type User = {
  id: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  rol: UserRole;
};

export type Session = {
  token: string;
  user: User;
};

export type AdminSummary = {
  total_empleados: number;
  empleados_activos: number;
  asistencias_hoy: number;
  total_dispositivos: number;
  dispositivos_activos: number;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function normalizeBaseUrl(value: string) {
  const parsed = new URL(value.trim());
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('La direccion de la API debe usar HTTP o HTTPS.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('La direccion de la API no debe incluir credenciales, consulta ni fragmento.');
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  const apiPath = !path || path === '/'
    ? '/api'
    : path.endsWith('/api')
      ? path
      : `${path}/api`;
  return `${parsed.origin}${apiPath}`;
}

export async function getApiBaseUrl() {
  const saved = await Keychain.getGenericPassword({service: API_URL_KEY});
  return saved ? normalizeBaseUrl(saved.password) : DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(value: string) {
  const normalized = normalizeBaseUrl(value);
  const saved = await Keychain.setGenericPassword('grupo-amayo', normalized, {
    service: API_URL_KEY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) {
    throw new Error('No se pudo guardar la direccion de la API en el almacenamiento seguro.');
  }
  return normalized;
}

async function request<T>(
  path: string,
  options: {method?: 'GET' | 'POST'; token?: string; body?: unknown} = {},
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? {'Content-Type': 'application/json'} : {}),
        ...(options.token ? {Authorization: `Bearer ${options.token}`} : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = result?.error;
      throw new ApiError(
        response.status,
        typeof error?.code === 'string' ? error.code : 'request_failed',
        typeof error?.message === 'string'
          ? error.message
          : `La API respondio con el estado ${response.status}.`,
      );
    }
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La API no respondio en 12 segundos. Comprueba la conexion y su direccion.');
    }
    throw new Error('No se pudo conectar con la API. Comprueba la red, la direccion y el firewall.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function logIn(correo: string, password: string): Promise<Session> {
  const result = await request<Session>('/auth/login', {
    method: 'POST',
    body: {correo: correo.trim(), password},
  });
  if (!result.token || !result.user?.correo || !result.user?.rol) {
    throw new Error('La API devolvio una respuesta de inicio de sesion incompleta.');
  }
  const saved = await Keychain.setGenericPassword('grupo-amayo', result.token, {
    service: SESSION_KEY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) {
    throw new Error('No se pudo guardar la sesion en el almacenamiento seguro.');
  }
  return {token: result.token, user: result.user};
}

export async function getSession(): Promise<Session | null> {
  const credentials = await Keychain.getGenericPassword({service: SESSION_KEY});
  if (!credentials) {
    return null;
  }
  const token = credentials.password;
  try {
    const result = await request<{user: User}>('/auth/me', {token});
    return {token, user: result.user};
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
      return null;
    }
    throw error;
  }
}

export async function clearSession() {
  await Keychain.resetGenericPassword({service: SESSION_KEY});
}

export function getAdminSummary(token: string) {
  return request<{resumen: AdminSummary}>('/admin/summary', {token});
}

export function checkApiHealth() {
  return request<{status: string; database: string}>('/health');
}
