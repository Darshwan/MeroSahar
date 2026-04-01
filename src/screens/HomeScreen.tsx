import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { statsAPI, systemAPI, uiActionAPI } from '../api/client';
import HamburgerMenu from '../components/Hamburger';

const SERVICES = [
  { icon: 'receipt-long', label: 'Pay Tax', screen: 'Request' },
  { icon: 'water-drop', label: 'Water Bill', screen: 'Request' },
  { icon: 'bolt', label: 'NEA Pay', screen: 'Request' },
  { icon: 'description', label: 'Sifarish', screen: 'Request' },
];

const NOTICES = ['Urgent', 'Infrastructure', 'Health', 'Culture', 'Tourism'];

const NEWS_ITEMS = [
  {
    title: 'Pokhara Regional Airport initiates full night-landing capability operations.',
    tag: 'Tourism & Dev',
    time: 'LATEST',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80',
    summary: 'CAAN confirmed technical evaluations for IFR operations are complete and active.',
  },
  {
    title: 'Lakeside Organic Market to host Weekend Harvest Festival.',
    time: '2 HOURS AGO',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Gandaki Province allocates funds for New Cricket Stadium.',
    time: '5 HOURS AGO',
    image:
      'https://images.unsplash.com/photo-1593766788306-28561086694e?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Digital permit queue reduced in Ward 17 after system rollout.',
    time: '8 HOURS AGO',
    image:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Tourism board opens sunrise shuttle route around Phewa circuit.',
    time: '1 DAY AGO',
    image:
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=600&q=80',
  },
];

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 900;
  const [menuOpen, setMenuOpen] = useState(false);

  const { citizen } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const runUiAction = async (key: string, fn: () => Promise<any>, successMessage?: string) => {
    setActionLoading(key);
    try {
      const res = await fn();
      if (res?.success === false) {
        throw new Error(res?.message || 'Action failed');
      }
      if (successMessage) {
        Toast.show({ type: 'success', text1: successMessage });
      }
      return res;
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: e?.message || 'Unable to complete action',
      });
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  const loadStats = async () => {
    const [statsRes, healthRes] = await Promise.all([
      statsAPI.getStats(),
      systemAPI.checkDatabaseHealth(),
    ]);

    if (statsRes?.success && statsRes?.stats) {
      setStats(statsRes.stats);
    } else {
      setStats(null);
    }

    setDbConnected(healthRes?.dbConnected === true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(10, insets.top + 4) }]}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuOpen(true)}>
            <MaterialIcons name="menu" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appName}>Hamro Pokhara</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => runUiAction('notifications', () => uiActionAPI.getNotifications(), 'Notifications synced')}
        >
          <MaterialIcons name="notifications-none" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: isCompact ? 14 : 18,
          paddingTop: 12,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBlock}>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={[styles.greetText, { fontSize: isCompact ? 32 : 38 }]}>Namaste, Pokhara</Text>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={22} color={Colors.primary} style={{ opacity: 0.6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="What do you need today?"
            placeholderTextColor={Colors.onSurfaceVariant}
          />
          <TouchableOpacity style={styles.micBtn}>
            <MaterialIcons name="mic" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suchana <Text style={styles.sectionSub}>/ Notices</Text></Text>
          <TouchableOpacity onPress={() => runUiAction('notices', () => uiActionAPI.getNotices(), 'Notices refreshed')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noticesRow}>
          {NOTICES.map((n, i) => (
            <TouchableOpacity key={n} style={styles.noticeItem}>
              <View style={[styles.noticeCircle, i === 0 && styles.noticeCircleUrgent]}>
                <View style={styles.noticeInner}>
                  <MaterialIcons
                    name={
                      i === 0
                        ? 'campaign'
                        : i === 1
                          ? 'construction'
                          : i === 2
                            ? 'local-hospital'
                            : i === 3
                              ? 'celebration'
                              : 'landscape'
                    }
                    size={24}
                    color={i === 0 ? Colors.secondary : Colors.primary}
                  />
                </View>
              </View>
              <Text style={[styles.noticeLabel, i === 0 && styles.noticeLabelUrgent]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.bentoRow, !isWide && { flexDirection: 'column' }]}>
          <View style={styles.weatherCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <View style={styles.weatherHeader}>
              <View style={styles.weatherBadge}>
                <Text style={styles.weatherBadgeText}>Atmosphere Today</Text>
              </View>
              <View style={styles.aqiBox}>
                <Text style={styles.aqiLabel}>AQI Index</Text>
                <Text style={styles.aqiNum}>42</Text>
                <Text style={styles.aqiState}>Excellent</Text>
              </View>
            </View>

            <View style={styles.weatherMain}>
              <MaterialIcons name="wb-sunny" size={46} color="#fff" />
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
              <View style={styles.weatherStatNoBorder}>
                <Text style={styles.weatherStatLabel}>Visibility</Text>
                <Text style={styles.weatherStatVal}>10km</Text>
              </View>
            </View>
          </View>

          <View style={styles.wardCard}>
            <View style={styles.wardTop}>
              <View style={styles.wardIcon}>
                <MaterialIcons name="location-on" size={22} color={Colors.primary} />
              </View>
              <View style={styles.wardBadgeTag}>
                <Text style={styles.wardBadgeText}>Ward 17 Context</Text>
              </View>
            </View>
            <Text style={styles.wardTitle}>Ward Presence</Text>
            <Text style={styles.wardDesc}>
              Your local representatives are active. Check the progress of Ward 17&apos;s road paving project.
            </Text>
            <TouchableOpacity
              style={styles.wardBtn}
              onPress={() => runUiAction('ward_map', () => uiActionAPI.getWardMap(citizen?.ward_code), 'Ward data loaded')}
            >
              <Text style={styles.wardBtnText}>Open Ward Map</Text>
              <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.contentRow, !isWide && { flexDirection: 'column' }]}>
          <View style={styles.newsColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pokhara Samachar <Text style={styles.sectionSub}>/ Top 5</Text></Text>
              <TouchableOpacity onPress={() => runUiAction('news', () => uiActionAPI.getNews(), 'News synced')}>
                <Text style={styles.digitalEdition}>Digital Edition</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.92} style={styles.heroNewsCard}>
              <Image source={{ uri: NEWS_ITEMS[0].image }} style={styles.heroNewsImage} />
              <View style={styles.heroNewsOverlay}>
                <View style={styles.heroTagWrap}>
                  <Text style={styles.heroTag}>{NEWS_ITEMS[0].tag}</Text>
                  <Text style={styles.heroLatest}>{NEWS_ITEMS[0].time}</Text>
                </View>
                <Text style={styles.heroNewsTitle}>{NEWS_ITEMS[0].title}</Text>
                <Text style={styles.heroNewsSummary}>{NEWS_ITEMS[0].summary}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.newsGrid}>
              {NEWS_ITEMS.slice(1).map((item) => (
                <TouchableOpacity key={item.title} activeOpacity={0.9} style={styles.newsItemCard}>
                  <Image source={{ uri: item.image }} style={styles.newsThumb} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.newsItemTitle}>{item.title}</Text>
                    <Text style={styles.newsItemTime}>{item.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.servicesColumn}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>E-Sewa <Text style={styles.sectionSub}>/ Direct</Text></Text>
            <View style={styles.servicesGrid}>
              {SERVICES.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={styles.serviceCard}
                  onPress={async () => {
                    if (s.label === 'Pay Tax') {
                      await runUiAction('pay_tax', () => uiActionAPI.initiateTaxPayment({ tax_type: 'PROPERTY' }), 'Tax payment initiated');
                      return;
                    }
                    if (s.label === 'Water Bill') {
                      await runUiAction('water_bill', () => uiActionAPI.initiateWaterBillPayment({}), 'Water payment initiated');
                      return;
                    }
                    if (s.label === 'NEA Pay') {
                      await runUiAction('electric_bill', () => uiActionAPI.initiateElectricityPayment({}), 'Electricity payment initiated');
                      return;
                    }
                    navigation.navigate(s.screen);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name={s.icon as any} size={28} color={Colors.primary} />
                  <Text style={styles.serviceLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.digitalCard}>
              <View style={styles.digitalTop}>
                <MaterialIcons name="verified" size={18} color={Colors.goldLight} />
                <Text style={styles.digitalLabel}>Digital Citizen Card</Text>
              </View>
              <Text style={styles.digitalDesc}>
                Your virtual identity card for quick verification at ward offices.
              </Text>
              <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('Verify')}>
                <MaterialIcons name="qr-code" size={16} color="#fff" />
                <Text style={styles.qrBtnText}>Show QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.healthPill}>
          <MaterialIcons
            name={dbConnected ? 'cloud-done' : 'cloud-off'}
            size={14}
            color={dbConnected ? Colors.success : Colors.secondary}
          />
          <Text style={[styles.healthPillText, { color: dbConnected ? Colors.success : Colors.secondary }]}>
            {dbConnected ? 'Database Connected' : 'Database Offline'}
          </Text>
        </View>

        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>PRATIBIMBA Live</Text>
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

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 88, right: isCompact ? 12 : 18 }]}
        onPress={() =>
          runUiAction(
            'sos',
            () => uiActionAPI.createEmergencyAlert({ ward_code: citizen?.ward_code, message: 'SOS triggered from app' }),
            'Emergency alert sent'
          )
        }
      >
        <MaterialIcons name="sos" size={20} color="#fff" />
        <Text style={styles.fabText}>Emergency Help</Text>
      </TouchableOpacity>

      {actionLoading && (
        <View style={styles.actionOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.actionOverlayText}>Contacting server...</Text>
        </View>
      )}

      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,59,90,0.08)',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  appName: {
    fontSize: 21,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  welcomeBlock: {
    marginBottom: 14,
  },
  dateText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetText: {
    marginTop: 2,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 18,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.onSurface,
    paddingVertical: 12,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionSub: {
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  digitalEdition: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  noticesRow: {
    gap: 14,
    paddingRight: 8,
    paddingBottom: 8,
    marginBottom: 20,
  },
  noticeItem: {
    width: 86,
    alignItems: 'center',
    gap: 6,
  },
  noticeCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 3,
  },
  noticeCircleUrgent: {
    backgroundColor: Colors.secondary,
  },
  noticeInner: {
    flex: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  noticeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  noticeLabelUrgent: {
    color: Colors.secondary,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  weatherCard: {
    flex: 1.4,
    borderRadius: Radius.xl,
    padding: 18,
    minHeight: 240,
    overflow: 'hidden',
    ...Shadow.md,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weatherBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,59,90,0.35)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  weatherBadgeText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  tempText: {
    fontSize: 42,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: -1,
  },
  condText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  aqiBox: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'flex-end',
  },
  aqiLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  aqiNum: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryFixedDim,
  },
  aqiState: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7CE2A7',
  },
  weatherStats: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 12,
    flexDirection: 'row',
  },
  weatherStat: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.12)',
  },
  weatherStatNoBorder: {
    flex: 1,
    alignItems: 'center',
  },
  weatherStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.60)',
    textTransform: 'uppercase',
  },
  weatherStatVal: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  wardCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(155,204,246,0.4)',
    minHeight: 240,
    ...Shadow.sm,
  },
  wardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wardIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wardBadgeTag: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  wardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.onPrimaryFixedVariant,
  },
  wardTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  wardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.onSurfaceVariant,
    marginBottom: 14,
  },
  wardBtn: {
    marginTop: 'auto',
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  wardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  newsColumn: {
    flex: 1.5,
  },
  servicesColumn: {
    flex: 1,
  },
  heroNewsCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 220,
    ...Shadow.sm,
  },
  heroNewsImage: {
    width: '100%',
    height: 220,
  },
  heroNewsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.40)',
    padding: 14,
  },
  heroTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroLatest: {
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroNewsTitle: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  heroNewsSummary: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
  },
  newsGrid: {
    marginTop: 10,
    gap: 10,
  },
  newsItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    padding: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  newsThumb: {
    width: 62,
    height: 62,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  newsItemTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  newsItemTime: {
    marginTop: 4,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.onSurface,
  },
  digitalCard: {
    marginTop: 12,
    borderRadius: Radius.xl,
    padding: 16,
    backgroundColor: Colors.primary,
  },
  digitalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  digitalLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  digitalDesc: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  qrBtn: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  qrBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  healthPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  healthPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsCard: {
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.successLight,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  statLbl: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadow.lg,
  },
  fabText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(247,250,249,0.8)',
  },
  actionOverlayText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
