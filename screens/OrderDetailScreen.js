import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import { wp, hp, normalize } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const OrderDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useLanguage();

    // We can pass the full order object or just ID. If ID, fetch fresh.
    // For now assuming we pass the full order object or fetch via ID if needed.
    // Inside component
    const { order: initialOrder } = route.params || {};
    const [order, setOrder] = useState(initialOrder || {});
    const [loading, setLoading] = useState(false);

    const fetchOrderDetails = async () => {
        const orderId = initialOrder?._id || route.params?.orderId;
        if (!orderId) return;

        // Don't show full screen loader if we have initial data, maybe just background refresh or small indicator
        // But if we want to ensure address is up to date, let's fetch.

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
        { title: 'Ordered', icon: 'document-text', statusMatch: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'] },
        { title: 'Shipped', icon: 'cube', statusMatch: ['Shipped', 'Out for Delivery', 'Delivered'] },
        { title: 'Out for Delivery', icon: 'map', statusMatch: ['Out for Delivery', 'Delivered'] },
        { title: 'Delivered', icon: 'checkmark-circle', statusMatch: ['Delivered'] }
    ];

    if (order.status === 'Cancelled') {
        // Special view or handled inside
    }

    const currentStepIndex = steps.findIndex(step => step.title === order.status)
    // Heuristic mapping if exact string match fails or using the array inclusion logic
    // Simplified logic:
    // If status is 'Pending' or 'Processing', index 0 is active.
    // If 'Shipped', 0 and 1 active.
    // If 'Out for Delivery', 0, 1, 2 active.
    // If 'Delivered', all active. 

    const isStepActive = (stepStatusMatch) => {
        return stepStatusMatch.includes(order.status);
    };

    const handleCancelOrder = () => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
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
                                Alert.alert("Success", "Order cancelled successfully.");
                            } else {
                                Alert.alert("Error", data.message || "Failed to cancel");
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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Orders');
                    }} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Order ID & Date */}
                <View style={styles.section}>
                    <Text style={styles.orderId}>Order #{order._id}</Text>
                    <Text style={styles.orderDate}>Placed on {new Date(order.createdAt).toDateString()}</Text>
                    <Text style={styles.totalPrice}>Total: ₹{order.totalAmount}</Text>
                </View>

                {/* Cancelled Banner */}
                {order.status === 'Cancelled' && (
                    <View style={styles.cancelledBanner}>
                        <Ionicons name="alert-circle" size={24} color="#D32F2F" />
                        <Text style={styles.cancelledText}>This order has been cancelled</Text>
                    </View>
                )}

                {/* Tracker */}
                {order.status !== 'Cancelled' && (
                    <View style={styles.trackerContainer}>
                        {steps.map((step, index) => {
                            const active = isStepActive(step.statusMatch);
                            return (
                                <View key={index} style={styles.stepItem}>
                                    <View style={[styles.stepIcon, active ? styles.activeIcon : styles.inactiveIcon]}>
                                        <Ionicons name={step.icon} size={16} color={active ? "#fff" : "#aeaeae"} />
                                    </View>
                                    <View style={styles.stepTextContainer}>
                                        <Text style={[styles.stepTitle, active ? styles.activeText : styles.inactiveText]}>{step.title}</Text>
                                    </View>
                                    {index < steps.length - 1 && (
                                        <View style={[styles.stepLine, active && isStepActive(steps[index + 1].statusMatch) ? styles.activeLine : styles.inactiveLine]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {order.products?.map((prod, index) => (
                        <View key={index} style={styles.productRow}>
                            <Image source={{ uri: prod.image }} style={styles.productImage} resizeMode="contain" />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{prod.name}</Text>
                                <Text style={styles.productMeta}>Qty: {prod.quantity} | ₹{prod.price}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Shipping Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                        {(order.status === 'Pending' || order.status === 'Processing') && (
                            <TouchableOpacity onPress={handleChangeAddress}>
                                <Text style={styles.changeBtn}>Change</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.addressName}>{order.shippingAddress?.name || "N/A"}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress?.houseNo || ""}, {order.shippingAddress?.street || ""}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress?.city || ""}, {order.shippingAddress?.state || ""} - {order.shippingAddress?.postalCode || ""}</Text>
                    <Text style={styles.addressText}>Phone: {order.shippingAddress?.mobileNo || "N/A"}</Text>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    <Text style={styles.paymentMethod}>Method: {order.paymentMethod}</Text>
                    {order.paymentId && <Text style={styles.paymentId}>Ref ID: {order.paymentId}</Text>}
                </View>

                {/* Cancel Button */}
                {(order.status === 'Pending' || order.status === 'Processing') && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cancelButtonText}>Cancel Order</Text>}
                    </TouchableOpacity>
                )}

            </ScrollView>
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
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 30,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E50914',
        marginTop: 8,
    },
    trackerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20, // Space for tracking
        position: 'relative',
        height: 40,
    },
    stepIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    activeIcon: {
        backgroundColor: '#4CAF50',
    },
    inactiveIcon: {
        backgroundColor: '#eee',
    },
    stepTextContainer: {
        marginLeft: 15,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    activeText: {
        color: '#000',
        fontWeight: 'bold',
    },
    inactiveText: {
        color: '#aaa',
    },
    stepLine: {
        position: 'absolute',
        left: 14, // Center of 30px icon
        top: 30,
        width: 2,
        height: 30, // Connects to next
        zIndex: 1,
    },
    activeLine: {
        backgroundColor: '#4CAF50',
    },
    inactiveLine: {
        backgroundColor: '#eee',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    productRow: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    productImage: {
        width: 60,
        height: 60,
        backgroundColor: '#f9f9f9',
        marginRight: 10,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    productMeta: {
        fontSize: 12,
        color: '#777',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    changeBtn: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    addressName: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    addressText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 2,
    },
    paymentMethod: {
        fontSize: 14,
        color: '#333',
    },
    paymentId: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D32F2F',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelledBanner: {
        backgroundColor: '#FFEBEE',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelledText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        marginLeft: 10,
    }
});

export default OrderDetailScreen;
