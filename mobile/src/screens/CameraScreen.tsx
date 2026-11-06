import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScreenHeader} from '../components/ScreenHeader';
import {Session} from '../services/api';
import {colors} from '../theme';

export function CameraScreen({session}: {session: Session}) {
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [active, setActive] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  const start = async () => {
    setPermissionError('');
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setPermissionError('Permiso de camara denegado. Habilitalo en Ajustes de Android.');
          return;
        }
      }
      setActive(true);
    } catch (error) {
      setPermissionError(
        error instanceof Error
          ? `No se pudo iniciar la camara: ${error.message}`
          : 'No se pudo iniciar la camara.',
      );
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Camara del celular" subtitle="Vista previa local" />
      <View style={styles.body}>
        <View style={styles.status}>
          <View style={[styles.dot, active ? styles.green : styles.yellow]} />
          <Text style={styles.statusText}>{active ? 'Camara activa' : 'Camara detenida'}</Text>
        </View>

        <View style={styles.preview}>
          {active && device ? (
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={active} />
          ) : active ? (
            <Text style={styles.previewMessage}>No se encontro una camara trasera disponible.</Text>
          ) : (
            <Text style={styles.previewMessage}>
              La vista previa se iniciara unicamente cuando presiones el boton.
            </Text>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Esta etapa muestra la camara fisica. La deteccion de personas, el conteo y el envio de
          eventos todavia no estan implementados; no se registran asistencias ni se capturan
          imagenes.
        </Text>

        {permissionError ? (
          <Text accessibilityRole="alert" style={styles.error}>{permissionError}</Text>
        ) : null}

        {active ? (
          <PrimaryButton title="Detener camara" onPress={() => setActive(false)} />
        ) : (
          <PrimaryButton title="Permitir e iniciar vista previa" onPress={start} />
        )}
        <Text style={styles.account}>Sesion: {session.user.correo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1, gap: 14, padding: 18},
  status: {flexDirection: 'row', alignItems: 'center', gap: 9},
  dot: {width: 10, height: 10, borderRadius: 5},
  green: {backgroundColor: colors.green},
  yellow: {backgroundColor: colors.yellow},
  statusText: {fontSize: 14, fontWeight: '700', color: colors.ink},
  preview: {
    flex: 1,
    minHeight: 210,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#222522',
  },
  previewMessage: {maxWidth: 240, textAlign: 'center', color: colors.white, lineHeight: 21},
  disclaimer: {fontSize: 12, lineHeight: 18, color: colors.muted},
  error: {fontSize: 13, color: colors.red},
  account: {textAlign: 'center', fontSize: 11, color: colors.muted},
});
