import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';

export default function ProfileScreen() {
  const { citizen, logout, myRequests } = useStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout', 'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const approved = myRequests.filter(r => r.status === 'APPROVED').length;
  const pending  = myRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero Profile Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={32} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.profileName}>{citizen?.name || 'नागरिक'}</Text>
          <Text style={styles.profileNid}>{citizen?.nid || '—'}</Text>
          <View style={styles.wardPill}>
            <Text style={styles.wardPillText}>{citizen?.ward_code || 'NPL-04-33-09'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{myRequests.length}</Text>
            <Text style={styles.statLbl}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{approved}</Text>
            <Text style={styles.statLbl}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#b7791f' }]}>{pending}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {[
            { icon: 'description',   label: 'My Documents',      sub: 'View all issued documents'     },
            { icon: 'notifications', label: 'Notifications',     sub: 'SMS and push alerts'           },
            { icon: 'language',      label: 'Language',          sub: 'Change app language'           },
            { icon: 'security',      label: 'Privacy & Security',sub: 'Manage your data'              },
            { icon: 'help-outline',  label: 'Help & Support',    sub: 'Contact ward office or helpdesk'},
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i > 0 && styles.menuItemBorder]}>
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        {/* PRATIBIMBA Badge */}
        <View style={styles.pratibimbaBadge}>
          <MaterialIcons name="verified-user" size={18} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pratibimbaTitle}>PRATIBIMBA Verified</Text>
            <Text style={styles.pratibimbaSub}>
              Your documents are secured by the National Document Integrity Framework.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.secondary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Mero Sahar v1.0.0 · Powered by PRATIBIMBA</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  content:            { padding: 16, paddingBottom: 40 },
  heroCard:           { borderRadius: Radius.xl, padding: 28, alignItems: 'center', overflow: 'hidden', marginBottom: 16, ...Shadow.md },
  avatarRing:         { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatar:             { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  profileName:        { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  profileNid:         { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace', marginTop: 4 },
  wardPill:           { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, marginTop: 10 },
  wardPillText:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  statsRow:           { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:           { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: 16, alignItems: 'center', ...Shadow.sm },
  statNum:            { fontSize: 24, fontWeight: '900', color: Colors.primary },
  statLbl:            { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2, textAlign: 'center' },
  menuCard:           { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 14, ...Shadow.sm },
  menuItem:           { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuItemBorder:     { borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  menuIcon:           { width: 40, height: 40, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  menuLabel:          { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  menuSub:            { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  pratibimbaBadge:    { flexDirection: 'row', gap: 12, backgroundColor: Colors.successLight, padding: 16, borderRadius: Radius.xl, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(45,122,82,0.2)' },
  pratibimbaTitle:    { fontSize: 13, fontWeight: '700', color: Colors.success },
  pratibimbaSub:      { fontSize: 11, color: Colors.success, opacity: 0.8, marginTop: 2, lineHeight: 16 },
  logoutBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: '#fdf0ef', borderRadius: Radius.xl, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(175,47,35,0.2)' },
  logoutText:         { color: Colors.secondary, fontSize: 15, fontWeight: '700' },
  version:            { textAlign: 'center', fontSize: 11, color: Colors.outline },
});