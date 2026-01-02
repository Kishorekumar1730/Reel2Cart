import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { wp, hp, normalize } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const OrdersScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const getUserId = async () => {
            const storedUser = await AsyncStorage.getItem("userInfo");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUserId(parsed._id);
            }
        };
        getUserId();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchOrders(userId);
            }
        }, [userId])
    );

    const fetchOrders = async (uid) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/orders/${uid}`);
            const data = await response.json();
            if (response.ok) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return '#4CAF50';
            case 'Processing': return '#FF9800';
            case 'Delivered': return '#2196F3';
            case 'Cancelled': return '#F44336';
            default: return '#757575';
        }
    };

    const getStatusBgColor = (status) => {
        switch (status) {
            case 'Paid': return '#E8F5E9';
            case 'Processing': return '#FFF3E0';
            case 'Delivered': return '#E3F2FD';
            case 'Cancelled': return '#FFEBEE';
            default: return '#F5F5F5';
        }
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate("OrderDetail", { order: item })} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>{t('orderNumber')}{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {item.products.slice(0, 2).map((prod, index) => (
                <View key={index} style={styles.productRow}>
                    <Image source={{ uri: prod.image }} style={styles.productImage} resizeMode="cover" />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                        <View style={styles.row}>
                            <Text style={styles.productQty}>{t('qty')}: {prod.quantity}</Text>
                            <Text style={styles.productPrice}>{formatPrice(prod.price)}</Text>
                        </View>
                    </View>
                </View>
            ))}

            {item.products.length > 2 && (
                <Text style={styles.moreItemsText}>+ {item.products.length - 2} {t('moreItems')}</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
                    <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
                </View>

                {/* Delete Icon */}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                        Alert.alert(t('deleteOrder'), t('deleteOrderConfirm'), [
                            { text: t('cancel'), style: "cancel" },
                            {
                                text: t('delete'), style: "destructive", onPress: async () => {
                                    try {
                                        const response = await fetch(`${API_BASE_URL}/orders/${item._id}`, {
                                            method: 'DELETE'
                                        });
                                        if (response.ok) {
                                            fetchOrders(userId); // Refresh list
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                            }
                        ]);
                    }}
                >
                    <Ionicons name="trash-outline" size={normalize(18)} color="#999" />
                </TouchableOpacity>
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

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('orders') || "My Orders"}</Text>
                    <View style={{ width: wp(10) }} />
                </View>

                {loading && orders.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                ) : orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="cube-outline" size={normalize(40)} color="#999" />
                        </View>
                        <Text style={styles.emptyText}>{t('noOrdersYet')}</Text>
                        <Text style={styles.emptySubText}>{t('startShoppingOrders')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
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
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    listContent: {
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
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderId: {
        fontSize: normalize(15),
        fontWeight: '800',
        color: '#333',
        marginBottom: 4,
    },
    date: {
        fontSize: normalize(11),
        color: '#888',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        fontSize: normalize(11),
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: hp(1.5),
    },
    productRow: {
        flexDirection: 'row',
        marginBottom: hp(1.5),
        alignItems: 'center',
    },
    productImage: {
        width: wp(12),
        height: wp(12),
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        marginRight: wp(3),
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    productQty: {
        fontSize: normalize(12),
        color: '#666',
    },
    productPrice: {
        fontSize: normalize(12),
        fontWeight: '700',
        color: '#333',
    },
    moreItemsText: {
        fontSize: normalize(12),
        color: '#777',
        fontStyle: 'italic',
        marginBottom: hp(1),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: normalize(12),
        color: '#666',
        fontWeight: '500',
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: normalize(16),
        fontWeight: '800',
        color: '#E50914',
    },
    deleteBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(10),
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
    emptySubText: {
        fontSize: normalize(14),
        color: '#888',
        textAlign: 'center',
    },
});

export default OrdersScreen;
