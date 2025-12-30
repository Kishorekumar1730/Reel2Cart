import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // Added import

const AdminDashboardScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [stats, setStats] = useState({});
    const [pendingSellers, setPendingSellers] = useState([]);
    const [offers, setOffers] = useState([]);

    // Add Offer Form State
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [newOffer, setNewOffer] = useState({ title: '', description: '', imageUrl: '', discountPercentage: '', couponCode: '' });

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9], // Offers usually wide
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const imgUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
            setNewOffer({ ...newOffer, imageUrl: imgUri });
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/stats`);
            if (res.ok) setStats(await res.json());
        } catch (e) {
            console.error("Stats Error", e);
        }
    };

    const fetchPendingSellers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/sellers/pending`);
            if (res.ok) setPendingSellers(await res.json());
        } catch (e) {
            console.error("Sellers Error", e);
        }
    };

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/offers`);
            if (res.ok) {
                const data = await res.json();
                setOffers(data); // Force update
            }
        } catch (e) {
            console.error("Offers Error", e);
        }
    };

    const fetchAllData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchStats(), fetchPendingSellers(), fetchOffers()]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAllData();
        }, [])
    );

    const onRefresh = () => {
        fetchAllData();
    };

    const handleVerifySeller = async (sellerId, action) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/seller/verify/${sellerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                Alert.alert("Success", `Seller ${action}d.`);
                fetchPendingSellers();
                fetchStats(); // Update stats explicitly
            }
        } catch (e) {
            Alert.alert("Error", "Action failed.");
        }
    };

    const handleCreateOffer = async () => {
        if (!newOffer.title || !newOffer.imageUrl) return Alert.alert("Missing", "Title and Image URL are required.");

        try {
            const res = await fetch(`${API_BASE_URL}/admin/offers/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOffer)
            });

            if (res.ok) {
                const data = await res.json();
                Alert.alert("Success", "Offer Created");
                setShowAddOffer(false);
                setNewOffer({ title: '', description: '', imageUrl: '', discountPercentage: '', couponCode: '' });
                fetchOffers(); // Explicitly fetch offers
            } else {
                console.error("Failed to create offer:", res.status, res.statusText);
                const errorData = await res.json();
                Alert.alert("Error", errorData.message || "Failed to create offer");
            }
        } catch (e) {
            Alert.alert("Error", "Create failed");
        }
    };

    const handleDeleteOffer = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/offers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchOffers(); // Explicitly fetch offers
            }
        } catch (e) { console.error(e); }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    const renderOverview = () => (
        <View style={styles.section}>
            <View style={styles.grid}>
                <StatCard title="Total Users" value={stats.totalUsers || 0} icon="people" color="#2196F3" />
                <StatCard title="Total Sellers" value={stats.totalSellers || 0} icon="storefront" color="#4CAF50" />
                <StatCard title="Orders" value={stats.totalOrders || 0} icon="cart" color="#FF9800" />
                <StatCard title="Revenue" value={`₹${stats.totalRevenue || 0}`} icon="wallet" color="#9C27B0" />
            </View>

            <View style={styles.pendingAlert}>
                <Feather name="alert-circle" size={24} color="#D32F2F" />
                <Text style={styles.pendingText}>
                    You have {stats.pendingSellers || 0} pending seller verifications.
                </Text>
                <TouchableOpacity onPress={() => setActiveTab('Verifications')}>
                    <Text style={styles.linkText}>View</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderVerifications = () => (
        <View style={styles.section}>
            {pendingSellers.length === 0 ? (
                <Text style={styles.emptyText}>No pending verifications.</Text>
            ) : (
                pendingSellers.map(seller => (
                    <View key={seller._id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{seller.businessName}</Text>
                            <Text style={styles.cardSub}>{seller.sellerName}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text>GSTIN: {seller.gstin || 'N/A'}</Text>
                            <Text>Type: {seller.accountType}</Text>
                            {seller.isVerified ? null : <Text style={{ color: 'orange', fontWeight: 'bold' }}>Status: Pending</Text>}
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D32F2F' }]} onPress={() => handleVerifySeller(seller._id, 'reject')}>
                                <Text style={styles.btnText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleVerifySeller(seller._id, 'approve')}>
                                <Text style={styles.btnText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const renderOffers = () => (
        <View style={styles.section}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddOffer(!showAddOffer)}>
                <Ionicons name={showAddOffer ? "close" : "add"} size={24} color="#fff" />
                <Text style={styles.addBtnText}>{showAddOffer ? "Cancel" : "Add New Offer"}</Text>
            </TouchableOpacity>

            {showAddOffer && (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>New Offer Details</Text>

                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {newOffer.imageUrl ? (
                            <Image source={{ uri: newOffer.imageUrl }} style={styles.uploadedImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="image-outline" size={30} color="#666" />
                                <Text style={styles.uploadText}>Select Offer Banner</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TextInput style={styles.input} placeholder="Offer Title (e.g. Summer Sale)" value={newOffer.title} onChangeText={t => setNewOffer({ ...newOffer, title: t })} />
                    <TextInput style={styles.input} placeholder="Description (Optional)" value={newOffer.description} onChangeText={t => setNewOffer({ ...newOffer, description: t })} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextInput style={[styles.input, { width: '48%' }]} placeholder="Discount %" keyboardType="numeric" value={newOffer.discountPercentage} onChangeText={t => setNewOffer({ ...newOffer, discountPercentage: t })} />
                        <TextInput style={[styles.input, { width: '48%' }]} placeholder="Coupon Code" value={newOffer.couponCode} onChangeText={t => setNewOffer({ ...newOffer, couponCode: t })} />
                    </View>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOffer}>
                        <Text style={styles.submitBtnText}>Create Offer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {offers.map(offer => (
                <View key={offer._id} style={styles.offerCard}>
                    <Image source={{ uri: offer.imageUrl }} style={styles.offerImg} resizeMode="cover" />
                    <View style={styles.offerInfo}>
                        <Text style={styles.offerTitle}>{offer.title}</Text>
                        <Text style={styles.offerCode}>Code: {offer.couponCode || 'None'}</Text>
                        <Text style={styles.offerDisc}>{offer.discountPercentage}% OFF</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteOffer(offer._id)}>
                        <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1a237e', '#283593']} style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
            </LinearGradient>

            <View style={styles.tabs}>
                {['Overview', 'Verifications', 'Offers'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? <ActivityIndicator size="large" color="#1a237e" /> : (
                    <>
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'Verifications' && renderVerifications()}
                        {activeTab === 'Offers' && renderOffers()}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, paddingTop: 10, paddingBottom: 20 },
    headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: 15 },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
    tab: { flex: 1, padding: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#1a237e' },
    tabText: { color: '#666', fontWeight: '600' },
    activeTabText: { color: '#1a237e' },
    content: { padding: 15 },
    section: { marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, flexDirection: 'row', alignItems: 'center' },
    iconBox: { padding: 8, borderRadius: 8, marginRight: 10 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statTitle: { fontSize: 12, color: '#666' },
    pendingAlert: { flexDirection: 'row', backgroundColor: '#FFEBEE', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    pendingText: { flex: 1, marginLeft: 10, color: '#D32F2F' },
    linkText: { fontWeight: 'bold', color: '#D32F2F', textDecorationLine: 'underline' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardHeader: { marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    cardSub: { color: '#666' },
    cardBody: { marginBottom: 15 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    actionBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, marginLeft: 10 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    addBtn: { flexDirection: 'row', backgroundColor: '#1a237e', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
    formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 3 },
    formTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
    submitBtn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontWeight: 'bold' },
    offerCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
    offerImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
    offerInfo: { flex: 1, marginLeft: 15 },
    offerTitle: { fontWeight: 'bold', fontSize: 16 },
    offerCode: { color: '#1976D2', fontWeight: '600', fontSize: 12 },
    offerDisc: { color: '#4CAF50', fontWeight: 'bold' },
    imagePicker: {
        height: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        color: '#666',
        fontWeight: '500',
    },
});

export default AdminDashboardScreen;
