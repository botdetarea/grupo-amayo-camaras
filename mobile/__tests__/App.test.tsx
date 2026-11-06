import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import {LoginScreen} from '../src/screens/LoginScreen';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'},
  STORAGE_TYPE: {AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth'},
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: () => null,
  useCameraPermission: () => ({hasPermission: false, requestPermission: jest.fn()}),
}));

test('shows server-backed login instead of invented session data', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <LoginScreen startupError="" onLogin={() => undefined} />,
    );
    await Promise.resolve();
  });

  const text = renderer!.root.findAllByType(Text).map(node => node.props.children);
  expect(text).toContain('Control de asistencia');
  expect(text).toContain(
    'La autenticacion se valida en el servidor. La sesion se guarda en el almacenamiento seguro del dispositivo.',
  );
});
