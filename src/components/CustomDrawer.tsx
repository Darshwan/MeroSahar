import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';

interface DrawerItem {
  icon: string;
  label: string;
  screen?: string;
}

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
}

export const CustomDrawer: React.FC<CustomDrawerProps> = ({ isOpen, onClose, navigation }) => {
  const insets = useSafeAreaInsets();
  const { logout } = useStore();

  const menuItems: DrawerItem[] = [
    { icon: 'home', label: 'Home', screen: 'Home' },
    { icon: 'account-balance', label: 'Services', screen: 'Sewa' },
    { icon: 'location-city', label: 'Citizen Portal', screen: 'Explore' },
    { icon: 'track-changes', label: 'Track', screen: 'Track' },
    { icon: 'qr-code-scanner', label: 'Verify', screen: 'Verify' },
    { icon: 'person', label: 'Profile', screen: 'Profile' },
  ];

  const handleNavigation = (screen?: string) => {
    if (screen) {
      navigation.navigate(screen);
    }
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Splash' }],
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Drawer */}
      <View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View>
            <Text style={styles.drawerTitle}>Mero Sahar</Text>
            <Text style={styles.drawerSub}>Pokhara Municipality</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.screen)}
            >
              <MaterialIcons name={item.icon as any} size={22} color={Colors.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color="#d32f2f" />
          <Text style={[styles.menuLabel, { color: '#d32f2f' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 2,
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  drawerSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
});
