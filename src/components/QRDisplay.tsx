import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Share, Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Colors, Radius, Shadow } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  dtid:         string;
  documentType: string;
  issuedDate:   string;
  wardCode:     string;
}

const VERIFY_BASE = 'https://verify.pratibimba.gov.np';

export default function QRDisplay({ dtid, documentType, issuedDate, wardCode }: Props) {
  const qrRef = useRef<any>(null);

  const verifyURL = `${VERIFY_BASE}/${dtid}`;

  const shareQR = async () => {
    try {
      await Share.share({
        message: `PRATIBIMBA Verified Document\nDTID: ${dtid}\nVerify at: ${verifyURL}`,
        title:   'My PRATIBIMBA Document',
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const saveQR = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Storage permission needed to save QR code.');
      return;
    }

    try {
      const uri = await captureRef(qrRef, {
        format:  'png',
        quality: 1,
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'QR code saved to your gallery.');
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* QR Card */}
      <View style={styles.qrCard} ref={qrRef} collapsable={false}>
        {/* Header */}
        <View style={styles.qrHeader}>
          <Text style={styles.qrHeaderTitle}>PRATIBIMBA</Text>
          <Text style={styles.qrHeaderSub}>National Document Registry · Nepal</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          <QRCode
            value={verifyURL}
            size={180}
            color={Colors.primary}
            backgroundColor="#fff"
            ecl="H" // High error correction
          />
        </View>

        {/* Document Info */}
        <View style={styles.qrInfo}>
          <View style={styles.qrInfoRow}>
            <Text style={styles.qrInfoLabel}>DTID</Text>
            <Text style={styles.qrInfoValue} numberOfLines={1}>{dtid}</Text>
          </View>
          <View style={styles.qrInfoRow}>
            <Text style={styles.qrInfoLabel}>Type</Text>
            <Text style={styles.qrInfoValue}>{documentType.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.qrInfoRow}>
            <Text style={styles.qrInfoLabel}>Issued</Text>
            <Text style={styles.qrInfoValue}>{issuedDate}</Text>
          </View>
          <View style={styles.qrInfoRow}>
            <Text style={styles.qrInfoLabel}>Ward</Text>
            <Text style={styles.qrInfoValue}>{wardCode}</Text>
          </View>
        </View>

        {/* Verify URL */}
        <View style={styles.verifyUrlBox}>
          <MaterialIcons name="lock" size={12} color={Colors.primary} />
          <Text style={styles.verifyUrlText} numberOfLines={1}>{verifyURL}</Text>
        </View>

        {/* Footer */}
        <View style={styles.qrFooter}>
          <Text style={styles.qrFooterText}>
            Scan to verify · Nepal Electronic Transactions Act 2063
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={shareQR}>
          <MaterialIcons name="share" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={saveQR}>
          <MaterialIcons name="save-alt" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { alignItems: 'center', gap: 16 },
  qrCard:         { backgroundColor: '#fff', borderRadius: Radius.xl, overflow: 'hidden', width: 280, ...Shadow.lg },
  qrHeader:       { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  qrHeaderTitle:  { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  qrHeaderSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 2, letterSpacing: 0.5 },
  qrWrapper:      { alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  qrInfo:         { paddingHorizontal: 16, paddingBottom: 8 },
  qrInfoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  qrInfoLabel:    { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  qrInfoValue:    { fontSize: 11, fontWeight: '600', color: Colors.primary, maxWidth: '65%', textAlign: 'right', fontFamily: 'monospace' },
  verifyUrlBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 12, backgroundColor: Colors.primaryFixed, padding: 8, borderRadius: Radius.lg },
  verifyUrlText:  { fontSize: 10, color: Colors.onPrimaryFixedVariant, flex: 1 },
  qrFooter:       { backgroundColor: Colors.surfaceContainerLow, padding: 10, alignItems: 'center' },
  qrFooterText:   { fontSize: 9, color: Colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 0.3 },
  actions:        { flexDirection: 'row', gap: 16 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant },
  actionText:     { fontSize: 14, fontWeight: '700', color: Colors.primary },
});