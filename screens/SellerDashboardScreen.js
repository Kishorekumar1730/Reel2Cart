import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    </View>
);

const SellerDashboardScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sellerId, setSellerId] = useState(null);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [stats, setStats] = useState({ products: 0, earnings: 0, orders: 0, views: 0 });
    const [products, setProducts] = useState([]);

    const fetchDashboardData = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const userStr = await AsyncStorage.getItem("userInfo");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            // Fetch Dashboard Stats
            const res = await fetch(`${API_BASE_URL}/seller/dashboard/${user._id}`);
            const data = await res.json();

            if (res.ok) {
                setSellerInfo(data.seller);
                setStats(data.stats);
                setSellerId(data.seller._id || data.seller.id);

                // Fetch Products
                const prodRes = await fetch(`${API_BASE_URL}/products/seller/${data.seller._id || data.seller.id}`);
                const prodData = await prodRes.json();
                if (prodRes.ok) setProducts(prodData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData(true); // Initial load with spinner if first time

            // Silent poll every 10 seconds for real-time stats (Orders, Earnings, etc.)
            const interval = setInterval(() => {
                fetchDashboardData(false);
            }, 10000);

            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleDelete = async (productId) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                                method: 'DELETE'
                            });
                            if (res.ok) {
                                fetchDashboardData(); // Refresh list
                            } else {
                                Alert.alert("Error", "Could not delete product.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Delete Business Account",
            "Are you sure you want to permanently delete your seller account? All your products and data will be removed. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Forever",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const res = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
                                method: 'DELETE'
                            });

                            if (res.ok) {
                                Alert.alert("Account Deleted", "Your seller account has been removed.");
                                navigation.navigate("Profile"); // Go back to profile or home
                            } else {
                                Alert.alert("Error", "Could not delete account.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderProductItem = (item) => (
        <View key={item._id} style={styles.productItem}>
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <View style={styles.stockBadge}>
                    <Text style={styles.stockText}>Stock: {item.stock}</Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('AddProduct', { isEdit: true, product: item, sellerId })}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={22} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconBtn, { marginLeft: 10 }]}
                    onPress={() => handleDelete(item._id)}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#D32F2F" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={["#1a1a1a", "#000"]} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Seller Dashboard</Text>

                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => navigation.navigate('EditSellerProfile', { seller: sellerInfo })} style={{ marginRight: 15 }}>
                            <MaterialCommunityIcons name="store-edit-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                    </View>
                </View>

                <View style={styles.shopProfile}>
                    <View style={[styles.profileIcon, sellerInfo?.profileImage && { borderWidth: 0, backgroundColor: 'transparent' }]}>
                        {sellerInfo?.profileImage ? (
                            <Image
                                source={{ uri: sellerInfo.profileImage }}
                                style={{ width: 60, height: 60, borderRadius: 30 }}
                            />
                        ) : (
                            <Text style={styles.profileInitial}>{sellerInfo?.businessName?.charAt(0)}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={styles.shopName}>{sellerInfo?.businessName}</Text>
                        {sellerInfo?.description ? (
                            <Text style={styles.shopDesc} numberOfLines={1}>{sellerInfo.description}</Text>
                        ) : null}
                        <View style={styles.verifyBadge}>
                            <MaterialCommunityIcons
                                name={sellerInfo?.isVerified ? "check-decagram" : "clock-outline"}
                                size={14}
                                color={sellerInfo?.isVerified ? "#4CAF50" : "#FFA000"}
                            />
                            <Text style={[styles.verifyText, { color: sellerInfo?.isVerified ? "#4CAF50" : "#FFA000" }]}>
                                {sellerInfo?.isVerified ? "Verified Seller" : "Verification Pending"}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E50914']} />}
            >
                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard icon="wallet-outline" title="Total Earnings" value={`₹${stats.earnings}`} color="#4CAF50" />
                    <StatCard icon="cube-outline" title="Products" value={stats.products} color="#2196F3" />
                    <StatCard icon="cart-outline" title="Orders" value={stats.orders} color="#FF9800" />
                    <StatCard icon="eye-outline" title="Store Views" value={stats.views} color="#9C27B0" />

                    <TouchableOpacity
                        style={[styles.statCard, { width: '48%' }]}
                        onPress={() => navigation.navigate("FollowList", { id: sellerId, type: 'seller_followers', title: 'My Followers' })}
                    >
                        <View style={[styles.statCardInner, { borderLeftColor: '#E91E63', borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#E91E63' + '20' }]}>
                                <Ionicons name="people" size={24} color="#E91E63" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{sellerInfo?.followers?.length || 0}</Text>
                                <Text style={styles.statTitle}>Followers</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statCard, { width: '48%' }]}
                        onPress={() => navigation.navigate("FollowList", { id: sellerId, type: 'seller_following', title: 'Following' })}
                    >
                        <View style={[styles.statCardInner, { borderLeftColor: '#3F51B5', borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#3F51B5' + '20' }]}>
                                <Ionicons name="person-add" size={24} color="#3F51B5" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{sellerInfo?.following?.length || 0}</Text>
                                <Text style={styles.statTitle}>Following</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={[styles.actionsContainer, { flexWrap: 'wrap' }]}>
                    <TouchableOpacity style={[styles.actionBtn, { marginBottom: 15 }]} onPress={() => navigation.navigate('ChatList')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="chatbubbles-outline" size={28} color="#1E88E5" />
                        </View>
                        <Text style={styles.actionText}>Messages</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { marginBottom: 15 }]} onPress={() => navigation.navigate('AddProduct', { sellerId, mode: 'product' })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                            <Ionicons name="cube-outline" size={28} color="#E50914" />
                        </View>
                        <Text style={styles.actionText}>Add Product</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { marginBottom: 15 }]} onPress={() => navigation.navigate('AddProduct', { sellerId, mode: 'reel' })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E0F7FA' }]}>
                            <Ionicons name="videocam-outline" size={28} color="#00BCD4" />
                        </View>
                        <Text style={styles.actionText}>Upload Reel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { marginBottom: 15 }]} onPress={() => navigation.navigate('SellerOrders', { sellerId })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="list" size={28} color="#1976D2" />
                        </View>
                        <Text style={styles.actionText}>Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SellerAnalytics', { sellerId })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                            <Ionicons name="analytics" size={28} color="#7B1FA2" />
                        </View>
                        <Text style={styles.actionText}>Analytics</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SellerPromote', { sellerId })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="megaphone-outline" size={28} color="#FF9800" />
                        </View>
                        <Text style={styles.actionText}>Promote</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SellerSupport', { sellerId })}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="headset-outline" size={28} color="#4CAF50" />
                        </View>
                        <Text style={styles.actionText}>Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Products List */}
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>My Products</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {products.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png' }}
                            style={{ width: 100, height: 100, opacity: 0.5, marginBottom: 10 }}
                        />
                        <Text style={styles.emptyText}>No products added yet.</Text>
                        <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('AddProduct', { sellerId })}>
                            <Text style={styles.addFirstText}>Add Your First Product</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    products.map((item) => renderProductItem(item))
                )}

                <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Danger Zone</Text>
                    <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteAccountText}>Delete Business Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Light grey background for professional look
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    shopProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInitial: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    shopName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    shopDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    verifyText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconBox: {
        padding: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statTitle: {
        fontSize: 12,
        color: '#666',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    actionBtn: {
        backgroundColor: '#fff',
        width: '31%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    seeAll: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
    },
    productItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        elevation: 1,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    productInfo: {
        flex: 1,
        marginLeft: 15,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    productPrice: {
        fontSize: 14,
        color: '#E50914',
        fontWeight: 'bold',
        marginTop: 2,
    },
    stockBadge: {
        backgroundColor: '#F5F5F5',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    stockText: {
        fontSize: 10,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 5,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginBottom: 15,
    },
    addFirstBtn: {
        backgroundColor: '#E50914',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addFirstText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dangerZone: {
        marginTop: 40,
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 20,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 10,
    },
    deleteAccountBtn: {
        backgroundColor: '#D32F2F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
    },
    deleteAccountText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 14,
    },
});

export default SellerDashboardScreen;
