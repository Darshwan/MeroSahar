import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { statsAPI } from '../api/client';

const SERVICES = [
  { icon: 'receipt-long', label: 'Pay Tax',    screen: 'Request' },
  { icon: 'water-drop',   label: 'Water Bill', screen: 'Request' },
  { icon: 'bolt',         label: 'NEA Pay',    screen: 'Request' },
  { icon: 'description',  label: 'Sifarish',   screen: 'Request' },
];

const NOTICES = ['Urgent', 'Infrastructure', 'Health', 'Culture', 'Tourism'];

export default function HomeScreen({ navigation }: any) {
  const { citizen } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const loadStats = async () => {
    try {
      const res = await statsAPI.getStats();
      if (res.success) setStats(res.stats);
    } catch (e) {
      // Demo mode — no server needed for home screen
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.menuBtn}>
            <MaterialIcons name="menu" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appName}>Hamro Pokhara</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.greetText}>Namaste, Pokhara</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={Colors.primary} style={{ opacity: 0.6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="What do you need today?"
            placeholderTextColor={Colors.outline}
          />
          <TouchableOpacity style={styles.micBtn}>
            <MaterialIcons name="mic" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Notices horizontal scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suchana <Text style={styles.sectionSub}>/ Notices</Text></Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noticesRow}>
          {NOTICES.map((n, i) => (
            <TouchableOpacity key={n} style={styles.noticeItem}>
              <View style={[styles.noticeCircle, i === 0 && styles.noticeCircleUrgent]}>
                <View style={styles.noticeInner}>
                  <MaterialIcons
                    name={i === 0 ? 'campaign' : i === 1 ? 'construction' : i === 2 ? 'local-hospital' : i === 3 ? 'celebration' : 'landscape'}
                    size={24}
                    color={i === 0 ? Colors.secondary : Colors.primary}
                  />
                </View>
              </View>
              <Text style={[styles.noticeLabel, i === 0 && styles.noticeLabelUrgent]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weather + Ward bento */}
        <View style={styles.bentoRow}>
          {/* Weather */}
          <View style={styles.weatherCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherBadgeText}>Atmosphere Today</Text>
            </View>
            <View style={styles.weatherMain}>
              <MaterialIcons name="wb-sunny" size={44} color="#fff" />
              <View>
                <Text style={styles.tempText}>24°C</Text>
                <Text style={styles.condText}>Mostly Sunny · Pokhara-6</Text>
              </View>
            </View>
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
                <Text style={styles.weatherStatVal}>62%</Text>
              </View>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatLabel}>UV Index</Text>
                <Text style={styles.weatherStatVal}>Low</Text>
              </View>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatLabel}>Visibility</Text>
                <Text style={styles.weatherStatVal}>10km</Text>
              </View>
            </View>
          </View>

          {/* Ward Card */}
          <View style={styles.wardCard}>
            <View style={styles.wardTop}>
              <View style={styles.wardIcon}>
                <MaterialIcons name="location-on" size={22} color={Colors.primary} />
              </View>
              <View style={styles.wardBadge}>
                <Text style={styles.wardBadgeText}>Ward 09</Text>
              </View>
            </View>
            <Text style={styles.wardTitle}>Ward Presence</Text>
            <Text style={styles.wardDesc}>Your local representatives are active. Check ward progress.</Text>
            <TouchableOpacity style={styles.wardBtn}>
              <Text style={styles.wardBtnText}>Open Ward Map</Text>
              <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* E-Sewa Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>E-Sewa <Text style={styles.sectionSub}>/ Direct</Text></Text>
        </View>
        <View style={styles.servicesGrid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={styles.serviceCard}
              onPress={() => navigation.navigate(s.screen)}
              activeOpacity={0.8}
            >
              <MaterialIcons name={s.icon as any} size={28} color={Colors.primary} />
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Digital Citizen Card */}
        <View style={styles.digitalCard}>
          <View style={styles.digitalTop}>
            <MaterialIcons name="verified" size={20} color={Colors.goldLight} />
            <Text style={styles.digitalLabel}>Digital Citizen Card</Text>
          </View>
          <Text style={styles.digitalDesc}>
            Your virtual identity card for quick verification at ward offices.
          </Text>
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => navigation.navigate('Verify')}
          >
            <MaterialIcons name="qr-code" size={16} color="#fff" />
            <Text style={styles.qrBtnText}>Show QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* PRATIBIMBA Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>🔒 PRATIBIMBA Live</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats.total_documents?.toLocaleString() || '—'}</Text>
                <Text style={styles.statLbl}>Documents</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats.issued_today || '—'}</Text>
                <Text style={styles.statLbl}>Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: Colors.success }]}>
                  {stats.tampered_alerts === 0 ? '✓' : '⚠'}
                </Text>
                <Text style={styles.statLbl}>Integrity</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Emergency FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="sos" size={22} color="#fff" />
        <Text style={styles.fabText}>Emergency</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(247,250,249,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,59,90,0.05)',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 6, borderRadius: Radius.full },
  appName: { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: -0.3 },
  notifBtn: { padding: 6, borderRadius: Radius.full },
  scrollContent: { padding: 16, paddingBottom: 100 },
  welcome: { marginBottom: 16 },
  dateText: { fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  greetText: { fontSize: 30, fontWeight: '900', color: Colors.primary, letterSpacing: -0.8, marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full, paddingHorizontal: 18,
    paddingVertical: 4, marginBottom: 24, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.onSurface, paddingVertical: 12 },
  micBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  sectionSub: { fontWeight: '400', color: Colors.outline },
  viewAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  noticesRow: { gap: 16, paddingRight: 16, paddingBottom: 8, marginBottom: 24 },
  noticeItem: { alignItems: 'center', gap: 6, width: 72 },
  noticeCircle: {
    width: 72, height: 72, borderRadius: 36, padding: 3,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  noticeCircleUrgent: {
    backgroundColor: Colors.secondary,
  },
  noticeInner: {
    flex: 1, borderRadius: 32, backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.surface,
  },
  noticeLabel: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },
  noticeLabelUrgent: { color: Colors.secondary },
  bentoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  weatherCard: { flex: 1.4, borderRadius: Radius.xl, padding: 20, overflow: 'hidden', ...Shadow.md },
  weatherBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,59,90,0.35)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  weatherBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  tempText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  condText: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  weatherStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  weatherStat: { flex: 1, alignItems: 'center' },
  weatherStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  weatherStatVal: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  wardCard: {
    flex: 1, borderRadius: Radius.xl, padding: 18,
    backgroundColor: Colors.surfaceContainerLowest, ...Shadow.sm,
  },
  wardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  wardIcon: {
    width: 44, height: 44, borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  wardBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  wardBadgeText: { color: Colors.onPrimaryFixedVariant, fontSize: 10, fontWeight: '700' },
  wardTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  wardDesc: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16, marginBottom: 14 },
  wardBtn: {
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radius.lg,
    paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  wardBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  serviceCard: {
    width: '47%', aspectRatio: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.surfaceContainer, ...Shadow.sm,
  },
  serviceLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.onSurface },
  digitalCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: 20, marginBottom: 16,
  },
  digitalTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  digitalLabel: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  digitalDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18, marginBottom: 14 },
  qrBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg,
    paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  qrBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
    padding: 18, borderWidth: 1, borderColor: Colors.successLight, marginBottom: 8,
  },
  statsTitle: { fontSize: 13, fontWeight: '700', color: Colors.success, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 90, right: 16,
    backgroundColor: Colors.secondary,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: Radius.full, ...Shadow.lg,
  },
  fabText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});