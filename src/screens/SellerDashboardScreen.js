import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Dimensions, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { useNotifications } from '../context/NotificationContext';
import { wp, hp, normalize } from '../utils/responsive';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

// Reusable Components for Consistency
const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity
        style={styles.glassCard}
        activeOpacity={0.8}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.statContent}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    </TouchableOpacity>
);

const ActionButton = ({ icon, label, color, onPress, library = "Ionicons" }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.actionIconCircle, { backgroundColor: color + '10' }]}>
            {library === "MaterialCommunityIcons" ? (
                <MaterialCommunityIcons name={icon} size={26} color={color} />
            ) : (
                <Ionicons name={icon} size={26} color={color} />
            )}
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const SellerDashboardScreen = () => {
    const navigation = useNavigation();
    const { notifications } = useNotifications();
    const { formatPrice } = useCurrency(); // Use global currency formatter
    const { t } = useLanguage();

    const unreadSellerCount = Array.isArray(notifications) ? notifications.filter(n =>
        !n.isRead &&
        (['new_order', 'stock_low', 'return_request', 'payout', 'seller_info'].includes(n.type) ||
            (n?.message && n.message.toLowerCase().includes('order')))
    ).length : 0;

    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'reels'

    // Missing State Definitions
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [stats, setStats] = useState({ products: 0, earnings: 0, orders: 0, views: 0 });
    const [products, setProducts] = useState([]);
    const [verificationPending, setVerificationPending] = useState(false);
    const [sellerId, setSellerId] = useState(null);

    // Initial Alert to confirm update - REMOVED after verification
    React.useEffect(() => {
        // setTimeout(() => Alert.alert("Patch Applied", "Seller Dashboard Fixed v4 - OTA Success!"), 500);
    }, []);

    const fetchDashboardData = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const userStr = await AsyncStorage.getItem("userInfo");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const res = await fetch(`${API_BASE_URL}/seller/dashboard/${user._id}`);
            const data = await res.json();

            if (res.status === 403 && data.message === "Seller verification pending") {
                setVerificationPending(true);
                setSellerInfo(data.seller);
                setLoading(false);
                return;
            }

            if (res.ok) {
                setVerificationPending(false); // Reset if approved
                setSellerInfo(data.seller);
                setStats({
                    products: data.totalProducts || 0,
                    earnings: data.totalEarnings || 0,
                    orders: data.totalOrders || 0,
                    views: data.totalViews || 0
                });
                setSellerId(data.seller._id || data.seller.id);

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
            fetchDashboardData(true);
            const interval = setInterval(() => {
                fetchDashboardData(false); // Polling for realtime updates
            }, 10000);
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            t('closeBusiness'),
            t('deleteStoreConfirm'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('closeStore'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const res = await fetch(`${API_BASE_URL}/seller/${sellerId}`, { method: 'DELETE' });
                            if (res.ok) {
                                navigation.navigate("Profile");
                            }
                        } catch (error) {
                            Alert.alert(t('error'), t('networkError'));
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteProduct = async (itemId) => {
        Alert.alert(
            t('delete'),
            t('confirmRemove'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/products/${itemId}`, { method: 'DELETE' });
                            if (res.ok) {
                                // Remove from local state immediately
                                setProducts(prev => prev.filter(p => p._id !== itemId));
                                Alert.alert(t('success'), t('itemDeleted'));
                            } else {
                                Alert.alert(t('error'), t('somethingWentWrong'));
                            }
                        } catch (error) {
                            Alert.alert(t('error'), t('networkError'));
                        }
                    }
                }
            ]
        );
    };

    const myProducts = products.filter(p => !p.videoUrl);
    const myReels = products.filter(p => p.videoUrl);
    const currentList = activeTab === 'products' ? myProducts : myReels;

    const renderProductItem = (item) => (
        <View key={item._id} style={styles.productCard}>
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
            <View style={styles.productDetails}>
                <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatPrice ? formatPrice(item.price) : `₹${item.price}`}</Text>
                <View style={[styles.stockTag, { backgroundColor: item.stock < 10 ? '#FFEBEE' : '#E8F5E9' }]}>
                    <Text style={[styles.stockText, { color: item.stock < 10 ? '#D32F2F' : '#2E7D32' }]}>
                        {item.stock < 10 ? `${t('lowStock')}: ${item.stock}` : `${t('inStock')}: ${item.stock}`}
                    </Text>
                </View>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.editButton, { marginRight: 8 }]}
                    onPress={() => navigation.navigate('AddProduct', { isEdit: true, product: item, sellerId, mode: activeTab === 'reels' ? 'reel' : 'product' })}
                >
                    <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduct(item._id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    if (verificationPending) {
        return (
            <View style={styles.centeredContainer}>
                <MaterialCommunityIcons name="clock-alert-outline" size={80} color="#F59E0B" />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#1F2937' }}>Verification Pending</Text>
                <Text style={{ textAlign: 'center', marginHorizontal: 40, marginTop: 10, color: '#6B7280', fontSize: 16 }}>
                    Your business application for <Text style={{ fontWeight: 'bold' }}>{sellerInfo?.businessName}</Text> is currently under review by our Admin team.
                </Text>
                <Text style={{ textAlign: 'center', marginHorizontal: 40, marginTop: 5, color: '#6B7280', fontSize: 14 }}>
                    This process usually takes 24-48 hours.
                </Text>
                <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 30 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.primaryBtnText}>Go Back Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']} // Exact match to Analytics Screen
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }} // Strictly vertical for consistency
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Modern Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.screenTitle}>{t('sellerDashboard')}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={[styles.iconBtn, { marginRight: 8 }]} onPress={() => navigation.navigate('EditSellerProfile', { seller: sellerInfo })}>
                                <MaterialCommunityIcons name="store-cog" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('SellerNotification')}>
                                <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                                {unreadSellerCount > 0 && <View style={styles.notifBadge} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Minimal Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileImageContainer}>
                            {sellerInfo?.profileImage ? (
                                <Image source={{ uri: sellerInfo.profileImage }} style={styles.profileImageAvatar} />
                            ) : (
                                <Text style={styles.avatarText}>{sellerInfo?.businessName?.charAt(0)}</Text>
                            )}
                            {sellerInfo?.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <MaterialCommunityIcons name="check-decagram" size={14} color="#FFF" />
                                </View>
                            )}
                        </View>
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <Text style={styles.businessName}>{sellerInfo?.businessName}</Text>
                            <Text style={styles.businessId}>ID: {sellerId?.slice(-6).toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E50914']} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Key Metrics Grid */}
                    <Text style={styles.sectionHeader}>{t('performance')}</Text>
                    <View style={styles.gridContainer}>
                        <StatCard
                            icon="wallet"
                            title={t('totalEarnings')}
                            value={formatPrice ? formatPrice(stats?.earnings || 0) : `₹${stats?.earnings || 0}`}
                            color="#10B981"
                            onPress={() => navigation.navigate('SellerAnalytics', { sellerId })}
                        />
                        <StatCard icon="bag-handle" title={t('totalOrders')} value={stats?.orders || 0} color="#F59E0B" onPress={() => navigation.navigate('SellerOrders', { sellerId })} />
                        <StatCard icon="eye" title={t('storeViews')} value={stats?.views || 0} color="#8B5CF6" />
                        <StatCard icon="people" title={t('followers')} value={sellerInfo?.followers?.length || 0} color="#EC4899" onPress={() => navigation.navigate("FollowList", { id: sellerId, type: 'seller_followers', title: 'Followers' })} />
                    </View>

                    {/* Quick Action Grid */}
                    <Text style={[styles.sectionHeader, { marginTop: 10 }]}>{t('manageStore')}</Text>
                    <View style={styles.actionsGrid}>
                        <ActionButton icon="cube-outline" label={t('addItem')} color="#3B82F6" onPress={() => navigation.navigate('AddProduct', { sellerId, mode: 'product' })} />
                        <ActionButton icon="videocam-outline" label={t('addReel')} color="#EF4444" onPress={() => navigation.navigate('AddProduct', { sellerId, mode: 'reel' })} />
                        <ActionButton icon="chatbubbles-outline" label={t('messages')} color="#10B981" onPress={() => navigation.navigate('ChatList')} />
                        <ActionButton icon="megaphone-outline" label={t('promote')} color="#F97316" onPress={() => navigation.navigate('SellerPromote', { sellerId })} />
                        <ActionButton icon="analytics-outline" label={t('analytics')} color="#8B5CF6" onPress={() => navigation.navigate('SellerAnalytics', { sellerId })} />
                        <ActionButton icon="headset-outline" label={t('support')} color="#6366F1" onPress={() => navigation.navigate('SellerSupport', { sellerId })} />
                    </View>

                    {/* Content Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'products' && styles.activeTab]}
                            onPress={() => setActiveTab('products')}
                        >
                            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>{t('items')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'reels' && styles.activeTab]}
                            onPress={() => setActiveTab('reels')}
                        >
                            <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>{t('reelsTitle') || "Reels"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Product/Reel List */}
                    <View style={styles.listHeaderRow}>
                        <Text style={styles.sectionHeader}>{activeTab === 'products' ? t('inventory') || "Your Inventory" : t('yourReels') || "Your Reels"}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SellerProfile', { sellerId })}>
                            <Text style={styles.linkText}>{t('viewAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    {currentList.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name={activeTab === 'products' ? "cube-outline" : "videocam-outline"} size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>{activeTab === 'products' ? t('inventoryEmpty') : t('noReelsYet') || "No reels yet."}</Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AddProduct', { sellerId, mode: activeTab === 'products' ? 'product' : 'reel' })}>
                                <Text style={styles.primaryBtnText}>{activeTab === 'products' ? t('addProduct') : t('addReel')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        currentList.map((item) => renderProductItem(item))
                    )}

                    <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
                        <Text style={styles.dangerBtnText}>{t('closeBusinessAccount')}</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB'
    },
    header: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2.5),
    },
    iconBtn: {
        padding: 8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    screenTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#111827',
    },
    notifBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#FFF'
    },

    // Profile Identity Card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    profileImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    profileImageAvatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#10B981',
        borderRadius: 10,
        padding: 2,
        borderWidth: 2,
        borderColor: '#FFF'
    },
    businessName: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2
    },
    businessId: {
        fontSize: normalize(12),
        color: '#6B7280',
        fontWeight: '500'
    },

    scrollContainer: {
        paddingHorizontal: wp(5),
    },
    sectionHeader: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#374151',
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    // Premium Glass Card
    glassCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFF',
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    iconContainer: {
        padding: 10,
        borderRadius: 14,
        marginBottom: 12,
        alignSelf: 'flex-start'
    },
    statValue: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 2,
    },
    statTitle: {
        fontSize: normalize(12),
        color: '#6B7280',
        fontWeight: '600'
    },

    // Action Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        width: '31%',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: normalize(11),
        fontWeight: '600',
        color: '#4B5563'
    },

    // Products
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    linkText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: normalize(13)
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#F3F4F6'
    },
    productDetails: {
        flex: 1,
        marginLeft: 16,
    },
    productTitle: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4
    },
    productPrice: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 4
    },
    stockTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    stockText: {
        fontSize: 10,
        fontWeight: '700'
    },
    editButton: {
        padding: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
    },

    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 24,
        marginBottom: 20
    },
    emptyText: {
        fontSize: normalize(14),
        color: '#64748B',
        marginVertical: 12,
        fontWeight: '500'
    },
    primaryBtn: {
        backgroundColor: '#111827',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: normalize(13)
    },
    dangerBtn: {
        marginTop: 10,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20
    },
    dangerBtnText: {
        color: '#9CA3AF',
        fontSize: normalize(12),
        fontWeight: '600'
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#E50914',
    },
    tabText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFF',
        fontWeight: '700',
    },
    // Action Row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#EF4444',
        borderRadius: 12,
    },
});

export default SellerDashboardScreen;
