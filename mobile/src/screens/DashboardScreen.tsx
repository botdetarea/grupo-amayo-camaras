import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScreenHeader} from '../components/ScreenHeader';
import {ApiError, getAdminSummary, Session, AdminSummary} from '../services/api';
import {colors} from '../theme';

export function DashboardScreen({
  session,
  onLogOut,
}: {
  session: Session;
  onLogOut: () => void;
}) {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(session.user.rol !== 'trabajador');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (session.user.rol === 'trabajador') {
      return;
    }
    setError('');
    try {
      const response = await getAdminSummary(session.token);
      setSummary(response.resumen);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await onLogOut();
        return;
      }
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogOut, session.token, session.user.rol]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Grupo Amayo" subtitle="Panel de supervision" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              refresh();
            }}
            tintColor={colors.ink}
          />
        }>
        <Text style={styles.greeting}>Hola, {session.user.nombre}</Text>
        <Text style={styles.role}>{roleLabel(session.user.rol)}</Text>

        {session.user.rol === 'trabajador' ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Cuenta de trabajador</Text>
            <Text style={styles.muted}>
              El backend aun no ofrece una ruta de historial personal. No se muestran datos de
              asistencia simulados.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.muted}>Consultando MySQL...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar el panel</Text>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton title="Reintentar" onPress={refresh} />
          </View>
        ) : summary ? (
          <>
            <View style={styles.health}>
              <View style={styles.dot} />
              <Text style={styles.healthText}>Datos recibidos desde el backend</Text>
            </View>
            <View style={styles.grid}>
              <Metric label="Trabajadores" value={summary.total_empleados} />
              <Metric label="Activos" value={summary.empleados_activos} />
              <Metric label="Asistencias hoy" value={summary.asistencias_hoy} />
              <Metric label="Dispositivos activos" value={summary.dispositivos_activos} />
            </View>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Sesion segura</Text>
              <Text style={styles.muted}>{session.user.correo}</Text>
              <Text style={styles.muted}>Rol: {roleLabel(session.user.rol)}</Text>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onLogOut}
          style={styles.logOut}>
          <Text style={styles.logOutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Metric({label, value}: {label: string; value: number}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function roleLabel(role: Session['user']['rol']) {
  if (role === 'superadmin') {
    return 'Superadministrador';
  }
  if (role === 'administrador') {
    return 'Administrador';
  }
  return 'Trabajador';
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {padding: 20, paddingBottom: 28},
  greeting: {marginTop: 10, fontSize: 24, fontWeight: '800', color: colors.ink},
  role: {marginTop: 4, marginBottom: 20, fontSize: 14, color: colors.muted},
  health: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
  },
  dot: {width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green},
  healthText: {fontSize: 13, fontWeight: '600', color: colors.green},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  metric: {
    width: '47%',
    minHeight: 104,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    backgroundColor: colors.white,
  },
  metricValue: {fontSize: 26, fontWeight: '800', color: colors.ink},
  metricLabel: {marginTop: 5, fontSize: 12, color: colors.muted},
  notice: {gap: 5, marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: colors.white},
  noticeTitle: {fontSize: 15, fontWeight: '700', color: colors.ink},
  muted: {fontSize: 13, lineHeight: 19, color: colors.muted},
  loading: {minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 10},
  errorCard: {gap: 11, padding: 16, borderRadius: 14, backgroundColor: colors.redLight},
  errorTitle: {fontSize: 15, fontWeight: '700', color: colors.red},
  errorText: {fontSize: 13, lineHeight: 19, color: colors.ink},
  logOut: {alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 22},
  logOutText: {fontWeight: '700', color: colors.red},
});
