import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, normalize } from '../utils/responsive';

const FollowListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { id, type, title } = route.params;
    // id: userId or sellerId
    // type: 'user_following', 'seller_followers', 'seller_following'

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const init = async () => {
                const userStr = await AsyncStorage.getItem("userInfo");
                if (userStr) {
                    setCurrentUserId(JSON.parse(userStr)._id);
                }
                fetchList();
            };
            init();
        }, [])
    );

    const fetchList = async () => {
        try {
            let url = '';
            if (type === 'user_following') {
                url = `${API_BASE_URL}/user/${id}/following`;
            } else if (type === 'seller_followers') {
                url = `${API_BASE_URL}/seller/${id}/followers`;
            } else if (type === 'seller_following') {
                url = `${API_BASE_URL}/seller/${id}/following`;
            }

            const res = await fetch(url);
            const jsonData = await res.json();

            if (res.ok) {
                setData(jsonData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (item) => {
        if (type === 'user_following') {
            // User Unfollows Seller
            // item is a Seller
            try {
                setData(prev => prev.filter(p => p._id !== item._id));
                await fetch(`${API_BASE_URL}/seller/follow/${item._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
            } catch (error) { console.error(error); }

        } else if (type === 'seller_followers') {
            // Seller Removes Follower
            // item is a User
            try {
                setData(prev => prev.filter(p => p._id !== item._id));

                await fetch(`${API_BASE_URL}/seller/follow/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: item._id }) // The user to remove
                });
            } catch (error) {
                console.error(error);
                alert("Error removing follower");
            }
        }
    };

    const renderItem = ({ item }) => {
        const image = item.profileImage;
        const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

        // Robust Name Logic
        let displayName = "Unknown User";
        if (item.businessName) displayName = item.businessName;
        else if (item.name) displayName = item.name;

        // Handle Logic
        let handle = "";
        if (item.sellerName) handle = "@" + item.sellerName;
        else if (item.email) handle = item.email.split('@')[0]; // Simple mask
        else handle = item.businessName ? "Seller" : "User";

        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.profileRow}
                    activeOpacity={0.7}
                    onPress={() => {
                        if (item.businessName) {
                            navigation.navigate("SellerProfile", { sellerId: item._id });
                        }
                    }}
                >
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: (image && image !== '') ? image : defaultAvatar }}
                            style={styles.avatar}
                        />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.subtext} numberOfLines={1}>{handle}</Text>
                    </View>
                </TouchableOpacity>

                {type === 'user_following' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(item)}>
                        <Text style={styles.actionText}>Unfollow</Text>
                    </TouchableOpacity>
                )}

                {type === 'seller_followers' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(item)}>
                        <Text style={styles.actionText}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
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

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Ionicons name="people-outline" size={normalize(50)} color="#ccc" />
                                <Text style={styles.emptyText}>No users found.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default FollowListScreen;

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
        paddingVertical: hp(1.5),
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.4)',
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
    listContent: {
        padding: wp(4),
        paddingBottom: hp(5),
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: hp(50),
    },
    emptyText: {
        color: '#64748B',
        marginTop: hp(2),
        fontSize: normalize(15),
        fontWeight: '500',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.75)',
        marginBottom: hp(1.5),
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#fff',
        // Slight shadow
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        // Instagram-like ring effect
        width: 58,
        height: 58,
        borderRadius: 29,
        padding: 2, // Space for border
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#DDD6FE', // Light purple ring
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
    },
    info: {
        justifyContent: 'center',
        flex: 1,
    },
    name: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    subtext: {
        fontSize: normalize(12),
        color: '#64748B',
        fontWeight: '500'
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginLeft: 8,
    },
    actionText: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#EF4444',
    }
});
