import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    FlatList, ScrollView, Dimensions, ActivityIndicator, StatusBar, Platform, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SellerProfileScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { sellerId } = route.params;

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reels, setReels] = useState([]);
    const [stats, setStats] = useState({ followers: 0, following: 0, products: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [currentUserId, setCurrentUserId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const userStr = await AsyncStorage.getItem("userInfo");
                if (userStr) {
                    setCurrentUserId(JSON.parse(userStr)._id);
                }
                fetchSellerProfile();
            };
            init();
        }, [sellerId])
    );

    const fetchSellerProfile = async () => {
        try {
            if (!seller && !refreshing) setLoading(true);

            const res = await fetch(`${API_BASE_URL}/seller/profile/${sellerId}/public`);
            const data = await res.json();

            if (res.ok) {
                setSeller(data.seller);
                // Ensure products/reels are fresh
                setProducts(data.products || []);
                setReels(data.reels || []);
                setStats(data.stats);

                const userStr = await AsyncStorage.getItem("userInfo");
                if (userStr) {
                    const uid = JSON.parse(userStr)._id;
                    if (data.seller.followers.includes(uid)) {
                        setIsFollowing(true);
                    } else {
                        setIsFollowing(false);
                    }
                }
            }
        } catch (error) {
            console.error("Fetch Profile Error", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSellerProfile();
    }, [sellerId]);

    const handleFollowToggle = async () => {
        if (!currentUserId) {
            alert(t('pleaseLoginToFollow'));
            return;
        }

        setIsFollowing(!isFollowing);
        setStats(prev => ({
            ...prev,
            followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));

        try {
            const res = await fetch(`${API_BASE_URL}/seller/follow/${sellerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            });
            if (!res.ok) {
                setIsFollowing(!isFollowing);
                setStats(prev => ({
                    ...prev,
                    followers: isFollowing ? prev.followers - 1 : prev.followers + 1
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderGridItem = ({ item, index }) => {
        // Safe access to counts
        const viewsCount = item.views || 0;
        const likesCount = item.likes ? item.likes.length : 0;

        return (
            <TouchableOpacity
                style={styles.gridItem}
                activeOpacity={0.8}
                onPress={() => {
                    if (activeTab === 'reels') {
                        // Navigate to reels with context
                        // Enrich reels with deep seller info for smooth transition
                        const enrichedReels = reels.map(r => ({ ...r, sellerId: seller }));
                        navigation.push("ReelsScreen", {
                            initialReels: enrichedReels,
                            initialIndex: index
                        });
                    } else {
                        navigation.navigate("ProductDetails", { product: item });
                    }
                }}
            >
                <Image
                    source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }}
                    style={styles.gridImage}
                />

                {/* Realtime Stats Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gridOverlay}
                >
                    <View style={styles.statRow}>
                        <View style={styles.statIconBadge}>
                            <Ionicons
                                name={activeTab === 'reels' ? "play" : "eye"}
                                size={12}
                                color="#fff"
                            />
                            <Text style={styles.statText}>{viewsCount}</Text>
                        </View>

                        <View style={styles.statIconBadge}>
                            <Ionicons name="heart" size={12} color="#fff" />
                            <Text style={styles.statText}>{likesCount}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!seller) {
        return (
            <View style={styles.center}>
                <Text style={{ color: '#64748B' }}>{t('sellerNotFound')}</Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <SafeAreaView style={styles.container}>
                {/* Header - Glassmorphic to match SellerOrdersScreen */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={normalize(24)} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('sellerProfile')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} tintColor="#4F46E5" />
                    }
                >

                    {/* Floating Profile Card - Glassmorphic */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileTopRow}>
                            <View style={styles.avatarContainer}>
                                {seller.profileImage ? (
                                    <Image source={{ uri: seller.profileImage }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarText}>{seller.businessName.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.statsContainer}>
                                <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => setActiveTab('products')}>
                                    <Text style={styles.statNumber}>{stats.products + stats.reels}</Text>
                                    <Text style={styles.statLabel}>{t('posts')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.statItem}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        navigation.navigate('FollowList', {
                                            id: seller._id,
                                            type: 'seller_followers',
                                            title: 'Followers'
                                        });
                                    }}
                                >
                                    <Text style={styles.statNumber}>{stats.followers}</Text>
                                    <Text style={styles.statLabel}>{t('followers')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.statItem}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        navigation.navigate('FollowList', {
                                            id: seller._id,
                                            type: 'seller_following',
                                            title: 'Following'
                                        });
                                    }}
                                >
                                    <Text style={styles.statNumber}>{stats.following}</Text>
                                    <Text style={styles.statLabel}>{t('following')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.nameRow}>
                                <Text style={styles.businessNameText}>{seller.businessName}</Text>
                                {seller.isVerified && (
                                    <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" style={{ marginLeft: 6 }} />
                                )}
                            </View>
                            <Text style={styles.sellerHandle}>{seller.sellerName}</Text>
                            {seller.description ? (
                                <Text style={styles.bioText} numberOfLines={3}>{seller.description}</Text>
                            ) : null}
                        </View>

                        <View style={styles.actionRow}>
                            {currentUserId && (String(seller.userId?._id || seller.userId) === String(currentUserId)) ? (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.secondaryBtn]}
                                    onPress={() => navigation.navigate("EditSellerProfile", { userId: currentUserId })}
                                    activeOpacity={0.9}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="account-edit-outline" size={20} color="#334155" style={{ marginRight: 8 }} />
                                        <Text style={styles.secondaryBtnText}>{t('editProfile')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, isFollowing ? styles.followingBtn : styles.primaryBtn]}
                                        onPress={handleFollowToggle}
                                        activeOpacity={0.9}
                                    >
                                        {isFollowing ? (
                                            <Text style={[styles.actionBtnText, { color: '#334155' }]}>{t('following')}</Text>
                                        ) : (
                                            <LinearGradient
                                                colors={['#FF416C', '#FF4B2B']}
                                                style={styles.gradientBtnFull}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t('follow')}</Text>
                                            </LinearGradient>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.secondaryBtn, { marginLeft: 12 }]}
                                        onPress={() => {
                                            if (!currentUserId) {
                                                alert(t('pleaseLogin'));
                                                return;
                                            }
                                            const recId = (seller.userId && seller.userId._id) ? seller.userId._id : seller.userId;
                                            navigation.navigate("Chat", {
                                                receiverId: recId,
                                                receiverName: seller.businessName
                                            });
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={styles.secondaryBtnText}>{t('message')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                            onPress={() => setActiveTab('products')}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name="grid"
                                size={normalize(24)}
                                color={activeTab === 'products' ? '#E50914' : '#94A3B8'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
                            onPress={() => setActiveTab('reels')}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name="movie-play"
                                size={normalize(24)}
                                color={activeTab === 'reels' ? '#E50914' : '#94A3B8'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Grid Content */}
                    <View style={styles.gridContainer}>
                        {activeTab === 'products' ? (
                            products.length > 0 ? (
                                products.map((item, index) => (
                                    <View key={index} style={styles.gridWrapper}>
                                        {renderGridItem({ item, index })}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyTab}>
                                    <MaterialCommunityIcons name="cube-outline" size={normalize(40)} color="#CBD5E1" />
                                    <Text style={styles.emptyText}>{t('noProductsYet')}</Text>
                                </View>
                            )
                        ) : (
                            reels.length > 0 ? (
                                reels.map((item, index) => (
                                    <View key={index} style={styles.gridWrapper}>
                                        {renderGridItem({ item, index })}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyTab}>
                                    <MaterialCommunityIcons name="video-off-outline" size={normalize(40)} color="#CBD5E1" />
                                    <Text style={styles.emptyText}>{t('noReelsYet')}</Text>
                                </View>
                            )
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default SellerProfileScreen;

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: 'rgba(255,255,255,0.4)', // Glassmorphism Header
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        paddingBottom: hp(5),
    },

    // Profile Card - Glassmorphism Restored
    profileCard: {
        marginHorizontal: wp(4),
        marginTop: hp(2),
        marginBottom: hp(3),
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glassy
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#fff', // White border, not grey
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, // Soft shadow
        shadowRadius: 15,
        elevation: 4,
    },
    profileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        marginRight: 20,
        // Soft avatar shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarText: {
        color: '#fff',
        fontSize: normalize(32),
        fontWeight: '700',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: 0, // Removed padding to maximize space
    },
    statItem: {
        flex: 1, // Distribute space equally
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    statNumber: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: normalize(10), // Reduced font size for long text
        color: '#64748B',
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center', // Center align text
        lineHeight: normalize(14),
    },

    // Info
    infoSection: {
        marginBottom: 24,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessNameText: {
        fontSize: normalize(22),
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
        flexShrink: 1,
    },
    sellerHandle: {
        fontSize: normalize(14),
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 10
    },
    bioText: {
        fontSize: normalize(14),
        color: '#475569',
        lineHeight: 22,
        fontWeight: '400'
    },

    // Actions - with consistent depth
    actionRow: {
        flexDirection: 'row',
    },
    actionBtn: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    primaryBtn: {
        backgroundColor: '#fff',
        shadowColor: "#FF4B2B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientBtnFull: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    followingBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryBtn: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#94A3B8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    actionBtnText: {
        fontSize: normalize(14),
        fontWeight: '600',
    },
    secondaryBtnText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#334155'
    },

    // Tabs - Clean
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: wp(6),
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: wp(2),
    },
    gridWrapper: {
        width: (width - wp(4)) / 3,
        height: ((width - wp(4)) / 3) * 1.6, // Portrait Aspect Ratio
        padding: 4,
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    // Stats Overlay
    gridOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    statIconBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statText: {
        color: '#fff',
        fontSize: normalize(11),
        marginLeft: 4,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    emptyTab: {
        width: '100%',
        padding: hp(8),
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        marginTop: 12,
        fontSize: normalize(14),
        fontWeight: '500'
    }
});
