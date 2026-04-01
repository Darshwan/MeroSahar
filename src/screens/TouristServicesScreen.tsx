import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, SafeAreaView, ActivityIndicator,
    Modal, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';
import { touristAPI } from '../api/client';

const SERVICES = [
    {
        id: 'TIMS_PERMIT',
        name: 'TIMS Permit',
        nameNE: 'TIMS अनुमतिपत्र',
        desc: 'Trekkers\' Information Management System — required for all trekkers',
        fee: 2000,
        icon: 'terrain',
        color: Colors.primary,
    },
    {
        id: 'ANNAPURNA_PERMIT',
        name: 'Annapurna Conservation Area',
        nameNE: 'अन्नपूर्ण संरक्षण क्षेत्र',
        desc: 'Required for Annapurna Base Camp, Circuit, and Sanctuary treks',
        fee: 3000,
        icon: 'landscape',
        color: '#2e7d32',
    },
    {
        id: 'MANASLU_PERMIT',
        name: 'Manaslu Circuit',
        nameNE: 'मनास्लु सर्किट',
        desc: 'Restricted area permit for Manaslu Conservation Area',
        fee: 5000,
        icon: 'filter-hdr',
        color: '#1565c0',
    },
    {
        id: 'MUSTANG_PERMIT',
        name: 'Upper Mustang',
        nameNE: 'माथिल्लो मुस्ताङ',
        desc: 'Restricted area permit — USD 500 per 10 days',
        fee: 50000,
        icon: 'fort',
        color: '#e65100',
    },
    {
        id: 'LANGTANG_PERMIT',
        name: 'Langtang NP',
        nameNE: 'लाङटाङ राष्ट्रिय निकुञ्ज',
        desc: 'Langtang National Park entry permit',
        fee: 3000,
        icon: 'park',
        color: '#2e7d32',
    },
    {
        id: 'GUIDE_REQUEST',
        name: 'Hire a Licensed Guide',
        nameNE: 'लाइसेन्स प्राप्त गाइड',
        desc: 'Connect with certified trekking guides registered with Pokhara Metro',
        fee: 0,
        icon: 'person-pin',
        color: Colors.secondary,
    },
    {
        id: 'EMERGENCY_EVACUATION',
        name: 'Emergency Registration',
        nameNE: 'आपतकालीन दर्ता',
        desc: 'Register your trek for emergency rescue services',
        fee: 0,
        icon: 'emergency',
        color: Colors.secondary,
    },
];

export default function TouristServicesScreen({ navigation }: any) {
    const { tourist } = useStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
    const [destination, setDestination] = useState('');
    const [groupSize, setGroupSize] = useState('1');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        if (!tourist?.passport_no) { setLoading(false); return; }
        try {
            const res = await touristAPI.getRequests(tourist.passport_no);
            if (res.success) setRequests(res.requests || []);
        } catch { /* offline */ } finally {
            setLoading(false);
        }
    };

    const openService = (service: typeof SERVICES[0]) => {
        setSelectedService(service);
        setDestination('');
        setGroupSize('1');
        setDetails('');
        setShowModal(true);
    };

    const submitRequest = async () => {
        if (!selectedService || !tourist?.passport_no) return;
        setSubmitting(true);
        try {
            const res = await touristAPI.submitRequest({
                passport_no: tourist.passport_no,
                tourist_name: tourist.name,
                service_type: selectedService.id,
                destination: destination.trim(),
                group_size: parseInt(groupSize) || 1,
                details: details.trim(),
            });
            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: `${selectedService.name} Requested!`,
                    text2: `ID: ${res.request_id}${res.fee_amount > 0 ? ` · Fee: NPR ${res.fee_amount.toLocaleString()}` : ''}`,
                });
                setShowModal(false);
                loadRequests();
            } else {
                Toast.show({ type: 'error', text1: res.message || 'Request failed' });
            }
        } catch {
            Toast.show({ type: 'info', text1: 'Request submitted (Demo mode)' });
            setShowModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Tourism Services</Text>
                    <Text style={styles.headerSub}>{tourist?.name || 'Guest'} · {tourist?.nationality}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Passport card */}
                <View style={styles.passportCard}>
                    <MaterialIcons name="flight" size={24} color="#fff" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.passportNum}>{tourist?.passport_no}</Text>
                        <Text style={styles.passportNat}>{tourist?.nationality}</Text>
                    </View>
                    <View style={styles.verifiedChip}>
                        <MaterialIcons name="verified" size={12} color="#fff" />
                        <Text style={styles.verifiedChipText}>Verified</Text>
                    </View>
                </View>

                {/* My requests */}
                {requests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Permit Requests</Text>
                        {requests.map(r => (
                            <View key={r.request_id} style={styles.requestCard}>
                                <Text style={styles.reqType}>{r.service_type.replace(/_/g, ' ')}</Text>
                                <View style={[
                                    styles.statusChip,
                                    { backgroundColor: r.status === 'APPROVED' ? Colors.successLight : Colors.surfaceContainerHigh }
                                ]}>
                                    <Text style={[
                                        styles.statusChipText,
                                        { color: r.status === 'APPROVED' ? Colors.success : Colors.onSurfaceVariant }
                                    ]}>
                                        {r.status}
                                    </Text>
                                </View>
                                {r.fee_amount > 0 && (
                                    <Text style={styles.reqFee}>NPR {r.fee_amount.toLocaleString()}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Available services */}
                <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 8 }]}>
                    Available Services
                </Text>
                {SERVICES.map(service => (
                    <TouchableOpacity
                        key={service.id}
                        style={styles.serviceCard}
                        onPress={() => openService(service)}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.serviceIcon, { backgroundColor: service.color + '18' }]}>
                            <MaterialIcons name={service.icon as any} size={24} color={service.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <Text style={styles.serviceNameNE}>{service.nameNE}</Text>
                            <Text style={styles.serviceDesc} numberOfLines={2}>{service.desc}</Text>
                        </View>
                        <View style={styles.feeBox}>
                            {service.fee > 0
                                ? <Text style={styles.feeText}>NPR {service.fee.toLocaleString()}</Text>
                                : <Text style={[styles.feeText, { color: Colors.success }]}>Free</Text>
                            }
                            <MaterialIcons name="chevron-right" size={18} color={Colors.outline} />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Request modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowModal(false)}
            >
                {(() => {
                    const selectedFee = selectedService?.fee ?? 0;
                    const groupCount = parseInt(groupSize) || 1;
                    const totalFee = selectedFee * groupCount;
                    const feeLabel = selectedFee > 0;

                    return (
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>{selectedService?.name}</Text>
                                <Text style={styles.modalSub}>{selectedService?.desc}</Text>
                                {feeLabel && (
                                    <View style={styles.feeInfoBox}>
                                        <MaterialIcons name="payments" size={16} color={Colors.gold} />
                                        <Text style={styles.feeInfoText}>
                                            Fee: NPR {totalFee.toLocaleString()}
                                            {' '}({groupCount} person{groupCount > 1 ? 's' : ''})
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.fieldLabel}>Destination / Trek Route</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., ABC Base Camp, Thorong La Pass"
                                    placeholderTextColor={Colors.outline}
                                    value={destination}
                                    onChangeText={setDestination}
                                />

                                <Text style={styles.fieldLabel}>Group Size</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1"
                                    placeholderTextColor={Colors.outline}
                                    value={groupSize}
                                    onChangeText={setGroupSize}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.fieldLabel}>Additional Details</Text>
                                <TextInput
                                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                                    placeholder="Trek dates, special requirements..."
                                    placeholderTextColor={Colors.outline}
                                    value={details}
                                    onChangeText={setDetails}
                                    multiline
                                />

                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                        onPress={submitRequest}
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? <ActivityIndicator color="#fff" size="small" />
                                            : <Text style={styles.submitBtnText}>Submit Request</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                })()}
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primary, padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    scroll: { padding: 16, paddingBottom: 40 },
    passportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, padding: 16, marginBottom: 16, ...Shadow.md },
    passportNum: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
    passportNat: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    verifiedChipText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
    requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: 14, marginBottom: 8, gap: 10 },
    reqType: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primary },
    statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
    statusChipText: { fontSize: 10, fontWeight: '700' },
    reqFee: { fontSize: 12, fontWeight: '600', color: Colors.secondary },
    serviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: 16, marginBottom: 10, ...Shadow.sm },
    serviceIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    serviceName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    serviceNameNE: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1, marginBottom: 4 },
    serviceDesc: { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17 },
    feeBox: { alignItems: 'flex-end', gap: 4 },
    feeText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 19, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
    modalSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 14, lineHeight: 19 },
    feeInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef9ee', padding: 12, borderRadius: Radius.lg, marginBottom: 4, borderWidth: 1, borderColor: '#f0c36d' },
    feeInfoText: { fontSize: 13, fontWeight: '600', color: '#92400e' },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7, marginTop: 14 },
    input: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: Colors.onSurface },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 22 },
    cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
    submitBtn: { flex: 2, paddingVertical: 15, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center' },
    submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});