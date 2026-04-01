import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface OCRResult {
  name?:           string;
  nid?:            string;
  citizenshipNo?:  string;
  dob?:            string;
  gender?:         string;
  father?:         string;
  address?:        string;
}

interface Props {
  onResult: (result: OCRResult) => void;
  onClose:  () => void;
}

export default function OCRScanScreen({ onResult, onClose }: Props) {
  const cameraRef  = useRef<CameraView | null>(null);
  const [hasPerm, setHasPerm]     = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const [result, setResult]       = useState<OCRResult | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPerm(status === 'granted');
    })();
  }, []);

  const captureAndProcess = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64:  true,
      });

      // Resize for faster processing
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setPreview(resized.uri);

      // Call PRATIBIMBA backend OCR endpoint
      // The backend uses the document image to extract fields
      const response = await fetch('http://192.168.1.100:8080/citizen/ocr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_base64: resized.base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.fields) {
          setResult(data.fields);
        } else {
          // Fallback: parse locally using basic heuristics
          setResult(parseLocally(photo.base64 || ''));
        }
      } else {
        // Offline fallback — prompt manual entry
        setResult({});
      }
    } catch (e) {
      console.error('OCR error:', e);
      // On failure, return empty result so user can type manually
      setResult({});
    } finally {
      setScanning(false);
    }
  };

  // Simple local parsing fallback (when server unreachable)
  // In production: use Google ML Kit or Tesseract
  const parseLocally = (base64: string): OCRResult => {
    // Return empty — user fills manually
    // Production: integrate expo-ml-kit-text-recognition
    return {};
  };

  const confirmResult = () => {
    if (result) {
      onResult(result);
    }
  };

  const retake = () => {
    setPreview(null);
    setResult(null);
  };

  if (!hasPerm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPerm}>
          <MaterialIcons name="photo-camera" size={48} color={Colors.outline} />
          <Text style={styles.noPermTitle}>Camera Required</Text>
          <Text style={styles.noPermDesc}>
            Camera permission is needed to scan your citizenship card.
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Citizenship Card</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera or Preview */}
      {!preview ? (
        <View style={styles.cameraWrap}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            ratio="4:3"
          >
            {/* Guide overlay */}
            <View style={styles.overlay}>
              <View style={styles.guidebox}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </View>
          </CameraView>

          <View style={styles.cameraBottom}>
            <Text style={styles.guideText}>
              Place citizenship card within the frame
            </Text>
            <TouchableOpacity
              style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
              onPress={captureAndProcess}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
            <Text style={styles.guideSubtext}>Tap to capture</Text>
          </View>
        </View>
      ) : (
        /* Result screen */
        <View style={styles.resultWrap}>
          {scanning && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingText}>Reading document...</Text>
            </View>
          )}

          {result && !scanning && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="check-circle" size={24} color={Colors.success} />
                <Text style={styles.resultTitle}>Document Scanned</Text>
              </View>

              <View style={styles.resultFields}>
                {[
                  { label: 'Full Name',        value: result.name,          key: 'name'          },
                  { label: 'NID Number',       value: result.nid,           key: 'nid'           },
                  { label: 'Citizenship No.',  value: result.citizenshipNo, key: 'citizenshipNo' },
                  { label: 'Date of Birth',    value: result.dob,           key: 'dob'           },
                  { label: 'Gender',           value: result.gender,        key: 'gender'        },
                  { label: "Father's Name",    value: result.father,        key: 'father'        },
                  { label: 'Address',          value: result.address,       key: 'address'       },
                ].map(field => field.value ? (
                  <View key={field.key} style={styles.resultField}>
                    <Text style={styles.resultFieldLabel}>{field.label}</Text>
                    <Text style={styles.resultFieldValue}>{field.value}</Text>
                  </View>
                ) : null)}
              </View>

              {Object.keys(result).length === 0 && (
                <Text style={styles.noDataText}>
                  Could not auto-read. Please fill in manually.
                </Text>
              )}

              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.retakeBtn} onPress={retake}>
                  <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={confirmResult}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                  <Text style={styles.confirmBtnText}>Use These Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#000' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'rgba(0,0,0,0.8)' },
  backBtn:            { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  noPerm:             { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: Colors.background },
  noPermTitle:        { fontSize: 18, fontWeight: '700', color: Colors.primary },
  noPermDesc:         { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  closeBtn:           { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, marginTop: 8 },
  closeBtnText:       { color: '#fff', fontSize: 14, fontWeight: '700' },
  cameraWrap:         { flex: 1 },
  camera:             { flex: 1 },
  overlay:            { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guidebox:           { width: width * 0.85, height: width * 0.54, position: 'relative' },
  corner:             { position: 'absolute', width: 28, height: 28, borderColor: '#fff', borderWidth: 3 },
  cornerTL:           { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR:           { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL:           { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR:           { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  cameraBottom:       { backgroundColor: 'rgba(0,0,0,0.7)', padding: 28, alignItems: 'center', gap: 12 },
  guideText:          { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  captureBtn:         { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
  guideSubtext:       { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  resultWrap:         { flex: 1, backgroundColor: Colors.background },
  processingOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 },
  processingText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard:         { margin: 16, backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20 },
  resultHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  resultTitle:        { fontSize: 17, fontWeight: '700', color: Colors.primary },
  resultFields:       { gap: 10 },
  resultField:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  resultFieldLabel:   { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
  resultFieldValue:   { fontSize: 13, fontWeight: '600', color: Colors.primary, maxWidth: '60%', textAlign: 'right' },
  noDataText:         { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', padding: 16 },
  resultActions:      { flexDirection: 'row', gap: 12, marginTop: 20 },
  retakeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant },
  retakeBtnText:      { fontSize: 14, fontWeight: '600', color: Colors.primary },
  confirmBtn:         { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radius.full, backgroundColor: Colors.primary },
  confirmBtnText:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});