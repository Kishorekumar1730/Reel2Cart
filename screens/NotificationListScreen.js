import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { normalize, wp, hp } from '../utils/responsive';

import { useNotifications } from '../context/NotificationContext';

const NotificationListScreen = ({ navigation }) => {
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

    const handlePress = (item) => {
        if (item.relatedId && (item.type === 'order_update' || item.type === 'new_order')) {
            // If seller -> Seller Dashboard? For now both go to order details or dashboard
            // Wait, we don't have a single Order Details screen that fits both perfectly yet, 
            // but let's assume OrderDetailScreen for now.
            // Or if it's "new_order" and user is seller, maybe go to SellerOrders?
            if (item.type === 'new_order') {
                navigation.navigate('SellerDashboard');
            } else {
                navigation.navigate('OrderDetail', { orderId: item.relatedId });
            }
        }
    };


    const getIcon = (type) => {
        switch (type) {
            case 'order_update': return 'cube';
            case 'new_order': return 'cart'; // For Sellers
            case 'promotion': return 'pricetag';
            case 'account': return 'person';
            default: return 'notifications';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'order_update': return '#2196F3';
            case 'new_order': return '#4CAF50';
            case 'promotion': return '#FF9800';
            case 'account': return '#9C27B0';
            default: return '#E50914';
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '20' }]}>
                <Ionicons name={getIcon(item.type)} size={24} color={getColor(item.type)} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead} style={styles.settingsBtn}>
                    <Ionicons name="checkmark-done-circle-outline" size={26} color="#E50914" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                            <Text style={styles.subEmptyText}>We'll verify updates here.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff'
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    backBtn: { padding: 5 },
    settingsBtn: { padding: 5 },
    list: {
        padding: 15,
    },
    card: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        alignItems: 'center'
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#333',
        marginBottom: 3
    },
    message: {
        fontSize: normalize(13),
        color: '#666',
        lineHeight: 18,
        marginBottom: 5
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
        marginLeft: 10
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: '#555',
        marginTop: 15
    },
    subEmptyText: {
        fontSize: normalize(13),
        color: '#999',
        marginTop: 5
    }
});

export default NotificationListScreen;
