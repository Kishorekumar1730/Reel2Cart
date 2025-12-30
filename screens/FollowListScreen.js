import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            // currentUserId is the Seller's User ID (Owner), but we need the Seller ID to hit the endpoint.
            // The endpoint expects /seller/follow/:sellerId with body { userId: followerId }
            // Therefore, for this screen we must pass the Seller ID as 'id' param.

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
        // Determine logic based on type
        // User Following -> Shows Sellers
        // Seller Followers -> Shows Users
        // Seller Following -> Shows Users/Sellers

        const image = item.profileImage;
        // Prioritize 'name' if it exists (User), else businessName (Seller)
        const name = item.name || item.businessName || "Unknown User";
        const subtext = item.businessName ? 'Seller' : 'User';

        return (
            <View style={styles.itemContainer}>
                <TouchableOpacity
                    style={styles.profileRow}
                    onPress={() => {
                        if (item.businessName) {
                            // It's a seller, go to profile
                            navigation.navigate("SellerProfile", { sellerId: item._id });
                        }
                    }}
                >
                    <Image
                        source={{ uri: image || 'https://via.placeholder.com/50' }}
                        style={styles.avatar}
                    />
                    <View style={styles.info}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.subtext}>{subtext}</Text>
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ color: '#666', marginTop: 50 }}>List is empty</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default FollowListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#eee',
        marginRight: 15,
    },
    info: {
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    subtext: {
        fontSize: 12,
        color: '#888',
    },
    actionBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#eee',
        borderRadius: 5,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    }
});
