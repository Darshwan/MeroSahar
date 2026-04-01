import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import SplashScreen    from './src/screens/SplashScreen';
import LanguageScreen  from './src/screens/LanguageScreen';
import ContinueAsScreen from './src/screens/ContinueAsScreen';
import LoginScreen     from './src/screens/LoginScreen';
import HomeScreen      from './src/screens/HomeScreen';
import SewaScreen      from './src/screens/Sewascreen';
import CitizenPortalScreen from './src/screens/CitizenPortalScreen';
import RequestScreen   from './src/screens/RequestScreen';
import TrackScreen     from './src/screens/TrackScreen';
import VerifyScreen    from './src/screens/VerifyScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import { CustomDrawer } from './src/components/CustomDrawer';
import LangToggle from './src/components/LangToggle';

import { Colors } from './src/constants/theme';
import { useStore } from './src/store/useStore';
import { NotificationService } from './src/utils/notifications';
import { startNetworkMonitor } from './src/utils/offlineQueue';
import { DrawerContext } from './src/context/DrawerContext';

// Configure foreground notification behavior for Expo's current NotificationBehavior type.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function GlobalLangToggle() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: insets.bottom + 92,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 999,
      }}
    >
      <LangToggle />
    </View>
  );
}

// ── Bottom Tab Navigator (shown after login) ──────────────────
function MainTabs({ sessionRole, isDrawerOpen, openDrawer, closeDrawer, navigation }: { sessionRole: 'anonymous' | 'guest' | 'citizen'; isDrawerOpen: boolean; openDrawer: () => void; closeDrawer: () => void; navigation: any }) {
  const isCitizen = sessionRole === 'citizen';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const tabBarHeight = Math.max(isCompact ? 64 : 72, (isCompact ? 48 : 56) + insets.bottom);
  const iconSize = isCompact ? 20 : 24;
  const labelSize = isCompact ? 9 : 10;

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer }}>
      <>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 0,
              elevation: 0,
              shadowColor: '#003b5a',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              height: 68,
              paddingBottom: 12,
              paddingTop: 8,
              paddingHorizontal: 8,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              position: 'absolute',
            },
            tabBarActiveTintColor: '#003b5a',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 0.3,
              marginTop: 2,
            },
            tabBarItemStyle: {
              borderRadius: 14,
              marginHorizontal: 4,
              paddingVertical: 2,
            },
            tabBarActiveBackgroundColor: 'rgba(0,59,90,0.06)',
          })}
        >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <MaterialIcons
                name={focused ? 'home' : 'home'}
                size={iconSize} color={color}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Pass drawer handlers to HomeScreen
            },
          }}
        />
        <Tab.Screen
          name="Sewa"
          component={SewaScreen}
          options={{
            tabBarLabel: 'Sewa',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="account-balance" size={iconSize} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Explore"
          component={CitizenPortalScreen}
          options={{
            tabBarLabel: 'Pokhara',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="location-city" size={iconSize} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Request"
          component={RequestScreen}
          options={{
            tabBarButton: () => null,
          }}
        />
        {isCitizen && (
          <Tab.Screen
            name="Track"
            component={TrackScreen}
            options={{
              tabBarLabel: 'Track',
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="track-changes" size={iconSize} color={color} />
              ),
            }}
          />
        )}
        <Tab.Screen
          name="Verify"
          component={VerifyScreen}
          options={{
            tabBarLabel: 'Verify',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="qr-code-scanner" size={iconSize} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={iconSize} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <CustomDrawer isOpen={isDrawerOpen} onClose={closeDrawer} navigation={navigation} />
      </>
    </DrawerContext.Provider>
  );
}

export default function App() {
  const { isHydrated, sessionRole, loadFromStorage } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    loadFromStorage();

    // Register for push notifications on app boot.
    NotificationService.register();

    // Auto-flush offline queue when connectivity is restored.
    const unsubscribe = startNetworkMonitor((result) => {
      if (result.success > 0) {
        Toast.show({
          type:  'success',
          text1: 'Back Online',
          text2: `${result.success} queued request${result.success > 1 ? 's' : ''} synced to server`,
        });
      }
    });

    // Listen for push notification taps.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen) {
        console.log('[Notifications] Tapped:', data.screen);
      }
    });

    return () => {
      unsubscribe();
      sub.remove();
    };
  }, []);

  if (!isHydrated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7faf9' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              ...TransitionPresets.SlideFromRightIOS,
            }}
          >
            {sessionRole === 'anonymous' ? (
              // ── Onboarding Flow ───────────────────────────────
              <>
                <Stack.Screen name="Splash"      component={SplashScreen} />
                <Stack.Screen name="Language"    component={LanguageScreen} />
                <Stack.Screen name="ContinueAs"  component={ContinueAsScreen} />
                <Stack.Screen name="Login"       component={LoginScreen} />
              </>
            ) : (
              // ── Main App ──────────────────────────────────────
              <Stack.Screen name="Main">
                {({ navigation: navProp }) => (
                  <MainTabs 
                    sessionRole={sessionRole} 
                    isDrawerOpen={isDrawerOpen}
                    openDrawer={openDrawer}
                    closeDrawer={closeDrawer}
                    navigation={navProp}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <GlobalLangToggle />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}