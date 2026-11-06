import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme';

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.mark} />
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    backgroundColor: colors.yellow,
  },
  mark: {width: 8, height: 34, borderRadius: 4, backgroundColor: colors.ink},
  title: {fontSize: 20, fontWeight: '800', color: colors.ink},
  subtitle: {fontSize: 12, color: colors.ink, opacity: 0.75, marginTop: 2},
});
