import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { authAPI } from '../api/client';

const CITIZEN_ID_TYPES = [
  { id: 'NID' as const, label: 'NID Card', labelNE: '????????? ????? ????', placeholder: '12345678901', hint: 'Enter your 11-digit NID number', icon: 'badge' },
  { id: 'CITIZENSHIP' as const, label: 'Nagarikta', labelNE: '???????? ??????????', placeholder: '01-02-03-04567', hint: 'Enter your citizenship number', icon: 'credit-card' },
  { id: 'DRIVING_LICENSE' as const, label: 'Driving License', labelNE: '????? ???? ??????????', placeholder: '12-34-56789', hint: 'Enter your license number', icon: 'directions-car' },
];

export default function LoginScreen({ navigation, route }: any) {
  const mode = route?.params?.mode || 'citizen';
  const isTourist = mode === 'tourist';

  const [selectedIDType, setSelectedIDType] = useState(0);
  const [idValue, setIdValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');

  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');

  const [loading, setLoading] = useState(false);
  const [showOCR, setShowOCR] = useState(false);

  const { loginAsCitizen, loginAsTourist } = useStore();
  const currentIDType = CITIZEN_ID_TYPES[selectedIDType];

  const handleCitizenLogin = async () => {
    const val = idValue.trim();
    if (!val || val.length < 5) {
      Toast.show({ type: 'error', text1: 'Invalid ID', text2: 'Please enter a valid ID number' });
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.loginCitizenV2({
        id_type: currentIDType.id,
        primary_value: val,
        secondary_value: secondaryValue.trim(),
        device_info: Platform.OS,
      });

      if (res?.success && res?.citizen) {
        const token = String(res.session_id || res.token || `citizen-${Date.now()}`);
        await loginAsCitizen(res.citizen, token);
        Toast.show({ type: 'success', text1: `Namaste, ${res.citizen.name || 'Citizen'}!` });
      } else {
        Toast.show({ type: 'error', text1: 'Login Failed', text2: res?.message || 'Please check your ID and try again' });
      }
    } catch {
      Toast.show({ type: 'info', text1: 'Demo Mode', text2: 'Logging in with demo data' });
      await loginAsCitizen({
        nid: val,
        name: 'Demo Citizen',
        name_ne: '???? ??????',
        citizenship_no: secondaryValue || '',
        ward_code: 'NPL-04-33-09',
        ward_number: 9,
        district: 'Kaski',
        province: 'Gandaki',
        phone: '',
        gender: '',
      }, `demo-token-${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTouristLogin = async () => {
    const pNo = passportNo.trim().toUpperCase();
    if (!pNo || pNo.length < 6) {
      Toast.show({ type: 'error', text1: 'Invalid Passport', text2: 'Enter your passport number' });
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.loginTourist({
        passport_no: pNo,
        full_name: fullName.trim(),
        nationality: nationality.trim(),
        device_info: Platform.OS,
      });

      if (res?.success) {
        const tourist = res.tourist || { passport_no: pNo, name: fullName || 'Visitor', nationality: nationality || 'Unknown' };
        const token = String(res.session_id || res.token || `tourist-${Date.now()}`);
        await loginAsTourist(tourist, token);
        Toast.show({ type: 'success', text1: `Welcome to Pokhara, ${tourist.name || pNo}!` });
      } else {
        await loginAsTourist({ passport_no: pNo, name: fullName || 'Visitor', nationality: nationality || 'Unknown' }, `tourist-demo-${Date.now()}`);
      }
    } catch {
      await loginAsTourist({ passport_no: pNo, name: fullName || 'Visitor', nationality: nationality || 'Unknown' }, `tourist-demo-${Date.now()}`);
      Toast.show({ type: 'info', text1: 'Demo Mode Active' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroPanel}>
            <LinearGradient
              colors={isTourist ? ['#1a5276', '#2e86c1'] : [Colors.primaryContainer, Colors.primary]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.glowTR} />
            <View style={{ position: 'relative', zIndex: 1 }}>
              <View style={styles.secureBadge}>
                <MaterialIcons name={isTourist ? 'flight' : 'security'} size={12} color="rgba(203,230,255,0.9)" />
                <Text style={styles.secureBadgeText}>{isTourist ? 'Passport Verification' : 'Secure Identity Verification'}</Text>
              </View>
              <Text style={styles.heroTitle}>{isTourist ? 'Tourist\nLogin' : 'Citizen\nLogin'}</Text>
              <Text style={styles.heroDesc}>
                {isTourist ? 'Verify with your passport. Access permits, TIMS, and tourism services.' : 'Verify your identity to access all Pokhara Metro digital services.'}
              </Text>
            </View>
          </View>

          {!isTourist && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Choose ID Type</Text>
              <Text style={styles.formSubtitle}>Select how you want to verify your identity</Text>

              <View style={styles.idTypeRow}>
                {CITIZEN_ID_TYPES.map((t, i) => (
                  <TouchableOpacity key={t.id} style={[styles.idTypeBtn, selectedIDType === i && styles.idTypeBtnActive]} onPress={() => { setSelectedIDType(i); setIdValue(''); }}>
                    <MaterialIcons name={t.icon as any} size={18} color={selectedIDType === i ? '#fff' : Colors.primary} />
                    <Text style={[styles.idTypeBtnText, selectedIDType === i && { color: '#fff' }]}>{t.label}</Text>
                    <Text style={[styles.idTypeBtnNE, selectedIDType === i && { color: 'rgba(255,255,255,0.7)' }]}>{t.labelNE}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>{currentIDType.label} Number</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.input}
                  placeholder={currentIDType.placeholder}
                  placeholderTextColor={Colors.outline}
                  value={idValue}
                  onChangeText={setIdValue}
                  keyboardType="default"
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleCitizenLogin}
                />
                <TouchableOpacity style={styles.scanBtn} onPress={() => setShowOCR(true)}>
                  <MaterialIcons name="camera-enhance" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHint}>{currentIDType.hint}</Text>

              <View style={styles.ocrBanner}>
                <MaterialIcons name="auto-awesome" size={14} color={Colors.primary} />
                <Text style={styles.ocrBannerText}>
                  Tap the camera icon to scan your {currentIDType.label}. PRATIBIMBA OCR will auto-fill your details.
                </Text>
              </View>

              <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleCitizenLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><MaterialIcons name="login" size={18} color="#fff" /><Text style={styles.loginBtnText}>Login to Portal</Text></>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot ID? Contact your Ward Office</Text>
              </TouchableOpacity>
            </View>
          )}

          {isTourist && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Passport Verification</Text>
              <Text style={styles.formSubtitle}>Enter your passport details or scan it</Text>

              <TouchableOpacity style={styles.passportScanBtn} onPress={() => setShowOCR(true)}>
                <MaterialIcons name="document-scanner" size={28} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.passportScanTitle}>Scan Passport</Text>
                  <Text style={styles.passportScanSub}>Auto-fill all details with PRATIBIMBA OCR</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or enter manually</Text>
                <View style={styles.orLine} />
              </View>

              <Text style={styles.fieldLabel}>Passport Number</Text>
              <TextInput style={styles.input} placeholder="A12345678" placeholderTextColor={Colors.outline} value={passportNo} onChangeText={setPassportNo} autoCapitalize="characters" />

              <Text style={styles.fieldLabel}>Full Name (as in passport)</Text>
              <TextInput style={styles.input} placeholder="JOHN SMITH" placeholderTextColor={Colors.outline} value={fullName} onChangeText={setFullName} autoCapitalize="characters" />

              <Text style={styles.fieldLabel}>Nationality</Text>
              <TextInput style={styles.input} placeholder="American" placeholderTextColor={Colors.outline} value={nationality} onChangeText={setNationality} />

              <View style={styles.servicePreview}>
                <Text style={styles.servicePreviewTitle}>Available Services After Login:</Text>
                {[
                  'TIMS Permit',
                  'Annapurna Conservation Area Permit',
                  'Manaslu Circuit Permit',
                  'Upper Mustang Restricted Area Permit',
                  'Guide & Porter Requests',
                  'Emergency Evacuation Registration',
                ].map((s) => (
                  <View key={s} style={styles.serviceItem}>
                    <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                    <Text style={styles.serviceItemText}>{s}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.loginBtn, { backgroundColor: '#2e86c1' }, loading && { opacity: 0.7 }]} onPress={handleTouristLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><MaterialIcons name="flight" size={18} color="#fff" /><Text style={styles.loginBtnText}>Enter Pokhara Portal</Text></>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.secondaryGrid}>
            <TouchableOpacity style={styles.secondaryCard}>
              <View style={styles.secIcon}>
                <MaterialIcons name="person-add" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.secTitle}>New Citizen</Text>
              <Text style={styles.secSub}>Register at ward</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCard}>
              <View style={[styles.secIcon, { backgroundColor: 'rgba(175,47,35,0.05)' }]}>
                <MaterialIcons name="support-agent" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.secTitle}>Help Desk</Text>
              <Text style={styles.secSub}>Technical support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showOCR} animationType="slide" onRequestClose={() => setShowOCR(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.ocrModalHeader}>
            <TouchableOpacity onPress={() => setShowOCR(false)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.ocrModalTitle}>Scan {isTourist ? 'Passport' : CITIZEN_ID_TYPES[selectedIDType].label}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <MaterialIcons name="camera-enhance" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>OCR Scanner</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              Place your {isTourist ? 'passport' : CITIZEN_ID_TYPES[selectedIDType].label} within the frame.
              {'\n'}PRATIBIMBA engine will extract your details automatically.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 32, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999 }}
              onPress={() => {
                if (isTourist) {
                  setPassportNo('A12345678');
                  setFullName('JOHN SMITH');
                  setNationality('American');
                } else {
                  setIdValue('12345678901');
                  setSecondaryValue('01-02-03-04567');
                }
                setShowOCR(false);
                Toast.show({ type: 'success', text1: 'OCR Complete', text2: 'Details extracted from document' });
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Simulate OCR Scan (Demo)</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 18, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  heroPanel: { borderRadius: Radius.xxl, padding: 24, overflow: 'hidden', minHeight: 180, marginBottom: 16, ...Shadow.lg },
  glowTR: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,59,90,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  secureBadgeText: { color: 'rgba(203,230,255,0.9)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  heroTitle: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 42, marginBottom: 8 },
  heroDesc: { fontSize: 13, color: 'rgba(148,197,238,0.85)', lineHeight: 20 },
  formCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xxl, padding: 22, marginBottom: 14, ...Shadow.sm },
  formTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  formSubtitle: { fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 18 },
  idTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  idTypeBtn: { flex: 1, padding: 12, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerLowest, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.outlineVariant },
  idTypeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  idTypeBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  idTypeBtnNE: { fontSize: 9, color: Colors.onSurfaceVariant, textAlign: 'center' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: Colors.onSurface, ...Shadow.sm },
  scanBtn: { width: 50, height: 50, backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  fieldHint: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 6 },
  ocrBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryFixed, padding: 12, borderRadius: Radius.lg, marginTop: 14, marginBottom: 4 },
  ocrBannerText: { fontSize: 12, color: Colors.onPrimaryFixedVariant, lineHeight: 18, flex: 1 },
  loginBtn: { backgroundColor: Colors.primaryContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: Radius.full, marginTop: 18, ...Shadow.md },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  forgotRow: { alignItems: 'center', marginTop: 14 },
  forgotText: { fontSize: 12, color: Colors.onSurfaceVariant },
  passportScanBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primaryFixed, borderRadius: Radius.xl, padding: 16, marginBottom: 18 },
  passportScanTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  passportScanSub: { fontSize: 12, color: Colors.onPrimaryFixedVariant, marginTop: 2 },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.outlineVariant },
  orText: { fontSize: 11, color: Colors.outline },
  servicePreview: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: 14, marginTop: 14, marginBottom: 4 },
  servicePreviewTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  serviceItemText: { fontSize: 12, color: Colors.onSurface },
  secondaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  secondaryCard: { flex: 1, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xxl, padding: 18, ...Shadow.sm },
  secIcon: { width: 38, height: 38, borderRadius: Radius.lg, backgroundColor: 'rgba(0,59,90,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  secTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  secSub: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  ocrModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#000' },
  ocrModalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
