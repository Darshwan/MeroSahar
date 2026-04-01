import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export const NotificationService = {

  // Request permission and get push token
  register: async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('[Notifications] Not a physical device — skipping');
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission denied');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pratibimba', {
        name:       'PRATIBIMBA Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:  '#003b5a',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('push_token', token);
    console.log('[Notifications] Push token:', token);
    return token;
  },

  // Schedule a local notification (for status updates when offline)
  scheduleLocal: async (
    title: string,
    body:  string,
    data?: any,
    seconds = 1
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
    });
  },

  // Show immediate local notification
  showImmediate: async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  },

  // Document ready notification
  documentReady: async (dtid: string, documentType: string) => {
    await NotificationService.showImmediate(
      '✅ Document Ready!',
      `Your ${documentType.replace(/_/g,' ')} is ready. Tap to download.`,
      { screen: 'Track', dtid }
    );
  },

  // Request received notification
  requestReceived: async (requestId: string) => {
    await NotificationService.showImmediate(
      '📋 Request Received',
      `ID: ${requestId}. Ward officer will review within 2 working days.`,
      { screen: 'Track', requestId }
    );
  },

  // Tamper alert (for officers)
  tamperAlert: async (dtid: string) => {
    await NotificationService.showImmediate(
      '🚨 PRATIBIMBA Alert',
      `Tamper detected on document ${dtid}. Immediate action required.`,
      { screen: 'Integrity', dtid }
    );
  },
};