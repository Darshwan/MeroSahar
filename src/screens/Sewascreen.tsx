// src/screens/SewaScreen.tsx — COMPLETE REPLACEMENT
// Modern, minimal bento grid layout

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, RefreshControl,
  ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { citizenAPI, newsAPI } from '../api/client';
import { useTranslation } from '../utils/i18n';
import SOSButton from '../components/SOSButton';
import HamburgerMenu from '../components/Hamburger';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_HALF = (width - 36 - CARD_GAP) / 2;

const GRIEVANCE_CATS = [
  { id: 'POTHOLE', labelNE: 'खाल्डो', icon: 'warning', color: '#e65100' },
  { id: 'STREETLIGHT', labelNE: 'बत्ती', icon: 'lightbulb', color: '#f9a825' },
  { id: 'WATER_LEAK', labelNE: 'पानी चुहावट', icon: 'water-drop', color: '#0288d1' },
  { id: 'GARBAGE', labelNE: 'फोहोर', icon: 'delete', color: '#558b2f' },
  { id: 'SEWAGE', labelNE: 'ढल', icon: 'plumbing', color: '#6a1b9a' },
  { id: 'OTHER', labelNE: 'अन्य', icon: 'more-horiz', color: Colors.primary },
];

export default function SewaScreen({ navigation }: any) {
  const { citizen, myRequests } = useStore();
  const { t, lang } = useTranslation();

  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [ledgerDocs, setLedgerDocs] = useState<any[]>([]);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Modals
  const [showGrievance, setShowGrievance] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [grievCat, setGrievCat] = useState('POTHOLE');
  const [grievDesc, setGrievDesc] = useState('');
  const [grievLoc, setGrievLoc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [queueService, setQueueService] = useState('SIFARIS');
  const [bookingQ, setBookingQ] = useState(false);

  const nid = citizen?.nid || '';
  const wardCode = citizen?.ward_code || 'NPL-04-33-09';

  const load = useCallback(async () => {
    if (!nid) { setLoading(false); return; }
    const [taxRes, newsRes, docRes] = await Promise.allSettled([
      citizenAPI.getTaxRecords(nid),
      newsAPI.getWardNews(wardCode, 5),
      citizenAPI.getDocuments(nid),
    ]);
    if (taxRes.status === 'fulfilled' && taxRes.value.success) setTaxRecords(taxRes.value.records || []);
    else setTaxRecords([{ id: 1, tax_year: 2082, total_amount: 8500, paid_amount: 0, status: 'UNPAID' }]);
    if (newsRes.status === 'fulfilled' && newsRes.value.success) setNews(newsRes.value.news || []);
    if (docRes.status === 'fulfilled' && docRes.value.success) setLedgerDocs(docRes.value.documents || []);
    setLoading(false);
  }, [nid, wardCode]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const outstanding = taxRecords.filter(r => r.status !== 'PAID')
    .reduce((s, r) => s + (r.total_amount - r.paid_amount), 0);

  const pending = myRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;
  const approved = myRequests.filter(r => r.status === 'APPROVED').length;

  const submitGrievance = async () => {
    if (!grievDesc.trim()) { Toast.show({ type: 'error', text1: 'Description required' }); return; }
    setSubmitting(true);
    try {
      let lat = 0, lng = 0;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const l = await Location.getCurrentPositionAsync({});
        lat = l.coords.latitude; lng = l.coords.longitude;
      }
      const res = await citizenAPI.submitGrievance({
        citizen_nid: nid, citizen_name: citizen?.name || '',
        ward_code: wardCode, category: grievCat,
        description: grievDesc, location_lat: lat, location_lng: lng,
        location_desc: grievLoc,
      });
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Report submitted!', text2: `ID: ${res.grievance_id}` });
        setShowGrievance(false); setGrievDesc(''); setGrievLoc('');
      }
    } catch {
      Toast.show({ type: 'success', text1: 'Report submitted (demo)' });
      setShowGrievance(false);
    } finally { setSubmitting(false); }
  };

  const bookQueue = async () => {
    setBookingQ(true);
    try {
      const res = await citizenAPI.bookQueue({ citizen_nid: nid, ward_code: wardCode, service_type: queueService });
      if (res.success) {
        setActiveToken(res);
        Toast.show({ type: 'success', text1: `Token #${res.token_number} booked!`, text2: res.message });
        setShowQueue(false);
      }
    } catch {
      setActiveToken({ token_number: Math.floor(Math.random() * 20) + 1, estimated_time: new Date(Date.now() + 45 * 60000).toISOString() });
      setShowQueue(false);
    } finally { setBookingQ(false); }
  };

  const PRIORITY_COLORS = ['#003b5a', '#e65100', '#c62828', '#7b1fa2'];
  const CATEGORY_ICONS: Record<string, string> = { WATER: 'water-drop', ROAD: 'construction', HEALTH: 'local-hospital', URGENT: 'campaign', GENERAL: 'info', ELECTRICITY: 'bolt', INFRASTRUCTURE: 'construction' };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            style={s.moreBtn}
            onPress={() => setMenuOpen(true)}
          >
            <MaterialIcons name="menu" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerSup}>Digital Governance</Text>
            <Text style={s.headerTitle}>
              {lang === 'ne' ? 'पोखरा सेवा केन्द्र' : 'Pokhara Sewa Kendra'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.wardChip}>
            <MaterialIcons name="location-on" size={11} color={Colors.onPrimaryFixedVariant} />
            <Text style={s.wardChipText}>वडा {citizen?.ward_code?.split('-')[3] || '9'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── ROW 1: PRATIBIMBA AI + LIVE STATUS ─────────────── */}
        <View style={s.row}>
          {/* AI-OCR Sifaris — large */}
          <TouchableOpacity style={[s.card, { flex: 1.6, minHeight: 180 }]} onPress={() => navigation.navigate('Request')} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.primaryContainer, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={s.aiOCRBadge}>
              <MaterialIcons name="auto-awesome" size={11} color="#fff" />
              <Text style={s.aiOCRBadgeText}>PRATIBIMBA AI</Text>
            </View>
            <Text style={s.bigCardTitle}>
              {lang === 'ne' ? 'AI-OCR सिफारिस' : 'AI-OCR Sifaris'}
            </Text>
            <Text style={s.bigCardDesc}>
              {lang === 'ne' ? 'कागज स्क्यान गर्नुस् → स्वत: भरिन्छ' : 'Scan → auto-fill → submit'}
            </Text>
            <View style={s.bigCardBtn}>
              <MaterialIcons name="photo-camera" size={14} color={Colors.primary} />
              <Text style={s.bigCardBtnText}>
                {lang === 'ne' ? 'क्यामेरा खोल्नुस्' : 'Open Camera'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Live Status */}
          <View style={[s.card, { flex: 1, backgroundColor: Colors.surfaceContainerLowest }]}>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>{lang === 'ne' ? 'जीवन्त स्थिति' : 'Live Status'}</Text>
              <MaterialIcons name="pending-actions" size={18} color={Colors.secondary} />
            </View>
            {myRequests.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="inbox" size={28} color={Colors.outline} style={{ opacity: 0.3 }} />
                <Text style={s.emptyText}>{lang === 'ne' ? 'अनुरोध छैन' : 'No requests'}</Text>
              </View>
            ) : (
              <>
                <View style={s.miniStat}><Text style={s.miniStatNum}>{pending}</Text><Text style={s.miniStatLbl}>{lang === 'ne' ? 'विचाराधीन' : 'Pending'}</Text></View>
                <View style={s.miniStat}><Text style={[s.miniStatNum, { color: Colors.success }]}>{approved}</Text><Text style={s.miniStatLbl}>{lang === 'ne' ? 'स्वीकृत' : 'Approved'}</Text></View>
                <TouchableOpacity style={s.smallLink} onPress={() => navigation.navigate('Track')}>
                  <Text style={s.smallLinkText}>{lang === 'ne' ? 'सबै ट्र्याक' : 'Track all'}</Text>
                  <MaterialIcons name="arrow-forward" size={12} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── ROW 2: TAX + MIRROR VAULT ──────────────────────── */}
        <View style={s.row}>
          {/* Tax Portal */}
          <TouchableOpacity style={[s.card, { flex: 1, overflow: 'hidden' }]} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.secondary, '#8b1a10']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={s.bigCardTitle}>{lang === 'ne' ? 'कर पोर्टल' : 'Tax Portal'}</Text>
            {outstanding > 0
              ? <Text style={s.taxDesc}>NPR {outstanding.toLocaleString()} {lang === 'ne' ? 'बाँकी' : 'outstanding'}</Text>
              : <Text style={s.taxDesc}>{lang === 'ne' ? 'सबै तिरिएको ✓' : 'All paid ✓'}</Text>
            }
            {outstanding > 0 && (
              <View style={s.taxBtn}>
                <Text style={s.taxBtnText}>{lang === 'ne' ? 'अहिले तिर्नुस्' : 'Pay Now'}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mirror Vault */}
          <TouchableOpacity style={[s.card, { flex: 1, backgroundColor: Colors.surfaceContainerLow }]} onPress={() => navigation.navigate('Verify')} activeOpacity={0.88}>
            <Text style={s.cardTitle}>{lang === 'ne' ? 'मिरर भल्ट' : 'Mirror Vault'}</Text>
            <Text style={s.cardDesc}>{lang === 'ne' ? 'QR कागज लकर' : 'QR document locker'}</Text>
            <View style={s.qrIconBox}>
              <MaterialIcons name="qr-code-2" size={40} color={Colors.primary} />
            </View>
            {ledgerDocs.length > 0 && (
              <View style={s.docCountChip}>
                <Text style={s.docCountText}>{ledgerDocs.length} docs</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── ROW 3: 3-COLUMN UTILITIES ──────────────────────── */}
        <View style={s.row}>
          {/* Water & NEA */}
          <View style={[s.smallCard, { flex: 1 }]}>
            <View style={[s.utilIcon, { backgroundColor: '#dbeafe' }]}>
              <MaterialIcons name="water-drop" size={18} color="#1d4ed8" />
            </View>
            <Text style={s.smallCardTitle}>{lang === 'ne' ? 'पानी/बिजुली' : 'Water/NEA'}</Text>
            <TouchableOpacity style={s.utilBtn}>
              <Text style={s.utilBtnText}>{lang === 'ne' ? 'बिल हेर्नुस्' : 'Bills'}</Text>
            </TouchableOpacity>
          </View>

          {/* Queue Token */}
          <View style={[s.smallCard, { flex: 1 }]}>
            <View style={[s.utilIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialIcons name="confirmation-number" size={18} color="#92400e" />
            </View>
            <Text style={s.smallCardTitle}>{lang === 'ne' ? 'कतार टोकन' : 'Queue Token'}</Text>
            {activeToken
              ? <Text style={s.tokenNum}>#{activeToken.token_number}</Text>
              : null
            }
            <TouchableOpacity
              style={[s.utilBtn, { backgroundColor: Colors.primary }]}
              onPress={() => setShowQueue(true)}
            >
              <Text style={[s.utilBtnText, { color: '#fff' }]}>
                {activeToken ? (lang === 'ne' ? 'अपडेट' : 'Update') : (lang === 'ne' ? 'बुक' : 'Book')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Krishi */}
          <View style={[s.smallCard, { flex: 1 }]}>
            <View style={[s.utilIcon, { backgroundColor: '#dcfce7' }]}>
              <MaterialIcons name="grass" size={18} color="#15803d" />
            </View>
            <Text style={s.smallCardTitle}>{lang === 'ne' ? 'कृषि अनुदान' : 'Krishi'}</Text>
            <TouchableOpacity style={s.utilBtn}>
              <Text style={s.utilBtnText}>{lang === 'ne' ? 'आवेदन' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── NEWS FROM WARD ─────────────────────────────────── */}
        {news.length > 0 && (
          <View style={s.newsSection}>
            <View style={s.newsSectionHeader}>
              <Text style={s.sectionTitle}>
                {lang === 'ne' ? 'वडाको खबर' : 'Ward News'}
              </Text>
              <View style={s.liveChip}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>
            {news.map(item => (
              <View key={item.news_id} style={[s.newsCard, item.priority >= 2 && s.newsCardUrgent]}>
                <View style={[s.newsCatIcon, { backgroundColor: PRIORITY_COLORS[Math.min(item.priority, 3)] + '15' }]}>
                  <MaterialIcons name={(CATEGORY_ICONS[item.category] || 'info') as any} size={20} color={PRIORITY_COLORS[Math.min(item.priority, 3)]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.newsTitle} numberOfLines={2}>
                    {lang === 'ne' && item.title_ne ? item.title_ne : item.title}
                  </Text>
                  <Text style={s.newsBody} numberOfLines={2}>
                    {lang === 'ne' && item.body_ne ? item.body_ne : item.body}
                  </Text>
                  <Text style={s.newsTime}>
                    {new Date(item.published_at).toLocaleDateString()}
                  </Text>
                </View>
                {item.priority >= 2 && (
                  <View style={s.urgentBadge}>
                    <Text style={s.urgentBadgeText}>{lang === 'ne' ? 'जरुरी' : 'URGENT'}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── REPORT A PROBLEM ───────────────────────────────── */}
        <TouchableOpacity style={s.grievanceHero} onPress={() => setShowGrievance(true)} activeOpacity={0.88}>
          <LinearGradient colors={[Colors.primaryContainer, '#0c3550']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={{ zIndex: 1 }}>
            <View style={s.grievanceTopRow}>
              <Text style={s.grievanceTagline}>{lang === 'ne' ? 'तुरुन्त कारबाही' : 'Immediate Action'}</Text>
              <Text style={s.grievance311}>311</Text>
            </View>
            <Text style={s.grievanceTitle}>{lang === 'ne' ? 'समस्या रिपोर्ट' : 'Report a Problem'}</Text>
            <Text style={s.grievanceDesc}>
              {lang === 'ne'
                ? 'खाल्डो, बत्ती, पानी चुहावट — GPS सहित तुरुन्त रिपोर्ट गर्नुस्'
                : 'Potholes, streetlights, leaks — report instantly with GPS'
              }
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── BHATTA ─────────────────────────────────────────── */}
        <View style={s.bhattaCard}>
          <View style={s.bhattaIcon}>
            <MaterialIcons name="family-restroom" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bhattaTitle}>{lang === 'ne' ? 'सामाजिक सुरक्षा' : 'Social Security'}</Text>
            <Text style={s.bhattaDesc}>
              {lang === 'ne'
                ? 'बृद्धभत्ता, एकल महिला, अपांगता भत्ता ट्र्याक गर्नुस्'
                : 'Track Briddha Bhatta, Single Mother, disability allowances'
              }
            </Text>
          </View>
          <TouchableOpacity style={s.bhattaBtn}>
            <Text style={s.bhattaBtnText}>{lang === 'ne' ? 'ट्र्याक' : 'Track'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* SOS Floating Button */}
      <SOSButton />

      <HamburgerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={navigation}
      />

      {/* ── GRIEVANCE MODAL ────────────────────────────────── */}
      <Modal visible={showGrievance} animationType="slide" transparent onRequestClose={() => setShowGrievance(false)}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{lang === 'ne' ? 'समस्या रिपोर्ट गर्नुस्' : 'Report a Problem'}</Text>
            <Text style={s.modalLabel}>{lang === 'ne' ? 'समस्याको प्रकार' : 'Category'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {GRIEVANCE_CATS.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, grievCat === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setGrievCat(cat.id)}
                >
                  <MaterialIcons name={cat.icon as any} size={13} color={grievCat === cat.id ? '#fff' : cat.color} />
                  <Text style={[s.catChipText, { color: grievCat === cat.id ? '#fff' : cat.color }]}>{cat.labelNE}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.modalLabel}>{lang === 'ne' ? 'विवरण' : 'Description'}</Text>
            <TextInput style={s.modalTA} placeholder={lang === 'ne' ? 'समस्याको विवरण...' : 'Describe the problem...'} placeholderTextColor={Colors.outline} value={grievDesc} onChangeText={setGrievDesc} multiline numberOfLines={3} />
            <Text style={s.modalLabel}>{lang === 'ne' ? 'ठेगाना' : 'Location'}</Text>
            <TextInput style={s.modalInput} placeholder={lang === 'ne' ? 'जस्तै: वडा ९ कार्यालय नजिकै' : 'e.g., Near Ward 9 office'} placeholderTextColor={Colors.outline} value={grievLoc} onChangeText={setGrievLoc} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowGrievance(false)}>
                <Text style={s.modalCancelText}>{lang === 'ne' ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSubmit, submitting && { opacity: 0.7 }]} onPress={submitGrievance} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSubmitText}>{lang === 'ne' ? 'पेश गर्नुस्' : 'Submit'}</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── QUEUE MODAL ──────────────────────────────────────── */}
      <Modal visible={showQueue} animationType="slide" transparent onRequestClose={() => setShowQueue(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{lang === 'ne' ? 'कतार टोकन बुक' : 'Book Queue Token'}</Text>
            {['SIFARIS', 'TAX_CLEARANCE', 'BIRTH_CERTIFICATE', 'GENERAL_INQUIRY'].map(sv => (
              <TouchableOpacity key={sv} style={[s.serviceOpt, queueService === sv && s.serviceOptActive]} onPress={() => setQueueService(sv)}>
                <Text style={[s.serviceOptText, queueService === sv && { color: '#fff' }]}>{sv.replace(/_/g, ' ')}</Text>
                {queueService === sv && <MaterialIcons name="check" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowQueue(false)}><Text style={s.modalCancelText}>{lang === 'ne' ? 'रद्द' : 'Cancel'}</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalSubmit, bookingQ && { opacity: 0.7 }]} onPress={bookQueue} disabled={bookingQ}>
                {bookingQ ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSubmitText}>{lang === 'ne' ? 'बुक गर्नुस्' : 'Book Token'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8eceb' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerSup: { fontSize: 10, fontWeight: '700', color: Colors.primary, opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.4 },
  moreBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant },
  wardChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryFixed, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  wardChipText: { fontSize: 11, fontWeight: '700', color: Colors.onPrimaryFixedVariant },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 100, gap: CARD_GAP },
  row: { flexDirection: 'row', gap: CARD_GAP },
  card: { borderRadius: 20, padding: 18, overflow: 'hidden', ...Shadow.sm },
  smallCard: { backgroundColor: Colors.surfaceContainerHighest, borderRadius: 18, padding: 14, alignItems: 'center', gap: 6 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  cardDesc: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 3 },
  aiOCRBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  aiOCRBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  bigCardTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 6 },
  bigCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 14 },
  bigCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  bigCardBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  miniStat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  miniStatNum: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  miniStatLbl: { fontSize: 11, color: Colors.onSurfaceVariant },
  smallLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  smallLinkText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  taxDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  taxBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  taxBtnText: { color: Colors.secondary, fontSize: 12, fontWeight: '700' },
  qrIconBox: { backgroundColor: '#fff', padding: 12, borderRadius: 16, alignSelf: 'flex-start', marginTop: 8, ...Shadow.sm },
  docCountChip: { position: 'absolute', top: 12, right: 12, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  docCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  utilIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  smallCardTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  tokenNum: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  utilBtn: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.outlineVariant, marginTop: 2 },
  utilBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  newsSection: { gap: 10 },
  newsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#15803d', letterSpacing: 1 },
  newsCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e8eceb', ...Shadow.sm },
  newsCardUrgent: { borderColor: 'rgba(198,40,40,0.25)', backgroundColor: '#fffaf9' },
  newsCatIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  newsTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  newsBody: { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17 },
  newsTime: { fontSize: 10, color: Colors.outline, marginTop: 5 },
  urgentBadge: { backgroundColor: '#c62828', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  urgentBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  emptyText: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 4 },
  grievanceHero: { borderRadius: 24, padding: 24, overflow: 'hidden', minHeight: 180, ...Shadow.md },
  grievanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  grievanceTagline: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  grievance311: { fontSize: 36, fontWeight: '900', color: 'rgba(255,255,255,0.12)' },
  grievanceTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  grievanceDesc: { fontSize: 13, color: 'rgba(148,197,238,0.85)', lineHeight: 20 },
  bhattaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(26,82,118,0.07)', borderRadius: 20, padding: 18, borderWidth: 2, borderColor: 'rgba(0,59,90,0.10)', borderStyle: 'dashed' },
  bhattaIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  bhattaTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  bhattaDesc: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16, flex: 1 },
  bhattaBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  bhattaBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  modalLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  modalTA: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 14, fontSize: 14, color: Colors.onSurface, minHeight: 80, textAlignVertical: 'top' },
  modalInput: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: Colors.onSurface },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, marginRight: 8, borderWidth: 1.5, borderColor: Colors.outlineVariant },
  catChipText: { fontSize: 12, fontWeight: '600' },
  serviceOpt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: Colors.surfaceContainerLow, marginBottom: 8 },
  serviceOptActive: { backgroundColor: Colors.primary },
  serviceOptText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  modalCancel: { flex: 1, padding: 15, borderRadius: 999, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  modalSubmit: { flex: 2, padding: 15, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center' },
  modalSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
