import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ScrollView,
  SafeAreaView, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { API_BASE } from '../api/client';

const { width } = Dimensions.get('window');
const MENU_WIDTH = Math.min(width * 0.82, 340);

interface MenuItem {
  icon:    string;
  label:   string;
  labelNE: string;
  screen?: string;
  action?: () => void;
  badge?:  string;
}

interface Props {
  visible:   boolean;
  onClose:   () => void;
  navigation: any;
}

export default function HamburgerMenu({ visible, onClose, navigation }: Props) {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  const { citizen, tourist, sessionType, logout, language, setLanguage, myRequests } = useStore();

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -MENU_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const userName = citizen?.name || tourist?.name || 'Guest';
  const userSub  = citizen
    ? `Ward ${citizen.ward_number} · ${citizen.district}`
    : tourist
    ? tourist.nationality
    : 'Browsing as guest';

  const pendingCount = myRequests.filter(r =>
    r.status === 'PENDING' || r.status === 'UNDER_REVIEW'
  ).length;

  const navigate = (screen: string) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 200);
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await logout();
    }, 300);
  };

  const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Main',
      items: [
        { icon: 'home',             label: 'Home',          labelNE: 'गृहपृष्ठ',     screen: 'Home'    },
        { icon: 'account-balance',  label: 'Sewa',          labelNE: 'सेवा',          screen: 'Sewa'    },
        { icon: 'location-city',    label: 'Pokhara',       labelNE: 'पोखरा',         screen: 'Explore' },
        { icon: 'person',           label: 'Profile',       labelNE: 'प्रोफाइल',      screen: 'Profile' },
      ],
    },
    {
      title: 'Documents',
      items: [
        { icon: 'description',      label: 'My Requests',   labelNE: 'मेरा अनुरोध',   screen: 'Track',   badge: pendingCount > 0 ? String(pendingCount) : undefined },
        { icon: 'qr-code-scanner',  label: 'Verify Doc',    labelNE: 'कागज जाँच',     screen: 'Verify'  },
        { icon: 'add-circle',       label: 'New Request',   labelNE: 'नयाँ अनुरोध',  screen: 'Request' },
      ],
    },
    ...(sessionType === 'TOURIST' ? [{
      title: 'Tourism',
      items: [
        { icon: 'terrain',          label: 'Trek Permits',  labelNE: 'ट्रेक अनुमति',  screen: 'TouristServices' },
        { icon: 'map',              label: 'Trail Map',     labelNE: 'ट्रेल नक्सा',   screen: 'TouristServices' },
        { icon: 'emergency',        label: 'Emergency',     labelNE: 'आपतकालीन',      screen: 'TouristServices' },
      ],
    }] : []),
    {
      title: 'Settings',
      items: [
        { icon: 'notifications',    label: 'Notifications', labelNE: 'सूचना',          screen: 'Profile' },
        { icon: 'info',             label: 'About',         labelNE: 'बारेमा',          action: () => {} },
      ],
    },
  ];

  const bg = bgAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Background overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bg as any }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Slide-in drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Drawer header */}
          <View style={styles.drawerHeader}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            {/* User info */}
            <View style={styles.userAvatar}>
              <MaterialIcons
                name={sessionType === 'TOURIST' ? 'flight' : 'person'}
                size={28} color={Colors.primary}
              />
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userSub}>{userSub}</Text>

            {/* Session type badge */}
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>
                {sessionType === 'CITIZEN'  ? 'Verified Citizen'
                : sessionType === 'TOURIST' ? 'Tourist'
                : 'Guest'}
              </Text>
            </View>
          </View>

          {/* Menu items */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {MENU_SECTIONS.map((section) => (
              <View key={section.title} style={styles.menuSection}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuItem}
                    onPress={() => {
                      if (item.action) { onClose(); item.action(); }
                      else if (item.screen) navigate(item.screen);
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <Text style={styles.menuItemNE}>{item.labelNE}</Text>
                    </View>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <MaterialIcons name="chevron-right" size={18} color={Colors.outline} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Language switcher */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.langRow}>
                {[
                  { code: 'ne', label: 'नेपाली' },
                  { code: 'en', label: 'English' },
                ].map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langBtn, language === l.code && styles.langBtnActive]}
                    onPress={() => setLanguage(l.code)}
                  >
                    <Text style={[styles.langBtnText, language === l.code && { color: '#fff' }]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Server info (debug) */}
            <View style={styles.serverInfo}>
              <MaterialIcons name="dns" size={12} color={Colors.outline} />
              <Text style={styles.serverInfoText}>{API_BASE}</Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={18} color={Colors.secondary} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Mero Sahar v1.0.0 · PRATIBIMBA NDO</Text>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer:           { position: 'absolute', left: 0, top: 0, bottom: 0, width: MENU_WIDTH, backgroundColor: Colors.background, ...Shadow.lg },
  drawerHeader:     { padding: 20, paddingTop: 48, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  closeBtn:         { position: 'absolute', top: 48, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  userAvatar:       { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  userName:         { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userSub:          { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  sessionBadge:     { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sessionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  menuScroll:       { flex: 1 },
  menuSection:      { paddingHorizontal: 14, paddingTop: 16 },
  sectionTitle:     { fontSize: 10, fontWeight: '700', color: Colors.outline, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 10 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 11, borderRadius: Radius.xl, marginBottom: 2 },
  menuItemIcon:     { width: 36, height: 36, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel:    { fontSize: 14, fontWeight: '600', color: Colors.primary },
  menuItemNE:       { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  badge:            { backgroundColor: Colors.secondary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText:        { color: '#fff', fontSize: 10, fontWeight: '700' },
  langRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
  langBtn:          { flex: 1, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant },
  langBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langBtnText:      { fontSize: 13, fontWeight: '700', color: Colors.primary },
  serverInfo:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingTop: 20 },
  serverInfoText:   { fontSize: 10, color: Colors.outline, fontFamily: 'monospace' },
  logoutBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 14, padding: 16, borderRadius: Radius.xl, backgroundColor: 'rgba(175,47,35,0.06)', borderWidth: 1, borderColor: 'rgba(175,47,35,0.15)' },
  logoutText:       { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  version:          { textAlign: 'center', fontSize: 10, color: Colors.outline, paddingBottom: 20, paddingTop: 4 },
});