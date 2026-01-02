import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert, Modal, TextInput, ScrollView, Switch, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useCurrency } from '../context/CurrencyContext';
import { normalize, wp, hp } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const DeliveryDashboardScreen = ({ navigation }) => {
    const { formatPrice } = useCurrency();

    // State
    const [userInfo, setUserInfo] = useState(null);
    const [partnerStatus, setPartnerStatus] = useState(null); // 'unregistered', 'pending', 'approved'
    const [loading, setLoading] = useState(true);
    const [partnerData, setPartnerData] = useState(null);

    // Dashboard State
    const [activeTab, setActiveTab] = useState('available');
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null); // For handling confirmation
    const [modalVisible, setModalVisible] = useState(false);
    const [deliveryOtp, setDeliveryOtp] = useState('');

    // Registration Form State
    const [licenseNumber, setLicenseNumber] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');

    // 1. Initial Load: Check Status
    const checkStatus = async () => {
        setLoading(true);
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            if (!stored) return;
            const user = JSON.parse(stored);
            setUserInfo(user);

            const response = await fetch(`${API_BASE_URL}/delivery/status/${user._id}`);
            const data = await response.json();

            if (data.registered) {
                setPartnerData(data.partner);
                setPartnerStatus(data.partner.verificationStatus); // 'pending' or 'approved'
                setIsOnline(data.partner.isOnline);
            } else {
                setPartnerStatus('unregistered');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkStatus();
        }, [])
    );

    // 2. Fetch Orders (Only if Approved)
    const fetchOrders = async (silent = false) => {
        if (partnerStatus !== 'approved' || !userInfo) return;

        try {
            if (!silent) setRefreshing(true);
            let url = '';
            if (activeTab === 'available') {
                url = `${API_BASE_URL}/delivery/available`;
            } else {
                url = `${API_BASE_URL}/delivery/my-jobs/${userInfo._id}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            if (!silent) setRefreshing(false);
        }
    };

    useEffect(() => {
        if (partnerStatus === 'approved') {
            fetchOrders();
        }
    }, [partnerStatus, activeTab]);

    // Realtime Polling
    useEffect(() => {
        let interval;
        if (partnerStatus === 'approved' && isOnline) {
            interval = setInterval(() => {
                fetchOrders(true);
            }, 10000); // Poll every 10 seconds
        }
        return () => clearInterval(interval);
    }, [partnerStatus, isOnline, activeTab]);

    // Actions
    const handleRegister = async () => {
        if (!licenseNumber || !vehiclePlate) {
            Alert.alert("Missing Details", "Please fill in all vehicle and license details.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/delivery/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userInfo._id,
                    licenseNumber,
                    vehiclePlate,
                    vehicleType
                })
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert("Application Submitted", "Your application is under review by our admin team.");
                checkStatus(); // Refresh to show pending screen
            } else {
                Alert.alert("Error", data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Submission failed.");
        }
    };

    const toggleOnline = async () => {
        try {
            const newStatus = !isOnline;
            setIsOnline(newStatus); // Optimistic

            const response = await fetch(`${API_BASE_URL}/delivery/toggle-online`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userInfo._id })
            });

            if (!response.ok) setIsOnline(!newStatus); // Revert
        } catch (e) {
            setIsOnline(!isOnline);
        }
    };

    const handleAcceptJob = async (orderId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/delivery/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, agentId: userInfo._id })
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert("Job Accepted", "Please proceed to the pickup location.");
                setActiveTab('my_jobs');
            } else {
                Alert.alert("Error", data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to accept job.");
        }
    };

    const handleUpdateStatus = async (orderId, currentStatus) => {
        let nextStatus = '';
        if (currentStatus === 'Shipped' || currentStatus === 'Ready to Ship') nextStatus = 'Out for Delivery';

        if (!nextStatus) return;

        try {
            const response = await fetch(`${API_BASE_URL}/delivery/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: nextStatus })
            });
            if (response.ok) {
                Alert.alert("Updated", `Order marked as ${nextStatus}`);
                fetchOrders();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCompleteDelivery = async () => {
        if (!activeOrder || !deliveryOtp) return;
        try {
            const response = await fetch(`${API_BASE_URL}/delivery/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: activeOrder._id, otp: deliveryOtp })
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert("Success", "Delivery Verified & Completed! 🎉");
                setModalVisible(false);
                setDeliveryOtp('');
                setActiveOrder(null);
                fetchOrders();
            } else {
                Alert.alert("Verification Failed", data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Network error.");
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderRegistration = () => (
        <ScrollView contentContainerStyle={styles.regContainer}>
            <View style={styles.glassCard}>
                <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png' }}
                    style={styles.regImage}
                />
                <Text style={styles.regTitle}>Become a Delivery Partner</Text>
                <Text style={styles.regSubtitle}>Join our fleet, deliver smiles, and earn money on your own schedule.</Text>

                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Vehicle Type</Text>
                    <View style={styles.vehicleOptions}>
                        {['bike', 'scooter', 'truck'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.vehicleBtn, vehicleType === type && styles.vehicleBtnActive]}
                                onPress={() => setVehicleType(type)}
                            >
                                <Ionicons
                                    name={type === 'truck' ? 'bus' : 'bicycle'}
                                    size={normalize(24)}
                                    color={vehicleType === type ? '#fff' : '#555'}
                                />
                                <Text style={[styles.vehicleText, vehicleType === type && styles.vehicleTextActive]}>{type.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Driver's License Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter License No."
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                    />

                    <Text style={styles.inputLabel}>Vehicle Plate Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Eg. TN-01-AB-1234"
                        value={vehiclePlate}
                        onChangeText={setVehiclePlate}
                    />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
                        <Text style={styles.submitBtnText}>Submit Application</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderPending = () => (
        <View style={styles.centerContainer}>
            <View style={styles.glassCard}>
                <MaterialIcons name="pending-actions" size={normalize(80)} color="#FF9800" />
                <Text style={styles.pendingTitle}>Verification in Progress</Text>
                <Text style={styles.pendingText}>
                    We are currently reviewing your documents.{'\n'}This typically takes 24-48 hours.
                </Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={checkStatus}>
                    <Text style={styles.refreshText}>Check Status</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDashboard = () => (
        <>
            <View style={styles.dashHeader}>
                <View>
                    <Text style={styles.welcomeText}>Hello, {userInfo?.name}</Text>
                    <Text style={styles.statusText}>
                        Status: <Text style={{ color: isOnline ? '#4CAF50' : '#aaa' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
                    </Text>
                </View>
                <Switch
                    value={isOnline}
                    onValueChange={toggleOnline}
                    trackColor={{ false: "#767577", true: "#4CAF50" }}
                    thumbColor={isOnline ? "#fff" : "#f4f3f4"}
                />
            </View>

            {/* Stats Summary */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{partnerData?.totalDeliveries || 0}</Text>
                    <Text style={styles.statLabel}>Deliveries</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' }]}>
                    <Text style={styles.statNum}>{formatPrice(partnerData?.earnings || 0)}</Text>
                    <Text style={styles.statLabel}>Earnings</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' }]}>
                    <Text style={styles.statNum}>{partnerData?.rating || 5.0} ★</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'available' && styles.activeTab]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my_jobs' && styles.activeTab]}
                    onPress={() => setActiveTab('my_jobs')}
                >
                    <Text style={[styles.tabText, activeTab === 'my_jobs' && styles.activeTabText]}>My Tasks</Text>
                </TouchableOpacity>
            </View>

            {isOnline ? (
                <FlatList
                    data={orders}
                    keyExtractor={item => item._id}
                    renderItem={renderOrderCard}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6022/6022170.png' }}
                                style={{ width: 80, height: 80, marginBottom: 15, opacity: 0.5 }}
                            />
                            <Text style={styles.emptyText}>
                                {activeTab === 'available' ? "No requests nearby." : "No active tasks."}
                            </Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.offlineContainer}>
                    <MaterialCommunityIcons name="sleep" size={normalize(60)} color="#ccc" />
                    <Text style={styles.offlineText}>You are Offline</Text>
                    <Text style={styles.offlineSubText}>Go online to start receiving delivery requests.</Text>
                </View>
            )}
        </>
    );

    const renderOrderCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Out for Delivery' ? '#FFF3E0' : '#E8F5E9' }]}>
                    <Text style={[styles.statusBadgeText, { color: item.status === 'Out for Delivery' ? '#FF9800' : '#4CAF50' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.addressContainer}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={normalize(20)} color="#E50914" />
                    <View style={styles.locationText}>
                        <Text style={styles.customerName}>{item.userId?.name || 'Customer'}</Text>
                        <Text style={styles.address}>
                            {item.shippingAddress.name}, {item.shippingAddress.houseNo}, {item.shippingAddress.street}, {item.shippingAddress.city}
                        </Text>
                        <Text style={styles.phone}>📞 {item.shippingAddress.mobileNo}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionContainer}>
                {activeTab === 'available' ? (
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptJob(item._id)}>
                        <Text style={styles.btnText}>ACCEPT JOB</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        {item.status !== 'Out for Delivery' && (
                            <TouchableOpacity style={styles.statusBtn} onPress={() => handleUpdateStatus(item._id, item.status)}>
                                <Text style={styles.statusBtnText}>Pickup / Start</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.completeBtn, { opacity: item.status === 'Out for Delivery' ? 1 : 0.5 }]}
                            disabled={item.status !== 'Out for Delivery'}
                            onPress={() => {
                                setActiveOrder(item);
                                setModalVisible(true);
                            }}
                        >
                            <Text style={styles.btnText}>VERIFY & DROP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.mapBtn} onPress={() => Alert.alert("Navigation", "Opening Maps...")}>
                            <Ionicons name="navigate-circle" size={normalize(32)} color="#2196F3" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Delivery Partner</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {loading ? (
                        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#E50914" /></View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {partnerStatus === 'unregistered' && renderRegistration()}
                            {partnerStatus === 'pending' && renderPending()}
                            {partnerStatus === 'approved' && renderDashboard()}
                        </View>
                    )}

                    {/* OTP Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Complete Delivery</Text>
                                <Text style={styles.modalDesc}>Ask customer for PIN</Text>
                                <TextInput
                                    style={styles.otpInput}
                                    placeholder="0 0 0 0 0 0"
                                    keyboardType="numeric"
                                    maxLength={6}
                                    value={deliveryOtp}
                                    onChangeText={setDeliveryOtp}
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.verifyBtn} onPress={handleCompleteDelivery}>
                                        <Text style={styles.verifyText}>Verify</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingVertical: hp(2),
        paddingHorizontal: wp(5),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' },

    // Reg Styles
    regContainer: { padding: wp(5), alignItems: 'center' },
    glassCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        padding: wp(6),
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    regImage: { width: wp(30), height: wp(30), marginBottom: hp(2) },
    regTitle: { fontSize: normalize(20), fontWeight: 'bold', color: '#333', marginBottom: hp(1) },
    regSubtitle: { fontSize: normalize(14), color: '#666', textAlign: 'center', marginBottom: hp(3) },
    formContainer: { width: '100%' },
    inputLabel: { fontSize: normalize(14), fontWeight: 'bold', color: '#333', marginBottom: hp(1), marginTop: hp(2) },
    input: { backgroundColor: '#fff', padding: wp(3.5), borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', fontSize: normalize(15) },
    vehicleOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    vehicleBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: wp(3), borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
    vehicleBtnActive: { backgroundColor: '#333' },
    vehicleText: { fontSize: normalize(10), fontWeight: 'bold', marginTop: 5, color: '#555' },
    vehicleTextActive: { color: '#fff' },
    submitBtn: { backgroundColor: '#E50914', padding: hp(1.8), borderRadius: 12, alignItems: 'center', marginTop: hp(4) },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: normalize(16) },

    // Pending Styles
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(5) },
    pendingTitle: { fontSize: normalize(18), fontWeight: 'bold', marginTop: hp(2), color: '#333' },
    pendingText: { textAlign: 'center', color: '#666', marginTop: hp(1), lineHeight: normalize(22) },
    refreshBtn: { marginTop: hp(3), padding: 10 },
    refreshText: { color: '#E50914', fontWeight: 'bold', fontSize: normalize(15) },

    // Dashboard Styles
    dashHeader: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: wp(5),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)'
    },
    welcomeText: { fontSize: normalize(16), fontWeight: 'bold', color: '#333' },
    statusText: { fontSize: normalize(12), color: '#666' },
    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: hp(2), marginHorizontal: wp(4), borderRadius: 12, marginTop: hp(2) },
    statBox: { flex: 1, alignItems: 'center', padding: wp(4) },
    statNum: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: normalize(12), color: '#666' },
    tabs: { flexDirection: 'row', backgroundColor: 'transparent', marginBottom: hp(2), paddingHorizontal: wp(4) },
    tab: { flex: 1, padding: hp(1.5), alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.1)' },
    activeTab: { borderBottomColor: '#E50914' },
    tabText: { fontWeight: '600', color: '#888', fontSize: normalize(14) },
    activeTabText: { color: '#E50914' },

    // Offline
    offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: hp(10) },
    offlineText: { fontSize: normalize(18), fontWeight: 'bold', color: '#555', marginTop: hp(2) },
    offlineSubText: { color: '#999', marginTop: 5 },

    // List & Cards
    list: { paddingHorizontal: wp(4), paddingBottom: hp(10) },
    card: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: wp(4),
        marginBottom: hp(2),
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.5) },
    orderId: { fontWeight: 'bold', fontSize: normalize(15), color: '#333' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText: { fontSize: normalize(10), fontWeight: 'bold' },
    addressContainer: { backgroundColor: '#f9f9f9', padding: wp(3), borderRadius: 10, marginBottom: hp(2) },
    locationRow: { flexDirection: 'row' },
    locationText: { marginLeft: wp(3), flex: 1 },
    customerName: { fontWeight: 'bold', fontSize: normalize(13), marginBottom: 4, color: '#333' },
    address: { fontSize: normalize(12), color: '#666', marginBottom: 4, lineHeight: normalize(18) },
    phone: { fontSize: normalize(12), color: '#007AFF', fontWeight: 'bold' },
    actionContainer: { flexDirection: 'row', alignItems: 'center' },
    acceptBtn: { backgroundColor: '#333', flex: 1, padding: hp(1.5), borderRadius: 8, alignItems: 'center' },
    statusBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#333', padding: hp(1.5), borderRadius: 8, alignItems: 'center', marginRight: wp(2) },
    statusBtnText: { fontWeight: 'bold', color: '#333', fontSize: normalize(12) },
    completeBtn: { flex: 1, backgroundColor: '#4CAF50', padding: hp(1.5), borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: normalize(12) },
    mapBtn: { marginLeft: wp(3) },
    emptyContainer: { alignItems: 'center', marginTop: hp(5) },
    emptyText: { color: '#999', fontSize: normalize(14) },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', padding: wp(8), borderRadius: 20, alignItems: 'center' },
    modalTitle: { fontSize: normalize(18), fontWeight: 'bold', marginBottom: hp(1) },
    modalDesc: { color: '#666', marginBottom: hp(3) },
    otpInput: { borderBottomWidth: 2, borderBottomColor: '#E50914', width: '80%', textAlign: 'center', fontSize: normalize(24), padding: 10, marginBottom: hp(4), letterSpacing: 8 },
    modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    cancelModalBtn: { padding: 10 },
    verifyBtn: { backgroundColor: '#E50914', paddingVertical: hp(1.5), paddingHorizontal: wp(8), borderRadius: 10 },
    cancelText: { color: '#777', fontWeight: 'bold', fontSize: normalize(14) },
    verifyText: { color: '#fff', fontWeight: 'bold', fontSize: normalize(14) },
});

export default DeliveryDashboardScreen;
