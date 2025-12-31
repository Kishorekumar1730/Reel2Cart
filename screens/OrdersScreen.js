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

    const handleDeleteOrder = (orderId) => {
        // Alert handled inside delete? Or ask confirmation here.
        // Alert handled here.
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("OrderDetail", { order: item })}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.status, { color: getStatusColor(item.status), marginRight: 10 }]}>{item.status}</Text>
                    {/* Delete Icon */}
                    <TouchableOpacity onPress={() => {
                        Alert.alert("Delete Order", "Are you sure you want to delete this order from history?", [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Delete", style: "destructive", onPress: async () => {
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
                    }}>
                        <Ionicons name="trash-outline" size={20} color="#999" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

            <View style={styles.divider} />

            {item.products.map((prod, index) => (
                <View key={index} style={styles.productRow}>
                    <Image source={{ uri: prod.image }} style={styles.productImage} resizeMode="contain" />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.productQty}>Qty: {prod.quantity} × {formatPrice(prod.price)}</Text>
                    </View>
                </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E50914" />
            {/* Header */}
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('orders') || "My Orders"}</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            {loading && orders.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E50914" />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No orders yet!</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    backButton: {
        padding: 5,
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    orderId: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#333',
    },
    status: {
        fontSize: normalize(12),
        fontWeight: 'bold',
    },
    date: {
        fontSize: normalize(12),
        color: '#777',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 10,
    },
    productRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: normalize(13),
        color: '#333',
        marginBottom: 2,
    },
    productQty: {
        fontSize: normalize(12),
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: normalize(14),
        color: '#555',
    },
    totalAmount: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#000',
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
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        color: '#555',
    },
});

export default OrdersScreen;
