import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors} from '../theme';

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, (disabled || loading) && styles.disabled]}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.ink,
  },
  disabled: {opacity: 0.55},
  label: {fontSize: 15, fontWeight: '700', color: colors.white},
});
