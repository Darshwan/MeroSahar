import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, Radius } from '../constants/theme';

export default function LangToggle() {
  const { language, setLanguage } = useStore();
  const isNepali = language === 'ne';

  return (
    <TouchableOpacity
      style={styles.toggle}
      onPress={() => setLanguage(isNepali ? 'en' : 'ne')}
      activeOpacity={0.8}
    >
      <View style={[styles.thumb, !isNepali && styles.thumbRight]} />
      <Text style={[styles.label, styles.labelLeft, isNepali && styles.labelActive]}>
        ने
      </Text>
      <Text style={[styles.label, styles.labelRight, !isNepali && styles.labelActive]}>
        EN
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 64, height: 28,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    left: 2, top: 2,
    width: 28, height: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  thumbRight: { left: 34 },
  label: {
    position: 'absolute',
    fontSize: 11, fontWeight: '700',
    color: Colors.outline,
  },
  labelLeft:  { left: 8 },
  labelRight: { right: 8 },
  labelActive: { color: '#fff' },
});
