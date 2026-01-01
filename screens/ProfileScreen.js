import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Switch, Alert, Platform, TouchableOpacity } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { CommonActions } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { unreadCount } = useNotifications();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(false); // For push notifications toggle

    const [isSeller, setIsSeller] = useState(false);

    const fetchUserAndStats = async () => {
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            if (stored) {
                const user = JSON.parse(stored);
                setUserInfo(user);

                // Fetch Stats
                try {
                    const response = await fetch(`${API_BASE_URL}/user/${user._id}/stats`);
                    const data = await response.json();
                    if (response.ok) {
                        setStats(data);
                    }
                } catch (err) {
                    console.log("Error fetching stats", err);
                }

                // Check Seller Status
                try {
                    // We check dashboard access - if 200 OK, they are a seller
                    const sellerRes = await fetch(`${API_BASE_URL}/seller/dashboard/${user._id}`);
                    if (sellerRes.ok) {
                        setIsSeller(true);
                    } else {
                        setIsSeller(false);
                    }
                } catch (err) {
                    setIsSeller(false);
                }
            }
        } catch (e) {
            console.log('Error fetching user', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUserAndStats();
        }, [])
    );

    const [stats, setStats] = useState({ orderCount: 0, wishlistCount: 0, couponCount: 0 });
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    const handleLogout = () => {
        Alert.alert(
            t('logout'),
            t('logoutConfirm'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('userInfo');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Open' }],
                            });
                        } catch (e) {
                            console.log('Logout error', e);
                        }
                    }
                }
            ]
        );
    };

    const QuickAction = ({ icon, label, onPress, color }) => (
        <AnimatedButton style={styles.quickActionItem} onPress={onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.quickActionText}>{label}</Text>
        </AnimatedButton>
    );

    const MenuItem = ({ icon, label, subLabel, onPress, color = '#333' }) => (
        <AnimatedButton style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f5f5f5' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>{label}</Text>
                    {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
                </View>
            </View>
            {label === t('notifications') && unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </AnimatedButton>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Guest Logic */}
                    {(!userInfo || userInfo.isGuest) && (
                        <View style={styles.guestContainer}>
                            <Ionicons name="person-circle-outline" size={80} color="#ccc" style={{ marginBottom: 10 }} />
                            <Text style={styles.guestTitle}>{t('welcomeToReel2Cart')}</Text>
                            <Text style={styles.guestSubtitle}>{t('guestProfileSubtitle')}</Text>

                            <AnimatedButton
                                style={styles.guestLoginBtn}
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.reset({
                                            index: 0,
                                            routes: [{ name: 'Login' }],
                                        })
                                    );
                                }}
                            >
                                <Text style={styles.guestLoginText}>{t('signInJoin')}</Text>
                            </AnimatedButton>

                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{t('legalSupport')}</Text>
                                <MenuItem icon="document-text-outline" label={t('terms')} onPress={() => { }} />
                                <MenuItem icon="shield-checkmark-outline" label={t('privacy')} onPress={() => { }} />
                                <MenuItem icon="help-circle-outline" label={t('help')} onPress={() => navigation.navigate('Help')} />
                            </View>
                        </View>
                    )}

                    {/* Authenticated User Content */}
                    {userInfo && !userInfo.isGuest && (
                        <>
                            {/* ... Header and Stats ... */}
                            <View style={styles.header}>
                                <View style={styles.headerContent}>
                                    <View style={styles.profileSection}>
                                        <View style={styles.avatarContainer}>
                                            {userInfo?.profileImage ? (
                                                <Image source={{ uri: userInfo.profileImage }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                                            ) : (
                                                <Text style={styles.avatarText}>
                                                    {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : (userInfo?.email ? userInfo.email.charAt(0).toUpperCase() : 'U')}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>
                                                {t('hello')}, {userInfo?.name || (userInfo?.email ? userInfo.email.split('@')[0] : t('user'))}
                                            </Text>
                                            <Text style={styles.userEmail}>{userInfo?.email}</Text>
                                        </View>
                                    </View>
                                    <AnimatedButton style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
                                        <Feather name="edit-2" size={20} color="#555" />
                                    </AnimatedButton>
                                </View>

                                <View style={styles.statsContainer}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{stats.orderCount}</Text>
                                        <Text style={styles.statLabel}>{t('orders')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{stats.wishlistCount}</Text>
                                        <Text style={styles.statLabel}>{t('wishlist')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statNumber}>{stats.couponCount}</Text>
                                        <Text style={styles.statLabel}>{t('coupons')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <TouchableOpacity
                                        style={styles.statItem}
                                        onPress={() => userInfo?._id && navigation.navigate("FollowList", { id: userInfo._id, type: 'user_following', title: 'Following' })}
                                    >
                                        <Text style={styles.statNumber}>{stats.followingCount || 0}</Text>
                                        <Text style={styles.statLabel}>{t('following')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Quick Actions Grid */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
                                <View style={styles.quickActionsGrid}>
                                    <QuickAction
                                        icon="cube-outline"
                                        label={t('orders')}
                                        color="#2196F3"
                                        onPress={() => navigation.navigate('Orders')}
                                    />
                                    <QuickAction
                                        icon="heart-outline"
                                        label={t('wishlist')}
                                        color="#E91E63"
                                        onPress={() => navigation.navigate('Favourite')}
                                    />
                                    <QuickAction
                                        icon="card-outline"
                                        label={t('payments')}
                                        color="#4CAF50"
                                        onPress={() => navigation.navigate('PaymentMethod')}
                                    />
                                    <QuickAction
                                        icon="headset-outline"
                                        label={t('help')}
                                        color="#FF9800"
                                        onPress={() => navigation.navigate('Help')}
                                    />
                                </View>
                            </View>

                            {/* Admin Panel - Only for Owner */}
                            {(userInfo?.email === 'shopflix2025@gmail.com' || userInfo?.role === 'admin') && (
                                <View style={[styles.sectionContainer, { borderColor: '#1a237e', borderWidth: 1 }]}>
                                    <Text style={[styles.sectionTitle, { color: '#1a237e' }]}>{t('administration') || 'Administration'}</Text>
                                    <MenuItem
                                        icon="shield-checkmark"
                                        label={t('adminDashboard')}
                                        subLabel={t('adminDashboardSubtitle')}
                                        onPress={() => navigation.navigate('AdminDashboard')}
                                        color="#1a237e"
                                    />
                                </View>
                            )}

                            {/* Sell on ShopFlix - Dynamic Section */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{isSeller ? t('myBusiness') : t('workWithReel2Cart')}</Text>

                                {isSeller ? (
                                    <MenuItem
                                        icon="analytics-outline"
                                        label={t('sellerDashboard')}
                                        subLabel={t('manageOrdersProducts')}
                                        onPress={() => navigation.navigate('SellerDashboard')}
                                        color="#E50914"
                                    />
                                ) : (
                                    <MenuItem
                                        icon="briefcase-outline"
                                        label={t('createFreeBusinessAccount')}
                                        subLabel={t('reachMillions')}
                                        onPress={() => navigation.navigate('SellerOnboarding')}
                                        color="#E50914"
                                    />
                                )}

                                <MenuItem
                                    icon="bicycle-outline"
                                    label={t('deliveryPartnerHub') || "Delivery Partner Hub"}
                                    subLabel={t('deliverEarn') || "Deliver orders & earn money"}
                                    onPress={() => navigation.navigate('DeliveryDashboard')}
                                    color="#4CAF50"
                                />
                            </View>

                            {/* Account Settings */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{t('accountSettings')}</Text>
                                <MenuItem
                                    icon="location-outline"
                                    label={t('yourAddresses')}
                                    subLabel={t('manageAddress')}
                                    onPress={() => navigation.navigate('Address')}
                                />
                                <MenuItem
                                    icon="lock-closed-outline"
                                    label={t('loginSecurity')}
                                    subLabel={t('password2FA')}
                                    onPress={() => navigation.navigate('LoginSecurity')}
                                />
                                <MenuItem
                                    icon="notifications-outline"
                                    label={t('notifications')}
                                    subLabel={t('offersOrderUpdates')}
                                    onPress={() => navigation.navigate('NotificationList')}
                                />
                                <MenuItem
                                    icon="language-outline"
                                    label={t('language')}
                                    subLabel={t('langSubtitle')}
                                    onPress={() => navigation.navigate('Language', { fromSettings: true })}
                                />
                            </View>

                            {/* Legal & Support */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{t('legalSupport')}</Text>
                                <MenuItem
                                    icon="document-text-outline"
                                    label={t('terms')}
                                    onPress={() => { }}
                                />
                                <MenuItem
                                    icon="shield-checkmark-outline"
                                    label={t('privacy')}
                                    onPress={() => { }}
                                />
                            </View>

                            {/* Logout Button */}
                            <AnimatedButton style={styles.logoutButton} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                                <Text style={styles.logoutText}>{t('logout')}</Text>
                            </AnimatedButton>
                        </>
                    )}

                    <Text style={styles.versionText}>{t('version') || 'Version'} 1.0.0</Text>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        paddingBottom: 110,
    },
    header: {
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    avatarText: {
        fontSize: normalize(28),
        fontWeight: 'bold',
        color: '#E50914',
    },
    userInfo: {
        justifyContent: 'center',
    },
    userName: {
        fontSize: normalize(20),
        fontWeight: '800',
        color: '#111',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: normalize(14),
        color: '#666',
        fontWeight: '500',
    },
    editButton: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    statItem: {
        alignItems: 'center',
        flex: 1, // Ensure equal width allocation
        paddingHorizontal: 2,
    },
    statNumber: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#111',
    },
    statLabel: {
        fontSize: normalize(12),
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
        lineHeight: normalize(14), // Improve stacking
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '70%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
    },
    sectionContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 5,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionItem: {
        alignItems: 'center',
        width: '23%',
    },
    quickActionIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: normalize(11),
        color: '#555',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: normalize(14),
        paddingHorizontal: 2,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextContainer: {
        justifyContent: 'center',
        flex: 1, // Ensure text container takes available space
        paddingRight: 10, // Prevent text touching the arrow
    },
    menuLabel: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#333',
        lineHeight: normalize(20), // Better spacing for wrapped text
    },
    menuSubLabel: {
        fontSize: normalize(12),
        color: '#888',
        marginTop: 2,
        lineHeight: normalize(16), // Better spacing
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 10,
        backgroundColor: '#fff',
        paddingVertical: 15,
        marginHorizontal: 15,
        borderRadius: 30,
        elevation: 2,
    },
    logoutText: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#E50914',
        marginLeft: 8,
    },
    badge: {
        backgroundColor: '#E50914',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: normalize(10),
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: normalize(12),
        marginBottom: 20,
        marginTop: 10,
    },
    guestContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: hp(10),
        paddingHorizontal: wp(5),
    },
    guestTitle: {
        fontSize: normalize(22),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    guestSubtitle: {
        fontSize: normalize(14),
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: normalize(24),
    },
    guestLoginBtn: {
        backgroundColor: '#E50914',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        elevation: 3,
        marginBottom: 30
    },
    guestLoginText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
});
