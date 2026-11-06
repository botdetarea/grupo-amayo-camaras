import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScreenHeader} from '../components/ScreenHeader';
import {
  checkApiHealth,
  getApiBaseUrl,
  Session,
  setApiBaseUrl,
} from '../services/api';
import {colors} from '../theme';

export function SettingsScreen({
  session,
  onLogOut,
}: {
  session: Session;
  onLogOut: () => void;
}) {
  const [apiUrl, setApiUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getApiBaseUrl()
      .then(setApiUrl)
      .catch(() => {
        setMessage('No se pudo leer la direccion de API guardada.');
        setIsError(true);
      });
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const saved = await setApiBaseUrl(apiUrl);
      setApiUrl(saved);
      const health = await checkApiHealth();
      if (health.status !== 'ok' || health.database !== 'connected') {
        throw new Error('La API no confirmo la conexion real con MySQL.');
      }
      setMessage('Conexion comprobada: la API alcanzo MySQL.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo comprobar la API.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Configuracion" subtitle="Conexion y cuenta" />
      <View style={styles.content}>
        <Text style={styles.label}>Direccion de la API</Text>
        <Text style={styles.help}>
          Emulador Android: http://10.0.2.2:3000/api. Para un celular, usa la IP local de la PC
          y permite el puerto 3000 en la red local.
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setApiUrl}
          placeholder="http://192.168.1.10:3000/api"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={apiUrl}
        />
        <PrimaryButton
          title="Guardar y comprobar MySQL"
          onPress={testConnection}
          loading={loading}
          disabled={!apiUrl.trim()}
        />
        {message ? (
          <Text accessibilityRole="alert" style={[styles.message, isError && styles.error]}>
            {message}
          </Text>
        ) : null}
        <View style={styles.accountCard}>
          <Text style={styles.cardTitle}>Cuenta</Text>
          <Text style={styles.help}>{session.user.nombre}</Text>
          <Text style={styles.help}>{session.user.correo}</Text>
          <Text style={styles.help}>Rol: {session.user.rol}</Text>
        </View>
        <PrimaryButton title="Cerrar sesion" onPress={onLogOut} />
        <Text style={styles.warning}>
          Usa HTTP solo en una red local de confianza durante desarrollo. Para publicar la app,
          configura HTTPS en el servidor.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {gap: 12, padding: 20},
  label: {fontSize: 14, fontWeight: '700', color: colors.ink},
  help: {fontSize: 13, lineHeight: 19, color: colors.muted},
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  message: {fontSize: 13, color: colors.green},
  error: {color: colors.red},
  accountCard: {gap: 5, marginVertical: 8, padding: 16, borderRadius: 14, backgroundColor: colors.white},
  cardTitle: {marginBottom: 2, fontSize: 15, fontWeight: '700', color: colors.ink},
  warning: {fontSize: 11, lineHeight: 16, color: colors.muted},
});
