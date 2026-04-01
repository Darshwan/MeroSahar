import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Shadow } from '../constants/theme';
import { authAPI, healthCheck, API_BASE } from '../api/client';
import { useStore } from '../store/useStore';

export default function ContinueAsScreen({ navigation }: any) {
  const { loginAsGuest } = useStore();
  const [checkingServer, setCheckingServer] = React.useState(false);

  // Check server before navigating
  const goToCitizenLogin = async () => {
    setCheckingServer(true);
    const ok = await healthCheck();
    setCheckingServer(false);
    if (!ok) {
      Alert.alert(
        'Server Unreachable',
        `Cannot connect to ${API_BASE}\n\n` +
        'Check:\n' +
        '1. Go server is running (go run main.go)\n' +
        '2. Phone and laptop on same WiFi\n' +
        '3. Correct IP in .env file\n\n' +
        'You can still continue in demo mode.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Demo Mode', onPress: () => navigation.navigate('Login', { mode: 'citizen' }) },
        ]
      );
      return;
    }
    navigation.navigate('Login', { mode: 'citizen' });
  };

  const goToTouristLogin = () => {
    navigation.navigate('Login', { mode: 'tourist' });
  };

  const continueAsGuest = async () => {
    try {
      const res = await authAPI.startGuest();
      if (res.success) {
        await loginAsGuest(res.session_id);
      } else {
        // Demo guest session
        await loginAsGuest('guest-demo-session');
      }
    } catch {
      await loginAsGuest('guest-demo-session');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Branding */}
      <View style={styles.branding}>
        <View style={styles.logoBox}>
          <MaterialIcons name="location-city" size={26} color="#fff" />
        </View>
        <Text style={styles.logoText}>Hamro Pokhara</Text>
      </View>

      {/* Heading */}
      <View style={styles.heading}>
        <Text style={styles.title}>How would you{'\n'}like to proceed?</Text>
        <Text style={styles.subtitle}>
          Select an option to begin your digital journey with Pokhara Metropolitan City.
        </Text>
      </View>

      {/* CITIZEN CARD */}
      <TouchableOpacity
        style={styles.citizenCard}
        onPress={goToCitizenLogin}
        activeOpacity={0.88}
        disabled={checkingServer}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={10} color="#fff" />
          <Text style={styles.verifiedText}>Verified Access</Text>
        </View>
        <View style={styles.citizenIcon}>
          {checkingServer
            ? <ActivityIndicator color="#fff" />
            : <MaterialIcons name="person" size={36} color="#fff" />
          }
        </View>
        <Text style={styles.citizenTitle}>Continue as{'\n'}a Citizen</Text>
        <Text style={styles.citizenDesc}>
          Verify with NID, Nagarikta (Citizenship), or Driving License.
          Access full municipal services — Sifaris, tax, grievances, and more.
        </Text>
        {/* ID type pills */}
        <View style={styles.idPills}>
          {['NID', 'Nagarikta', 'License'].map(t => (
            <View key={t} style={styles.idPill}>
              <Text style={styles.idPillText}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Sign in to your account</Text>
          <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableOpacity>

      {/* TOURIST CARD */}
      <TouchableOpacity
        style={styles.touristCard}
        onPress={goToTouristLogin}
        activeOpacity={0.88}
      >
        <View style={styles.touristTop}>
          <View style={styles.touristIcon}>
            <MaterialIcons name="flight" size={24} color={Colors.primary} />
          </View>
          <View style={styles.touristBadge}>
            <Text style={styles.touristBadgeText}>Passport OCR</Text>
          </View>
        </View>
        <Text style={styles.touristTitle}>Tourist / Visitor</Text>
        <Text style={styles.touristDesc}>
          Verify with your passport. Apply for trekking permits, TIMS, national park fees, and tourism services.
        </Text>
        <View style={styles.permitPills}>
          {['TIMS', 'Annapurna', 'Manaslu', 'Mustang'].map(p => (
            <View key={p} style={styles.permitPill}>
              <Text style={styles.permitPillText}>{p}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.cardFooter, { marginTop: 12 }]}>
          <Text style={[styles.cardFooterText, { color: Colors.onSurfaceVariant }]}>
            Scan your passport
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color={Colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>

      {/* GUEST */}
      <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
        <MaterialIcons name="person-search" size={18} color={Colors.onSurfaceVariant} />
        <Text style={styles.guestText}>Browse as Guest (public info only)</Text>
        <MaterialIcons name="chevron-right" size={18} color={Colors.outline} />
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to Pokhara Metro's{' '}
        <Text style={{ color: Colors.primary }}>Terms</Text>
        {' & '}
        <Text style={{ color: Colors.primary }}>Privacy Policy</Text>.
      </Text>
    </SafeAreaView>
  );
}

const S = Shadow;
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 18, paddingTop: 12 },
  branding:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoBox:          { width: 40, height: 40, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText:         { fontSize: 18, fontWeight: '800', color: Colors.primary },
  heading:          { marginBottom: 18 },
  title:            { fontSize: 28, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5, lineHeight: 34 },
  subtitle:         { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 6, lineHeight: 20 },
  citizenCard:      { borderRadius: Radius.xxl, padding: 24, overflow: 'hidden', marginBottom: 12, ...S.lg },
  verifiedBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-end', position: 'absolute', top: 18, right: 18 },
  verifiedText:     { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  citizenIcon:      { width: 52, height: 52, borderRadius: Radius.xl, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  citizenTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  citizenDesc:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 12 },
  idPills:          { flexDirection: 'row', gap: 8, marginBottom: 14 },
  idPill:           { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  idPillText:       { color: '#fff', fontSize: 11, fontWeight: '600' },
  touristCard:      { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: 20, marginBottom: 10, ...S.sm },
  touristTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  touristIcon:      { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  touristBadge:     { backgroundColor: Colors.primaryFixed, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  touristBadgeText: { color: Colors.onPrimaryFixedVariant, fontSize: 10, fontWeight: '700' },
  touristTitle:     { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  touristDesc:      { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18, marginBottom: 10 },
  permitPills:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  permitPill:       { backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  permitPillText:   { color: Colors.primary, fontSize: 10, fontWeight: '600' },
  cardFooter:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardFooterText:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  guestBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xl, padding: 14, marginBottom: 12 },
  guestText:        { flex: 1, fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500' },
  terms:            { fontSize: 11, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 16 },
});