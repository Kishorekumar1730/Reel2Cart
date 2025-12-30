import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    FlatList, ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SellerProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sellerId } = route.params; // Expecting seller._id

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reels, setReels] = useState([]);
    const [stats, setStats] = useState({ followers: 0, following: 0, products: 0 });
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'reels'
    const [currentUserId, setCurrentUserId] = useState(null);

    // Initialize & Fetch
    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const userStr = await AsyncStorage.getItem("userInfo");
                if (userStr) {
                    setCurrentUserId(JSON.parse(userStr)._id);
                }
                fetchSellerProfile();
            };
            init();
        }, [sellerId])
    );

    const fetchSellerProfile = async () => {
        try {
            // Only set loading on first load or manual refresh to avoid flicker on focus
            if (!seller) setLoading(true);

            const res = await fetch(`${API_BASE_URL}/seller/profile/${sellerId}/public`);
            const data = await res.json();

            if (res.ok) {
                setSeller(data.seller);
                setProducts(data.products);
                setReels(data.reels);
                setStats(data.stats);

                // Check following status
                const userStr = await AsyncStorage.getItem("userInfo");
                if (userStr) {
                    const uid = JSON.parse(userStr)._id;
                    if (data.seller.followers.includes(uid)) {
                        setIsFollowing(true);
                    } else {
                        setIsFollowing(false);
                    }
                }
            }
        } catch (error) {
            console.error("Fetch Profile Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUserId) {
            alert("Please login to follow sellers");
            return;
        }

        // Optimistic Update
        setIsFollowing(!isFollowing);
        setStats(prev => ({
            ...prev,
            followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));

        try {
            const res = await fetch(`${API_BASE_URL}/seller/follow/${sellerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            });
            if (!res.ok) {
                // Revert on error
                setIsFollowing(!isFollowing);
                setStats(prev => ({
                    ...prev,
                    followers: isFollowing ? prev.followers - 1 : prev.followers + 1
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderGridItem = ({ item }) => (
        <TouchableOpacity
            style={styles.gridItem}
            // Navigate to detail or reel player
            onPress={() => {
                if (activeTab === 'reels') {
                    // Navigate to reels player specifically for this seller's reels? 
                    // For now simple alert or navigate
                    alert("Play Reel: " + item.name);
                } else {
                    // Product Detail
                    alert("Product: " + item.name);
                }
            }}
        >
            <Image
                source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }}
                style={styles.gridImage}
            />
            {activeTab === 'reels' && (
                <View style={styles.reelIconOverlay}>
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 4 }}>{item.views || 0}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#E50914" />
            </SafeAreaView>
        );
    }

    if (!seller) {
        return (
            <SafeAreaView style={styles.center}>
                <Text>Seller not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{seller.businessName}</Text>
                {seller.isVerified && <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginLeft: 5 }} />}
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Stats Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {seller.profileImage ? (
                            <Image source={{ uri: seller.profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>{seller.businessName.charAt(0)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.products + stats.reels}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.followers}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.following}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </View>

                {/* Bio & Actions */}
                <View style={styles.bioSection}>
                    <Text style={styles.sellerName}>{seller.sellerName}</Text>
                    {seller.description ? <Text style={styles.bioText}>{seller.description}</Text> : null}
                </View>

                <View style={styles.actionButtons}>
                    {/* Follow Button */}
                    {seller._id !== currentUserId ? (
                        <TouchableOpacity
                            style={[styles.followBtn, isFollowing ? styles.followingBtn : styles.notFollowingBtn]}
                            onPress={handleFollowToggle}
                        >
                            <Text style={[styles.followBtnText, isFollowing ? { color: '#000' } : { color: '#fff' }]}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.followBtn, styles.editBtn]}
                            onPress={() => navigation.navigate("EditSellerProfile", { userId: currentUserId })} // or seller._id
                        >
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.messageBtn}
                        onPress={() => {
                            if (!currentUserId) {
                                alert("Please login to message sellers");
                                return;
                            }
                            // Ensure we have a valid receiver ID. 
                            // If userId is populated object, use _id. If string, use it.
                            const recId = (seller.userId && seller.userId._id) ? seller.userId._id : seller.userId;
                            navigation.navigate("Chat", {
                                receiverId: recId,
                                receiverName: seller.businessName
                            });
                        }}
                    >
                        <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                        onPress={() => setActiveTab('products')}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={24}
                            color={activeTab === 'products' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
                        onPress={() => setActiveTab('reels')}
                    >
                        <Ionicons
                            name="videocam-outline"
                            size={26}
                            color={activeTab === 'reels' ? '#000' : '#888'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Grid Content */}
                <View style={styles.gridContainer}>
                    {activeTab === 'products' ? (
                        products.length > 0 ? (
                            products.map((item, index) => (
                                <View key={index} style={styles.gridWrapper}>
                                    {renderGridItem({ item })}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyTab}>
                                <Text>No Products</Text>
                            </View>
                        )
                    ) : (
                        reels.length > 0 ? (
                            reels.map((item, index) => (
                                <View key={index} style={styles.gridWrapper}>
                                    {renderGridItem({ item })}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyTab}>
                                <Text>No Reels</Text>
                            </View>
                        )
                    )}

                    {/* Hacky way to handle flex wrap spacing if needed, but flexWrap works ok */}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default SellerProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    avatarContainer: {
        marginRight: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    avatarPlaceholder: {
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 13,
        color: '#333',
    },
    bioSection: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    sellerName: {
        fontWeight: 'bold', // Represents Real Name vs Business Name in header
        fontSize: 14,
        marginBottom: 2,
    },
    bioText: {
        color: '#333',
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    followBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
    },
    notFollowingBtn: {
        backgroundColor: '#0095f6', // Insta blue
    },
    followingBtn: {
        backgroundColor: '#efefef',
        borderWidth: 1,
        borderColor: '#dbdbdb',
    },
    followBtnText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    editBtn: {
        backgroundColor: '#efefef',
        borderWidth: 1,
        borderColor: '#dbdbdb',
    },
    editBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
    },
    messageBtn: {
        flex: 1,
        backgroundColor: '#efefef',
        borderWidth: 1,
        borderColor: '#dbdbdb',
        borderRadius: 5,
        paddingVertical: 8,
        alignItems: 'center',
    },
    messageBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
    },
    tabContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    activeTab: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridWrapper: {
        width: width / 3,
        height: width / 3,
        padding: 1,
    },
    gridItem: {
        flex: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    reelIconOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        paddingHorizontal: 4,
    },
    emptyTab: {
        width: '100%',
        padding: 40,
        alignItems: 'center',
    },
});
