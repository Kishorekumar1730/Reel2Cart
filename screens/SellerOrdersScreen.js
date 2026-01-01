import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { normalize, wp, hp } from '../utils/responsive';
import { useFocusEffect } from '@react-navigation/native';

const SellerOrdersScreen = ({ route, navigation }) => {
    const { t } = useLanguage();
    const { sellerId } = route.params;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/seller/orders/${sellerId}`);
            const data = await res.json();
            if (res.ok) {
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const updateStatus = async (orderId, newStatus) => {
        Alert.alert(
            t('updateStatusTitle'),
            t('markOrderAs', { status: newStatus }),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('confirm'),
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                            });

                            if (response.ok) {
                                Alert.alert(t('success'), t('statusUpdated', { status: newStatus }));
                                fetchOrders(); // Refresh list
                            } else {
                                Alert.alert(t('error'), t('failedUpdate'));
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert(t('error'), t('networkError'));
                        }
                    }
                }
            ]
        );
    };

    const renderOrderItem = ({ item }) => {
        // Filter products for this seller
        const sellerProducts = item.products.filter(p => p.sellerId === sellerId);
        if (sellerProducts.length === 0) return null;

        return (
            <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderId}>{t('orderNumber')} {item._id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.date}>{new Date(item.createdAt).toDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {sellerProducts.map((prod, index) => (
                    <View key={index} style={styles.productRow}>
                        <View style={styles.productInfo}>
                            <Text style={styles.prodName} numberOfLines={2}>{prod.name}</Text>
                            <Text style={styles.prodQty}>Qty: {prod.quantity}</Text>
                        </View>
                        <Text style={styles.prodPrice}>₹{prod.price * prod.quantity}</Text>
                    </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                    <View>
                        <Text style={styles.totalLabel}>{t('totalPayment')}</Text>
                        <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        {item.status === 'Processing' && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={() => updateStatus(item._id, 'Shipped')}>
                                <Text style={styles.actionBtnText}>{t('shipOrder')}</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'Shipped' && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF9800' }]} onPress={() => updateStatus(item._id, 'Out for Delivery')}>
                                <Text style={styles.actionBtnText}>{t('outForDeliveryAction')}</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'Out for Delivery' && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => updateStatus(item._id, 'Delivered')}>
                                <Text style={styles.actionBtnText}>{t('completeOrder')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const getStatusColor = (status) => {
        if (status === 'Delivered') return '#4CAF50';
        if (status === 'Processing') return '#2196F3';
        if (status === 'Cancelled') return '#D32F2F';
        return '#FF9800'; // Pending
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Modern Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('manageOrders')}</Text>
                    <View style={{ width: normalize(24) }} />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color="#E50914" size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={item => item._id}
                        renderItem={renderOrderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E50914']} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={normalize(60)} color="#9ca3af" />
                                <Text style={styles.emptyText}>{t('noActiveOrders')}</Text>
                                <Text style={styles.emptySubText}>{t('newOrdersHint')}</Text>
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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(255,255,255,0.4)', // Glassmorphism
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1f2937',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(5),
    },
    // Premium Glass Card
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: wp(4),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
    },
    orderId: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    date: {
        fontSize: normalize(12),
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: normalize(12),
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: hp(1.5),
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    productInfo: {
        flex: 1,
        marginRight: 10,
    },
    prodName: {
        fontSize: normalize(14),
        color: '#374151',
        fontWeight: '500',
        marginBottom: 2,
    },
    prodQty: {
        fontSize: normalize(12),
        color: '#9CA3AF',
    },
    prodPrice: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#1F2937',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(0.5),
    },
    totalLabel: {
        fontSize: normalize(10),
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    totalAmount: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#E50914',
    },
    actionContainer: {
        flexDirection: 'row',
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(12),
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: hp(10),
    },
    emptyText: {
        marginTop: hp(2),
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#374151',
    },
    emptySubText: {
        fontSize: normalize(14),
        color: '#9CA3AF',
        marginTop: 4,
    }
});

export default SellerOrdersScreen;
