import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { wp, hp, normalize } from '../utils/responsive';

const OrderDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();

    // We can pass the full order object or just ID. If ID, fetch fresh.
    const { order: initialOrder } = route.params || {};
    const [order, setOrder] = useState(initialOrder || {});
    const [loading, setLoading] = useState(false);

    const fetchOrderDetails = async () => {
        const orderId = initialOrder?._id || route.params?.orderId;
        if (!orderId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/orders/detail/${orderId}`);
            const data = await response.json();
            if (response.ok) {
                setOrder(data.order);
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchOrderDetails();
        }, [initialOrder?._id])
    );

    // Status Steps
    const steps = [
        { title: t('statusOrdered'), icon: 'document-text', statusMatch: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'] },
        { title: t('statusShipped'), icon: 'cube', statusMatch: ['Shipped', 'Out for Delivery', 'Delivered'] },
        { title: t('statusOutForDelivery'), icon: 'map', statusMatch: ['Out for Delivery', 'Delivered'] },
        { title: t('statusDelivered'), icon: 'checkmark-circle', statusMatch: ['Delivered'] }
    ];

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Pending':
            case 'Processing': return t('statusOrdered');
            case 'Shipped': return t('statusShipped');
            case 'Out for Delivery': return t('statusOutForDelivery');
            case 'Delivered': return t('statusDelivered');
            case 'Cancelled': return t('cancelled');
            default: return status;
        }
    };

    const isStepActive = (stepStatusMatch) => {
        return stepStatusMatch.includes(order.status);
    };

    const handleCancelOrder = () => {
        Alert.alert(
            t('cancelOrder'),
            t('cancelOrderConfirm'),
            [
                { text: t('no'), style: "cancel" },
                {
                    text: t('yesCancel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await fetch(`${API_BASE_URL}/orders/cancel`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: order._id })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                setOrder(data.order);
                                Alert.alert(t('success'), t('orderCancelledSuccess'));
                            } else {
                                Alert.alert(t('error'), data.message || t('failedToCancel'));
                            }
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleChangeAddress = () => {
        navigation.navigate('Address', {
            source: 'OrderDetail',
            orderId: order._id
        });
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Orders');
                    }} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
                    <View style={{ width: wp(10) }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Order ID & Date */}
                    <View style={styles.glassCard}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.orderId}>{t('orderNumber')}{order._id ? order._id.slice(-8).toUpperCase() : '...'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: order.status === 'Cancelled' ? '#ffebee' : '#e8f5e9' }]}>
                                <Text style={[styles.statusText, { color: order.status === 'Cancelled' ? '#d32f2f' : '#2e7d32' }]}>
                                    {getStatusLabel(order.status)}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.orderDate}>{t('placedOn')} {new Date(order.createdAt).toDateString()}</Text>
                        <View style={styles.divider} />
                        <View style={styles.rowBetween}>
                            <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
                            <Text style={styles.totalPrice}>{formatPrice(order.totalAmount)}</Text>
                        </View>
                    </View>

                    {/* Cancelled Banner */}
                    {order.status === 'Cancelled' && (
                        <View style={styles.cancelledBanner}>
                            <Ionicons name="alert-circle" size={normalize(20)} color="#D32F2F" />
                            <Text style={styles.cancelledText}>{t('orderCancelledMsg')}</Text>
                        </View>
                    )}

                    {/* Tracker */}
                    {order.status !== 'Cancelled' && (
                        <View style={styles.glassCard}>
                            <Text style={styles.sectionTitle}>{t('orderStatus')}</Text>
                            <View style={styles.trackerContainer}>
                                {steps.map((step, index) => {
                                    const active = isStepActive(step.statusMatch);
                                    const isLast = index === steps.length - 1;
                                    return (
                                        <View key={index} style={styles.stepItem}>
                                            <View style={styles.stepLeft}>
                                                <View style={[styles.stepIcon, active ? styles.activeIcon : styles.inactiveIcon]}>
                                                    <Ionicons name={step.icon} size={normalize(14)} color={active ? "#fff" : "#aeaeae"} />
                                                </View>
                                                {!isLast && (
                                                    <View style={[styles.stepLine, active && isStepActive(steps[index + 1].statusMatch) ? styles.activeLine : styles.inactiveLine]} />
                                                )}
                                            </View>
                                            <View style={styles.stepContent}>
                                                <Text style={[styles.stepTitle, active ? styles.activeText : styles.inactiveText]}>{step.title}</Text>
                                                {/* Could add dates here if available */}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Items */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>{t('items')} ({order.products?.length || 0})</Text>
                        {order.products?.map((prod, index) => (
                            <View key={index} style={[styles.productRow, index === order.products.length - 1 && { borderBottomWidth: 0 }]}>
                                <Image source={{ uri: prod.image }} style={styles.productImage} resizeMode="cover" />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.productQty}>{t('qty')}: {prod.quantity}</Text>
                                        <Text style={styles.productPrice}>{formatPrice(prod.price)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.glassCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>{t('shippingDetails')}</Text>
                            {(order.status === 'Pending' || order.status === 'Processing') && (
                                <TouchableOpacity onPress={handleChangeAddress}>
                                    <Text style={styles.changeBtn}>{t('change')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.addressContainer}>
                            <View style={styles.iconBox}>
                                <Ionicons name="location-outline" size={normalize(20)} color="#E50914" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addressName}>{order.shippingAddress?.name || "N/A"}</Text>
                                <Text style={styles.addressText}>{order.shippingAddress?.houseNo ? `${order.shippingAddress.houseNo}, ` : ''}{order.shippingAddress?.street || ""}</Text>
                                <Text style={styles.addressText}>{order.shippingAddress?.city || ""}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress?.postalCode ? `- ${order.shippingAddress.postalCode}` : ''}</Text>
                                <Text style={styles.addressText}>{order.shippingAddress?.mobileNo || "N/A"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Payment Info */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>{t('paymentInfo')}</Text>
                        <View style={styles.rowBetween}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="card-outline" size={normalize(20)} color="#4CAF50" />
                                </View>
                                <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
                            </View>
                            {order.paymentId && <Text style={styles.paymentId}># {order.paymentId.slice(-6)}</Text>}
                        </View>
                    </View>

                    {/* Cancel Button */}
                    {(order.status === 'Pending' || order.status === 'Processing') && (
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                            {loading ? <ActivityIndicator color="#E50914" /> : <Text style={styles.cancelButtonText}>{t('cancelOrder')}</Text>}
                        </TouchableOpacity>
                    )}

                    <View style={{ height: hp(5) }} />

                </ScrollView>
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
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#1a1a1a',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        padding: wp(4),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(1.5),
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: {
        fontSize: normalize(16),
        fontWeight: '800',
        color: '#333',
    },
    orderDate: {
        fontSize: normalize(12),
        color: '#888',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: hp(1.5),
    },
    totalLabel: {
        fontSize: normalize(14),
        color: '#666',
        fontWeight: '600',
    },
    totalPrice: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#E50914',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: normalize(12),
        fontWeight: '700',
    },
    cancelledBanner: {
        backgroundColor: '#FFEBEE',
        padding: wp(4),
        borderRadius: 12,
        marginBottom: hp(2),
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    cancelledText: {
        color: '#D32F2F',
        fontWeight: '700',
        marginLeft: 10,
        fontSize: normalize(14),
    },
    trackerContainer: {
        marginLeft: wp(2),
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 0,
        minHeight: hp(6),
    },
    stepLeft: {
        alignItems: 'center',
        marginRight: wp(3),
        width: 30,
    },
    stepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    activeIcon: {
        backgroundColor: '#E50914',
    },
    inactiveIcon: {
        backgroundColor: '#eee',
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    activeLine: {
        backgroundColor: '#E50914',
    },
    inactiveLine: {
        backgroundColor: '#eee',
    },
    stepContent: {
        paddingBottom: hp(2),
        justifyContent: 'flex-start',
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: normalize(14),
        fontWeight: '500',
    },
    activeText: {
        color: '#333',
        fontWeight: '700',
    },
    inactiveText: {
        color: '#aaa',
    },
    productRow: {
        flexDirection: 'row',
        marginBottom: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: hp(1.5),
    },
    productImage: {
        width: wp(16),
        height: wp(16),
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        marginRight: wp(3),
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productQty: {
        fontSize: normalize(13),
        color: '#666',
    },
    productPrice: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#333',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(1),
    },
    changeBtn: {
        color: '#E50914',
        fontWeight: '600',
        fontSize: normalize(14),
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    addressName: {
        fontWeight: '700',
        fontSize: normalize(14),
        marginBottom: 2,
        color: '#333',
    },
    addressText: {
        fontSize: normalize(13),
        color: '#666',
        marginBottom: 2,
        lineHeight: normalize(18),
    },
    paymentMethod: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#333',
    },
    paymentId: {
        fontSize: normalize(12),
        color: '#999',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#D32F2F',
        borderRadius: 25,
        padding: hp(1.8),
        alignItems: 'center',
        marginTop: hp(1),
    },
    cancelButtonText: {
        color: '#D32F2F',
        fontWeight: '700',
        fontSize: normalize(16),
    },
});

export default OrderDetailScreen;
