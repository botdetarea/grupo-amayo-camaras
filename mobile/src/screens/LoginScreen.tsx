import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {PrimaryButton} from '../components/PrimaryButton';
import {getApiBaseUrl, logIn, Session, setApiBaseUrl} from '../services/api';
import {colors} from '../theme';

export function LoginScreen({
  startupError,
  onLogin,
}: {
  startupError: string;
  onLogin: (session: Session) => void;
}) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [error, setError] = useState(startupError);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    getApiBaseUrl()
      .then(setApiUrl)
      .catch(() => {
        setError('No se pudo leer la direccion del backend guardada.');
      });
  }, []);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await setApiBaseUrl(apiUrl);
      onLogin(await logIn(correo, password));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark} />
        <Text style={styles.eyebrow}>GRUPO AMAYO · PUCALLPA</Text>
        <Text style={styles.title}>Control de asistencia</Text>
        <Text style={styles.subtitle}>Inicia sesion con tu cuenta autorizada.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Direccion del backend</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:3000/api"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={apiUrl}
          />
          <Text style={styles.label}>Correo</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setCorreo}
            placeholder="nombre@empresa.pe"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="emailAddress"
            value={correo}
          />
          <Text style={styles.label}>Contrasena</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="current-password"
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="Tu contrasena"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            textContentType="password"
            value={password}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            title="Iniciar sesion"
            loading={loading}
            onPress={submit}
            disabled={!apiUrl.trim() || !correo.trim() || !password}
          />
          <Text style={styles.privacy}>
            La autenticacion se valida en el servidor. La sesion se guarda en el almacenamiento
            seguro del dispositivo.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {flexGrow: 1, justifyContent: 'center', padding: 26},
  brandMark: {width: 48, height: 8, borderRadius: 4, backgroundColor: colors.yellow},
  eyebrow: {marginTop: 22, fontSize: 12, letterSpacing: 1.3, fontWeight: '800', color: colors.muted},
  title: {marginTop: 9, fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink},
  subtitle: {marginTop: 7, fontSize: 15, color: colors.muted},
  form: {
    gap: 10,
    marginTop: 34,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 18,
  },
  label: {fontSize: 13, fontWeight: '700', color: colors.ink},
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  error: {marginVertical: 4, color: colors.red, fontSize: 13},
  privacy: {marginTop: 5, fontSize: 12, lineHeight: 17, color: colors.muted},
});
