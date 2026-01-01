import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, normalize } from '../utils/responsive';

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
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={normalize(22)} color={color} />
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
                <Feather name="alert-circle" size={normalize(24)} color="#D32F2F" />
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
                            <Text style={styles.cardText}>GSTIN: {seller.gstin || 'N/A'}</Text>
                            <Text style={styles.cardText}>Type: {seller.accountType}</Text>
                            {seller.isVerified ? null : <Text style={styles.statusPending}>Status: Pending</Text>}
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => handleVerifySeller(seller._id, 'reject')}>
                                <Text style={[styles.btnText, { color: '#D32F2F' }]}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => handleVerifySeller(seller._id, 'approve')}>
                                <Text style={[styles.btnText, { color: '#388E3C' }]}>Approve</Text>
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
                <Ionicons name={showAddOffer ? "close" : "add"} size={normalize(22)} color="#fff" />
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
                                <Ionicons name="image-outline" size={normalize(30)} color="#888" />
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
                    <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDeleteOffer(offer._id)}>
                        <Ionicons name="trash-outline" size={normalize(20)} color="#fff" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <View style={{ width: normalize(24) }} />
                </View>

                {/* Glassmorphic Tabs */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                        {['Overview', 'Verifications', 'Offers'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? <ActivityIndicator size="large" color="#555" style={{ marginTop: hp(10) }} /> : (
                        <>
                            {activeTab === 'Overview' && renderOverview()}
                            {activeTab === 'Verifications' && renderVerifications()}
                            {activeTab === 'Offers' && renderOffers()}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingVertical: hp(2),
        paddingHorizontal: wp(5),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: normalize(20),
        color: '#333',
        fontWeight: '700',
    },
    tabsContainer: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingVertical: hp(1),
    },
    tabsScroll: {
        paddingHorizontal: wp(4),
    },
    tab: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(1),
        borderRadius: 20,
        marginRight: wp(2),
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeTab: {
        backgroundColor: '#333',
        borderColor: '#333',
    },
    tabText: {
        color: '#555',
        fontWeight: '600',
        fontSize: normalize(14),
    },
    activeTabText: {
        color: '#fff',
    },
    content: {
        padding: wp(4),
        paddingBottom: hp(15),
    },
    section: {
        marginBottom: hp(3),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: wp(4),
        borderRadius: 16,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        padding: wp(2),
        borderRadius: 10,
        marginRight: wp(3),
    },
    statValue: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    statTitle: {
        fontSize: normalize(12),
        color: '#666',
        marginTop: 2,
    },
    pendingAlert: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,235,238,0.9)',
        padding: wp(4),
        borderRadius: 12,
        alignItems: 'center',
        marginTop: hp(1),
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    pendingText: {
        flex: 1,
        marginLeft: wp(3),
        color: '#D32F2F',
        fontSize: normalize(14),
    },
    linkText: {
        fontWeight: 'bold',
        color: '#D32F2F',
        textDecorationLine: 'underline',
        fontSize: normalize(14),
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: hp(4),
        fontSize: normalize(16),
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: wp(4),
        borderRadius: 16,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: hp(1),
    },
    cardTitle: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
    },
    cardSub: {
        color: '#666',
        fontSize: normalize(13),
        marginTop: 2,
    },
    cardBody: {
        marginBottom: hp(2),
    },
    cardText: {
        color: '#555',
        fontSize: normalize(14),
        marginBottom: 4,
    },
    statusPending: {
        color: '#F57C00',
        fontWeight: 'bold',
        fontSize: normalize(14),
        marginTop: 4,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: 8,
        marginLeft: wp(3),
    },
    btnText: {
        fontWeight: '600',
        fontSize: normalize(14),
    },
    addBtn: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingVertical: hp(1.5),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2.5),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: wp(2),
        fontSize: normalize(16),
    },
    formCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: wp(4),
        borderRadius: 16,
        marginBottom: hp(3),
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    formTitle: {
        fontWeight: 'bold',
        fontSize: normalize(16),
        marginBottom: hp(2),
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: wp(3.5),
        marginBottom: hp(1.5),
        fontSize: normalize(14),
        backgroundColor: '#f9f9f9',
    },
    submitBtn: {
        backgroundColor: '#4CAF50',
        padding: hp(1.5),
        borderRadius: 10,
        alignItems: 'center',
        marginTop: hp(1),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(16),
    },
    offerCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 12,
        padding: wp(3),
        marginBottom: hp(1.5),
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    offerImg: {
        width: wp(16),
        height: wp(16),
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    offerInfo: {
        flex: 1,
        marginLeft: wp(4),
    },
    offerTitle: {
        fontWeight: 'bold',
        fontSize: normalize(15),
        color: '#333',
    },
    offerCode: {
        color: '#1976D2',
        fontWeight: '500',
        fontSize: normalize(13),
        marginTop: 2,
    },
    offerDisc: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: normalize(13),
        marginTop: 2,
    },
    imagePicker: {
        height: hp(18),
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginBottom: hp(2),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        color: '#888',
        fontWeight: '500',
        fontSize: normalize(14),
    },
    deleteIcon: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#D32F2F',
        marginLeft: 10,
        elevation: 2,
    }
});

export default AdminDashboardScreen;
