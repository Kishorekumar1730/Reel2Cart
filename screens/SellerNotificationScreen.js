import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, wp, hp } from '../utils/responsive';
import { useNotifications } from '../context/NotificationContext';

const SellerNotificationScreen = ({ navigation }) => {
    const { notifications, loading, fetchNotifications, markAllAsRead } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [fetchNotifications])
    );

    // Filter for Seller-specific notifications
    // Assuming 'new_order', 'return_request', 'stock_alert', 'seller_payment' are relevant types
    // If exact types aren't known, we might include all for now or try to filter intelligently.
    // Based on previous files, 'new_order' is definitely seller.
    const sellerNotifications = useMemo(() => {
        return notifications.filter(n =>
            ['new_order', 'stock_low', 'return_request', 'payout', 'seller_info'].includes(n.type) ||
            // Fallback: if type is generic but message implies sales
            (n.message && n.message.toLowerCase().includes('order'))
        );
    }, [notifications]);

    const handlePress = (item) => {
        if (item.type === 'new_order' && item.relatedId) {
            navigation.navigate('SellerOrders'); // Or OrderDetail if specific
        }
        // Add other handlers
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_order': return 'cart-outline';
            case 'stock_low': return 'alert-circle-outline';
            case 'return_request': return 'return-down-back-outline';
            case 'payout': return 'cash-outline';
            default: return 'notifications-outline';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'new_order': return '#4CAF50';
            case 'stock_low': return '#FF9800';
            case 'return_request': return '#E50914';
            case 'payout': return '#2196F3';
            default: return '#9C27B0';
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.glassCard} onPress={() => handlePress(item)} activeOpacity={0.8}>
            <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '15' }]}>
                <Ionicons name={getIcon(item.type)} size={normalize(22)} color={getColor(item.type)} />
            </View>
            <View style={styles.content}>
                <View style={styles.rowBetween}>
                    <Text style={styles.title}>{item.title}</Text>
                    {!item.isRead && <View style={styles.dot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </TouchableOpacity>
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

                {/* Seller Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Seller Updates</Text>
                    <TouchableOpacity onPress={markAllAsRead} style={styles.settingsBtn}>
                        <Ionicons name="checkmark-done-circle-outline" size={normalize(26)} color="#E50914" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                ) : (
                    <FlatList
                        data={sellerNotifications}
                        keyExtractor={item => item._id || Math.random().toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#E50914"]}
                                tintColor="#E50914"
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBox}>
                                    <Ionicons name="notifications-off-outline" size={normalize(40)} color="#999" />
                                </View>
                                <Text style={styles.emptyText}>No business updates</Text>
                                <Text style={styles.subEmptyText}>New orders and alerts will appear here.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1a1a1a',
    },
    backBtn: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    settingsBtn: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    list: {
        paddingHorizontal: wp(5),
        paddingTop: hp(1),
        paddingBottom: hp(5),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassCard: {
        flexDirection: 'row',
        padding: wp(4),
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(6),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    content: {
        flex: 1,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    message: {
        fontSize: normalize(13),
        color: '#666',
        lineHeight: normalize(18),
        marginBottom: 6,
    },
    time: {
        fontSize: normalize(11),
        color: '#999',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E50914',
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: hp(15),
    },
    emptyIconBox: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(10),
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#fff',
    },
    emptyText: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(1),
    },
    subEmptyText: {
        fontSize: normalize(14),
        color: '#888',
        textAlign: 'center',
        width: '70%',
    }
});

export default SellerNotificationScreen;
