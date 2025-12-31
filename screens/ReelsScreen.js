import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, FlatList,
    Image, TouchableOpacity, ActivityIndicator,
    TextInput, Modal, Share, KeyboardAvoidingView, Platform,
    TouchableWithoutFeedback, Animated
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect, useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useCurrency } from '../context/CurrencyContext';

const { width, height } = Dimensions.get('window');

// --- COMMENT MODAL COMPONENT ---
const CommentModal = ({ visible, onClose, comments, onAddComment, loading }) => {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (text.trim()) {
            onAddComment(text);
            setText("");
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Handle Bar */}
                    <View style={styles.modalHandle} />

                    <Text style={styles.modalTitle}>Comments ({comments.length})</Text>

                    <FlatList
                        data={[...comments].reverse()} // Newest first
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.commentItem}>
                                <View style={styles.commentAvatar}>
                                    <Text style={styles.commentAvatarText}>
                                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                                <View style={styles.commentTextContent}>
                                    <Text style={styles.commentUser}>{item.userName || "User"}</Text>
                                    <Text style={styles.commentText}>{item.text}</Text>
                                    <Text style={styles.commentTime}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        )}
                        style={styles.commentList}
                        ListEmptyComponent={
                            <Text style={styles.noComments}>Be the first to comment!</Text>
                        }
                    />

                    {/* Input Area */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                    >
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a comment..."
                                value={text}
                                onChangeText={setText}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!text.trim() || loading}
                            >
                                <Text style={[styles.postText, !text.trim() && { color: '#ccc' }]}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

// --- SINGLE REEL ITEM ---
const ReelItem = ({ item, isActive, isScreenFocused, userId, navigation }) => {
    const { formatPrice } = useCurrency(); // Use Currency Hook

    // Resolve Video URL (Handle relative paths)
    const getVideoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('file://')) return url;
        return `${API_BASE_URL}/${url}`;
    };

    const finalVideoUrl = getVideoUrl(item.videoUrl);

    // Video Player
    const player = useVideoPlayer(finalVideoUrl, player => {
        player.loop = true;
    });

    // Local State for Interaction (Optimistic Updates)
    const [isLiked, setIsLiked] = useState(item.likes?.includes(userId));
    const [likesCount, setLikesCount] = useState(item.likes?.length || 0);
    const [comments, setComments] = useState(item.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [lastTap, setLastTap] = useState(null); // Double tap logic
    const heartScale = useRef(new Animated.Value(0)).current; // Big heart animation center

    useEffect(() => {
        if (isActive && isScreenFocused) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isScreenFocused, player]);

    // Handle Like (Sync with Wishlist)
    const toggleLike = async () => {
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikesCount(prev => newStatus ? prev + 1 : prev - 1);

        try {
            // 1. Social Like Endpoint
            await fetch(`${API_BASE_URL}/products/${item._id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            // 2. Wishlist Sync
            if (newStatus) {
                // Add to Wishlist
                const productPayload = {
                    productId: item._id,
                    name: item.name,
                    image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150', // Fallback
                    price: item.price
                };
                await fetch(`${API_BASE_URL}/wishlist/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, product: productPayload })
                });
            } else {
                // Remove from Wishlist
                await fetch(`${API_BASE_URL}/wishlist/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, productId: item._id })
                });
            }

        } catch (error) {
            console.error("Like/Wishlist error", error);
            // Revert on critical failure if needed, but for now log it.
        }
    };

    // Double Tap Logic
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
            if (!isLiked) toggleLike();
            // Animate Big Heart
            Animated.sequence([
                Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
                Animated.timing(heartScale, { toValue: 0, duration: 100, delay: 500, useNativeDriver: true })
            ]).start();
        } else {
            setLastTap(now);
        }
    };

    // Handle Comment
    const handleAddComment = async (text) => {
        // Optimistic Add
        const newComment = {
            userId: userId,
            userName: "You", // Placeholder until refresh
            text: text,
            createdAt: new Date()
        };
        setComments(prev => [...prev, newComment]);

        try {
            const res = await fetch(`${API_BASE_URL}/products/${item._id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text })
            });
            const data = await res.json();
            if (res.ok) {
                // Update with server data (real username etc)
                setComments(data.comments);
            }
        } catch (error) {
            console.error("Comment error", error);
        }
    };

    // Handle Share
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this amazing product on Reel2Cart!\n${item.name} - ${formatPrice(item.price)}\n${item.videoUrl}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <View style={styles.reelContainer}>
                <VideoView
                    style={styles.video}
                    player={player}
                    contentFit="cover"
                    nativeControls={false}
                />

                {/* Big Heart Animation */}
                <View style={styles.centerHeartContainer}>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Ionicons name="heart" size={100} color="rgba(255,255,255,0.8)" />
                    </Animated.View>
                </View>

                {/* Overlay Gradient */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />

                {/* Right Side Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={35}
                            color={isLiked ? "#E50914" : "#fff"}
                        />
                        <Text style={styles.actionLabel}>{likesCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
                        <Ionicons name="chatbubble-ellipses-outline" size={32} color="#fff" />
                        <Text style={styles.actionLabel}>{comments.length}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={32} color="#fff" />
                        <Text style={styles.actionLabel}>Share</Text>
                    </TouchableOpacity>

                    {/* More option for wishlist/report could go here */}
                </View>

                {/* Bottom Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.userRow}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => item.sellerId?._id && navigation.navigate("SellerProfile", { sellerId: item.sellerId._id })}>
                            <View style={[styles.avatar, item.sellerId?.profileImage ? { borderWidth: 0 } : {}]}>
                                {item.sellerId?.profileImage ? (
                                    <Image source={{ uri: item.sellerId.profileImage }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {(item.sellerId?.businessName || item.category || 'S').charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.userName}>
                                {item.sellerId?.businessName || `${item.category} Seller`}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.followButton}
                            onPress={() => item.sellerId?._id && navigation.navigate("SellerProfile", { sellerId: item.sellerId._id })}
                        >
                            <Text style={styles.followText}>Follow</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { product: item })}>
                        <Text style={styles.description} numberOfLines={2}>
                            <Text style={styles.productTitle}>{item.name} </Text>
                            {item.description}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.priceTag}>
                        <Ionicons name="pricetag" size={14} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
                        <TouchableOpacity
                            style={styles.shopNowBtn}
                            onPress={async () => {
                                if (!userId) {
                                    alert("Please login to shop");
                                    return;
                                }

                                try {
                                    const payload = {
                                        userId: userId,
                                        product: {
                                            name: item.name,
                                            price: item.price,
                                            image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150',
                                            quantity: 1,
                                            productId: item._id
                                        }
                                    };

                                    const res = await fetch(`${API_BASE_URL}/cart/add`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });

                                    const data = await res.json();

                                    if (res.ok) {
                                        alert("Added to Cart Successfully!");
                                    } else {
                                        alert(data.message || "Failed to add to cart");
                                    }
                                } catch (error) {
                                    console.error(error);
                                    alert("Error adding to cart");
                                }
                            }}
                        >
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <Ionicons name="chevron-forward" size={14} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Comments Modal */}
                <CommentModal
                    visible={showComments}
                    onClose={() => setShowComments(false)}
                    comments={comments}
                    onAddComment={handleAddComment}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

// --- MAIN SCREEN ---
const ReelsScreen = () => {
    const navigation = useNavigation();
    const isScreenFocused = useIsFocused(); // Hook to check if screen is focused
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [userId, setUserId] = useState(null);

    // Get User ID
    useEffect(() => {
        const getUser = async () => {
            const userStr = await AsyncStorage.getItem('userInfo');
            if (userStr) setUserId(JSON.parse(userStr)._id);
        };
        getUser();
    }, []);

    const fetchReels = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/reels`);
            const data = await res.json();
            if (res.ok) {
                setReels(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReels();
        }, [])
    );

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={styles.centered}>
                <Ionicons name="videocam-off-outline" size={60} color="#555" />
                <Text style={styles.emptyText}>No Reels Yet</Text>
                <Text style={styles.subText}>Start scrolling to see products come to life.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reels}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <ReelItem
                        item={item}
                        isActive={index === activeIndex}
                        isScreenFocused={isScreenFocused} // Pass focus state
                        userId={userId}
                        navigation={navigation}
                    />
                )}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={height} // Make sure full screen slide
            />
            {/* Header Overlay */}
            <View style={styles.headerOverlay}>
                <Text style={styles.headerTitle}>Reels</Text>
                <TouchableOpacity onPress={() => fetchReels()}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ReelsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    reelContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    centerHeartContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    gradient: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: '40%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

    // Actions (Right Side)
    actionsContainer: {
        position: 'absolute',
        right: 10,
        bottom: 150, // Above bottom tab
        alignItems: 'center',
        zIndex: 20,
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    // Info (Bottom Left)
    infoContainer: {
        position: 'absolute',
        left: 15,
        right: 80, // Space for right actions
        bottom: 80, // Space for bottom tab
        justifyContent: 'flex-end',
        zIndex: 20,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#fff',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 10,
    },
    followButton: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    followText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    description: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginBottom: 10,
        lineHeight: 20,
    },
    productTitle: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    priceText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    shopNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    shopNowText: {
        color: '#000',
        fontSize: 11,
        fontWeight: 'bold',
        marginRight: 2,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: height * 0.6,
        padding: 20,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    commentList: {
        flex: 1,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    commentAvatarText: {
        fontWeight: 'bold',
        color: '#555',
    },
    commentTextContent: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 12,
        borderTopLeftRadius: 2,
    },
    commentUser: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 4,
    },
    commentTime: {
        fontSize: 10,
        color: '#888',
        alignSelf: 'flex-end',
    },
    noComments: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        color: '#333',
    },
    postText: {
        color: '#007AFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
