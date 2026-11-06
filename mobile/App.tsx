import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {clearSession, getSession, Session} from './src/services/api';
import {CameraScreen} from './src/screens/CameraScreen';
import {DashboardScreen} from './src/screens/DashboardScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {colors} from './src/theme';

type ScreenName = 'inicio' | 'camara' | 'configuracion';

function AppContent() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('inicio');
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    let active = true;
    getSession()
      .then(savedSession => {
        if (active) {
          setSession(savedSession);
        }
      })
      .catch(() => {
        if (active) {
          setStartupError('No se pudo validar la sesion. Comprueba el backend y la conexion.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const logOut = () => {
    clearSession().then(
      () => {
        setSession(null);
        setActiveScreen('inicio');
      },
      () => {
        setStartupError('No se pudo borrar la sesion del almacenamiento seguro.');
      },
    );
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} size="large" />
          <Text style={styles.loadingText}>Iniciando aplicacion...</Text>
        </View>
      ) : session ? (
        <>
          {activeScreen === 'inicio' ? (
            <DashboardScreen session={session} onLogOut={logOut} />
          ) : activeScreen === 'camara' ? (
            <CameraScreen session={session} />
          ) : (
            <SettingsScreen session={session} onLogOut={logOut} />
          )}
          <View style={[styles.navigation, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <NavigationButton
              label="Inicio"
              active={activeScreen === 'inicio'}
              onPress={() => setActiveScreen('inicio')}
            />
            {session.user.rol !== 'trabajador' && (
              <NavigationButton
                label="Camara"
                active={activeScreen === 'camara'}
                onPress={() => setActiveScreen('camara')}
              />
            )}
            <NavigationButton
              label="Ajustes"
              active={activeScreen === 'configuracion'}
              onPress={() => setActiveScreen('configuracion')}
            />
          </View>
        </>
      ) : (
        <LoginScreen
          startupError={startupError}
          onLogin={signedInSession => {
            setStartupError('');
            setSession(signedInSession);
            setActiveScreen('inicio');
          }}
        />
      )}
    </View>
  );
}

function NavigationButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.navigationButton, active && styles.navigationButtonActive]}>
      <Text style={[styles.navigationLabel, active && styles.navigationLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: 12, color: colors.muted},
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  navigationButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 12,
  },
  navigationButtonActive: {backgroundColor: colors.yellowLight},
  navigationLabel: {color: colors.muted, fontWeight: '600'},
  navigationLabelActive: {color: colors.ink},
});

export default App;
