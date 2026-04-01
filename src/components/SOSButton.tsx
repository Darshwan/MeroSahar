import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, ActivityIndicator, Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Shadow } from '../constants/theme';
import { sosAPI } from '../api/client';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';

const EMERGENCY_TYPES = [
  { id: 'MEDICAL',   label: 'Medical',   labelNE: 'चिकित्सा',     icon: 'local-hospital', color: '#e53935' },
  { id: 'FIRE',      label: 'Fire',      labelNE: 'आगलागी',       icon: 'local-fire-department', color: '#ff7043' },
  { id: 'CRIME',     label: 'Crime',     labelNE: 'अपराध',        icon: 'local-police', color: '#1565c0' },
  { id: 'FLOOD',     label: 'Flood',     labelNE: 'बाढी',         icon: 'water', color: '#0288d1' },
  { id: 'LANDSLIDE', label: 'Landslide', labelNE: 'पहिरो',        icon: 'terrain', color: '#5d4037' },
  { id: 'TREKKING',  label: 'Trekking',  labelNE: 'ट्रेकिङ',     icon: 'hiking', color: '#2e7d32' },
  { id: 'GENERAL',   label: 'General',   labelNE: 'सामान्य',      icon: 'emergency', color: '#c62828' },
];

export default function SOSButton() {
  const { citizen, tourist, sessionType } = useStore();
  const { t, lang } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('GENERAL');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSOS = async () => {
    setSending(true);
    try {
      let lat = 0, lng = 0, locationDesc = '';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          // Reverse geocode
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) locationDesc = `${place.street || ''} ${place.city || 'Pokhara'}`.trim();
        }
      } catch {}

      const payload = {
        citizen_nid:      citizen?.nid,
        tourist_passport: tourist?.passport_no,
        session_type:     sessionType || 'GUEST',
        full_name:        citizen?.name || tourist?.name || 'Unknown',
        phone:            citizen?.phone || '',
        location_lat:     lat,
        location_lng:     lng,
        location_desc:    locationDesc,
        ward_code:        citizen?.ward_code || '',
        emergency_type:   selectedType,
        message:          `SOS from ${citizen?.name || tourist?.name || 'User'} via Mero Sahar app`,
      };

      const res = await sosAPI.sendSOS(payload);

      setSent(true);
      setShowModal(false);

      // Show result with helplines
      Alert.alert(
        lang === 'ne' ? '🚨 आपतकालीन सतर्कता पठाइयो!' : '🚨 Emergency Alert Sent!',
        [
          lang === 'ne'
            ? `SOS ID: ${res.sos_id}\n\nसहायता आउँदैछ। यी नम्बरमा पनि सम्पर्क गर्नुस्:`
            : `SOS ID: ${res.sos_id}\n\nHelp is on the way. Also call:`,
          `\n🚑 Ambulance: 102`,
          `🚒 Fire: 101`,
          `🚔 Police: 100`,
          `📞 Pokhara Emergency: 061-520100`,
        ].join('\n'),
        [{ text: 'OK', style: 'default' }]
      );
    } catch {
      // Even on error — show helplines
      Alert.alert(
        '🚨 Emergency Helplines',
        '🚑 Ambulance: 102\n🚒 Fire: 101\n🚔 Police: 100\n📞 Pokhara: 061-520100',
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
      setTimeout(() => setSent(false), 30000);
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.fab, sent && styles.fabSent]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons
            name={sent ? 'check' : 'sos'}
            size={20} color="#fff"
          />
          <Text style={styles.fabText}>
            {sent
              ? (lang === 'ne' ? 'पठाइयो' : 'Sent')
              : (lang === 'ne' ? 'SOS' : 'SOS')
            }
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Type Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderIcon}>
                <MaterialIcons name="emergency" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>
                  {lang === 'ne' ? 'आपतकालीन सहायता' : 'Emergency Help'}
                </Text>
                <Text style={styles.sheetSub}>
                  {lang === 'ne'
                    ? 'प्रकार छान्नुस् — GPS स्वत: थपिनेछ'
                    : 'Select type — GPS auto-attached'
                  }
                </Text>
              </View>
            </View>

            {/* Emergency type grid */}
            <View style={styles.typeGrid}>
              {EMERGENCY_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    { borderColor: type.color + '40' },
                    selectedType === type.id && { backgroundColor: type.color + '15', borderColor: type.color },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                    <MaterialIcons name={type.icon as any} size={20} color={type.color} />
                  </View>
                  <Text style={[styles.typeLabel, { color: selectedType === type.id ? type.color : Colors.primary }]}>
                    {lang === 'ne' ? type.labelNE : type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Send button */}
            <TouchableOpacity
              style={[styles.sendBtn, sending && { opacity: 0.7 }]}
              onPress={handleSOS}
              disabled={sending}
            >
              {sending ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.sendBtnText}>
                    {lang === 'ne' ? 'पठाउँदै...' : 'Sending alert...'}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="emergency" size={20} color="#fff" />
                  <Text style={styles.sendBtnText}>
                    {lang === 'ne' ? 'आपतकालीन सतर्कता पठाउनुस्' : 'Send Emergency Alert'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Helpline quick reference */}
            <View style={styles.helplines}>
              {[['🚑','102'],['🚒','101'],['🚔','100'],['📞','061-520100']].map(([emoji, num]) => (
                <View key={num} style={styles.helpline}>
                  <Text style={styles.helplineEmoji}>{emoji}</Text>
                  <Text style={styles.helplineNum}>{num}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>
                {lang === 'ne' ? 'रद्द गर्नुस्' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap:     { position: 'absolute', bottom: 90, right: 16, zIndex: 40 },
  fab:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.full, ...Shadow.lg },
  fabSent:     { backgroundColor: Colors.success },
  fabText:     { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:      { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  sheetHeaderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: Colors.primary },
  sheetSub:    { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  typeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeCard:    { width: '30%', padding: 12, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.outlineVariant, alignItems: 'center', gap: 6 },
  typeIcon:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  typeLabel:   { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sendBtn:     { backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: Radius.full, marginBottom: 16 },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  helplines:   { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xl, padding: 12, marginBottom: 14 },
  helpline:    { alignItems: 'center', gap: 4 },
  helplineEmoji: { fontSize: 18 },
  helplineNum: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  cancelBtn:   { alignItems: 'center', padding: 14 },
  cancelText:  { fontSize: 14, color: Colors.onSurfaceVariant, fontWeight: '600' },
});