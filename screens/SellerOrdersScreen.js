import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

const SellerOrdersScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

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
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        Alert.alert(
            "Update Status",
            `Mark order as ${newStatus}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                            });

                            if (response.ok) {
                                Alert.alert("Success", `Order updated to ${newStatus}`);
                                fetchOrders(); // Refresh list
                            } else {
                                Alert.alert("Error", "Failed to update status");
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Network error");
                        }
                    }
                }
            ]
        );
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toDateString()}</Text>

            <View style={styles.divider} />

            {/* Show only items belonging to this seller */}
            {item.products.filter(p => p.sellerId === sellerId).map((prod, index) => (
                <View key={index} style={styles.productRow}>
                    <Text style={styles.prodName}>{prod.name} x {prod.quantity}</Text>
                    <Text style={styles.prodPrice}>₹{prod.price * prod.quantity}</Text>
                </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payment</Text>
                <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {item.status === 'Processing' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item._id, 'Shipped')}>
                        <Text style={styles.actionBtnText}>Mark Shipped</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'Shipped' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF9800' }]} onPress={() => updateStatus(item._id, 'Out for Delivery')}>
                        <Text style={styles.actionBtnText}>Out for Delivery</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'Out for Delivery' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => updateStatus(item._id, 'Delivered')}>
                        <Text style={styles.actionBtnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const getStatusColor = (status) => {
        if (status === 'Delivered') return '#4CAF50';
        if (status === 'Processing') return '#2196F3';
        if (status === 'Cancelled') return '#D32F2F';
        return '#FF9800'; // Pending
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={["#1a1a1a", "#000"]} style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#fff" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator color="#E50914" size="large" /></View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    orderId: { fontWeight: 'bold', fontSize: 16 },
    status: { fontWeight: 'bold', fontSize: 14 },
    date: { color: '#666', fontSize: 12, marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    prodName: { fontSize: 14, color: '#333', flex: 1 },
    prodPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    totalLabel: { fontWeight: 'bold', color: '#333' },
    totalAmount: { fontWeight: 'bold', color: '#E50914', fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
    actionContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
    actionBtn: { backgroundColor: '#2196F3', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, marginLeft: 10 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});

export default SellerOrdersScreen;
