import {
  checkApiHealth,
  getApiBaseUrl,
  getSession,
  logIn,
  setApiBaseUrl,
} from '../src/services/api';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'},
  STORAGE_TYPE: {AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth'},
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import * as Keychain from 'react-native-keychain';

const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, 'fetch', {value: mockFetch, writable: true});
  mockFetch.mockReset();
  mockKeychain.getGenericPassword.mockResolvedValue(false);
  mockKeychain.setGenericPassword.mockResolvedValue({
    service: 'grupo-amayo.session-token',
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });
  mockKeychain.resetGenericPassword.mockResolvedValue(true);
});

describe('mobile API client', () => {
  it('uses the Android emulator host by default', async () => {
    await expect(getApiBaseUrl()).resolves.toBe('http://10.164.219.117:3000/api');
  });

  it('saves a LAN API URL with exactly one /api suffix', async () => {
    await expect(setApiBaseUrl('http://192.168.1.20:3000')).resolves.toBe(
      'http://192.168.1.20:3000/api',
    );
    expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
      'grupo-amayo',
      'http://192.168.1.20:3000/api',
      expect.objectContaining({
        service: 'grupo-amayo.api-base-url',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('rejects credentials embedded in an API URL', async () => {
    await expect(setApiBaseUrl('http://user:password@192.168.1.20:3000')).rejects.toThrow(
      'no debe incluir credenciales',
    );
  });

  it('logs in against the API and stores the returned token securely', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'server-issued-token',
        user: {id: 1, nombre: 'Kevin', apellido: null, correo: 'kevin@senati.pe', rol: 'superadmin'},
      }),
    });

    await expect(logIn(' kevin@senati.pe ', 'password-not-logged')).resolves.toMatchObject({
      token: 'server-issued-token',
      user: {correo: 'kevin@senati.pe', rol: 'superadmin'},
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.164.219.117:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({correo: 'kevin@senati.pe', password: 'password-not-logged'}),
      }),
    );
    expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
      'grupo-amayo',
      'server-issued-token',
      expect.objectContaining({
        service: 'grupo-amayo.session-token',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('checks the API health result instead of returning a simulated status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({status: 'ok', database: 'connected'}),
    });

    await expect(checkApiHealth()).resolves.toEqual({status: 'ok', database: 'connected'});
    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.164.219.117:3000/api/health',
      expect.objectContaining({method: 'GET'}),
    );
  });

  it('does not store a session when the server rejects login credentials', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {code: 'invalid_credentials', message: 'Email or password is incorrect.'},
      }),
    });

    await expect(logIn('kevin@senati.pe', 'wrong-password')).rejects.toThrow(
      'Email or password is incorrect.',
    );
    expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('clears a saved session if the backend rejects its expired token', async () => {
    mockKeychain.getGenericPassword.mockImplementation(async options =>
      options?.service === 'grupo-amayo.session-token'
        ? {
            username: 'grupo-amayo',
            password: 'expired-token',
            service: 'grupo-amayo.session-token',
            storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
          }
        : false,
    );
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({error: {code: 'unauthorized', message: 'Authentication is required.'}}),
    });

    await expect(getSession()).resolves.toBeNull();
    expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'grupo-amayo.session-token',
    });
  });
});
