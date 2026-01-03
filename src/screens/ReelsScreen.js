import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, FlatList,
    Image, TouchableOpacity, ActivityIndicator,
    TextInput, Modal, Share, KeyboardAvoidingView, Platform,
    TouchableWithoutFeedback, Animated, StatusBar
} from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';

import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect, useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useCurrency } from '../context/CurrencyContext';
import { useAlert } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

// --- COMMENT MODAL COMPONENT ---
const CommentModal = ({ visible, onClose, comments, onAddComment, loading }) => {
    const { t } = useLanguage();
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
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    {/* Handle Bar */}
                    <View style={styles.modalHandle} />

                    <Text style={styles.modalTitle}>{t('comments')} ({comments.length})</Text>

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
                            <Text style={styles.noComments}>{t('beFirstComment')}</Text>
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
                                placeholder={t('addComment')}
                                value={text}
                                onChangeText={setText}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!text.trim() || loading}
                            >
                                <Text style={[styles.postText, !text.trim() && { color: '#ccc' }]}>{t('post')}</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// --- SINGLE REEL ITEM ---
const ReelItem = ({ item, isActive, isScreenFocused, userId, navigation }) => {
    const { language, t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { showAlert, showSuccess } = useAlert();
    const insets = useSafeAreaInsets();

    const getVideoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('file://')) return url;
        return `${API_BASE_URL}/${url}`;
    };

    const finalVideoUrl = getVideoUrl(item.videoUrl);

    const player = useVideoPlayer(finalVideoUrl, player => {
        player.loop = true;
    });

    const [isLiked, setIsLiked] = useState(item.likes?.includes(userId));
    const [likesCount, setLikesCount] = useState(item.likes?.length || 0);
    const [comments, setComments] = useState(item.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;

    const toggleDescription = useCallback(() => {
        setExpanded(!expanded);
    }, [expanded]);

    // Playback State
    const [manualPause, setManualPause] = useState(false);

    const lastTap = useRef(null);
    const tapTimeout = useRef(null);

    // Sync Follow Status
    useEffect(() => {
        if (userId && item.sellerId && item.sellerId.followers) {
            const followers = item.sellerId.followers;
            if (Array.isArray(followers)) {
                setIsFollowing(followers.includes(userId));
            }
        }
    }, [item, userId]);

    const handleFollow = async () => {
        if (!userId) {
            Alert.alert(
                t('loginRequiredTitle'),
                t('loginRequiredFollow'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('login'), onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }
        const sellerId = item.sellerId?._id || item.sellerId;

        if (!sellerId) return;

        const newStatus = !isFollowing;
        setIsFollowing(newStatus);

        try {
            await fetch(`${API_BASE_URL}/seller/follow/${sellerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
        } catch (error) {
            console.error("Follow Error", error);
            setIsFollowing(!newStatus);
        }
    };

    // Real-time Reflection: Check status on focus
    const checkFollowStatus = useCallback(async () => {
        const sId = item.sellerId?._id || item.sellerId;
        if (!userId || !sId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/seller/profile/${sId}/public`);
            if (res.ok) {
                const data = await res.json();
                if (data.seller && Array.isArray(data.seller.followers)) {
                    setIsFollowing(data.seller.followers.includes(userId));
                }
            }
        } catch (error) {
            // Silent fail
        }
    }, [item.sellerId, userId]);

    useEffect(() => {
        if (isScreenFocused) {
            checkFollowStatus();
        }
    }, [isScreenFocused, checkFollowStatus]);

    useEffect(() => {
        if (!player) return;

        if (isActive && isScreenFocused) {
            if (manualPause) {
                player.pause();
            } else {
                player.play();
            }
        } else {
            player.pause();
            // Optional: Rewind when scrolling away to restart when coming back
            if (!isActive) { // only reset if moved to another reel
                player.currentTime = 0;
            }
        }
    }, [isActive, isScreenFocused, manualPause, player]);

    const toggleLike = async () => {
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikesCount(prev => newStatus ? prev + 1 : prev - 1);

        if (newStatus) {
            Animated.sequence([
                Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
                Animated.timing(heartScale, { toValue: 0, duration: 200, delay: 500, useNativeDriver: true })
            ]).start();
        }

        try {
            await fetch(`${API_BASE_URL}/products/${item._id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (newStatus) {
                const productPayload = {
                    productId: item._id,
                    name: item.name,
                    image: item.images?.[0] || 'https://via.placeholder.com/150',
                    price: item.price
                };
                await fetch(`${API_BASE_URL}/wishlist/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, product: productPayload })
                });
            } else {
                await fetch(`${API_BASE_URL}/wishlist/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, productId: item._id })
                });
            }
        } catch (error) {
            console.error("Like/Wishlist error", error);
        }
    };

    const handlePress = () => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;

        if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
            if (tapTimeout.current) clearTimeout(tapTimeout.current);
            lastTap.current = null;
            if (!isLiked) toggleLike();
            else {
                Animated.sequence([
                    Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
                    Animated.timing(heartScale, { toValue: 0, duration: 200, delay: 500, useNativeDriver: true })
                ]).start();
            }
        } else {
            lastTap.current = now;
            tapTimeout.current = setTimeout(() => {
                setManualPause(prev => !prev);
                lastTap.current = null;
            }, DOUBLE_PRESS_DELAY);
        }
    };

    const handleAddComment = async (text) => {
        const newComment = {
            userId: userId,
            userName: "You", // This should ideally come from user's profile
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
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments);
            }
        } catch (error) {
            console.error("Comment error", error);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${t('checkOut')}: ${item.name} - ${formatPrice(item.price)}\n${item.videoUrl}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.reelContainer}>
                <VideoView
                    style={styles.video}
                    player={player}
                    contentFit="cover"
                    nativeControls={false}
                />

                {/* Animated Heart Overlay */}
                <View style={styles.centerOverlay} pointerEvents="none">
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Ionicons name="heart" size={100} color="rgba(255,255,255,0.9)" />
                    </Animated.View>
                </View>

                {/* Play/Pause Overlay */}
                {manualPause && (
                    <View style={styles.centerOverlay} pointerEvents="none">
                        <View style={styles.playPauseBackdrop}>
                            <Ionicons name="play" size={50} color="rgba(255,255,255,0.95)" style={{ marginLeft: 6 }} />
                        </View>
                    </View>
                )}

                {/* Gradients */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'transparent']}
                    style={styles.topGradient}
                    pointerEvents="none"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={styles.bottomGradient}
                    pointerEvents="none"
                />

                {/* --- UI Content Wrapper --- */}
                {/* Lifted up significantly to be 'responsive' and not 'too bottom' */}
                <View style={[styles.contentWrapper, { paddingBottom: insets.bottom + 50 }]}>

                    {/* Left Side Info */}
                    <View style={styles.leftColumn}>

                        {/* User Profile */}
                        <TouchableOpacity
                            style={styles.profileRow}
                            onPress={() => item.sellerId?._id && navigation.navigate("SellerProfile", { sellerId: item.sellerId._id })}
                        >
                            <View style={styles.avatarBorder}>
                                {item.sellerId?.profileImage ? (
                                    <Image source={{ uri: item.sellerId.profileImage }} style={styles.profileImage} />
                                ) : (
                                    <View style={[styles.profileImage, styles.placeholderAvatar]}>
                                        <Text style={styles.placeholderText}>
                                            {(item.sellerId?.businessName || item.category || 'S').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                {/* Follow Badge (Optional) */}
                                <View style={styles.followBadge}>
                                    <Ionicons name="add" size={10} color="#fff" />
                                </View>
                            </View>
                            <Text style={styles.username}>
                                {item.sellerId?.businessName || `${item.category} Seller`}
                            </Text>
                            {String(item.sellerId?._id || item.sellerId) !== String(userId) && (
                                <TouchableOpacity
                                    style={[styles.followBtnSmall, isFollowing && styles.followingBtnSmall]}
                                    onPress={handleFollow}
                                >
                                    <Text style={[styles.followBtnText, isFollowing && { color: '#334155' }]}>
                                        {isFollowing ? t('following') : t('follow')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {/* Description */}
                        <Reanimated.View layout={LinearTransition} style={styles.textContainer}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            {item.description && (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={toggleDescription}
                                    style={{ marginTop: 4 }}
                                >
                                    <Text
                                        style={styles.itemDesc}
                                        numberOfLines={expanded ? undefined : 2}
                                        ellipsizeMode="tail"
                                    >
                                        {item.description}
                                        {!expanded && item.description.length > 60 && '... more'}
                                    </Text>
                                    {/* Optional Explicit more/less Indicator if strictly needed 
                                     <Text style={{color: '#ccc', fontSize: 12}}>
                                       {expanded ? 'less' : 'more'}
                                     </Text> 
                                    */}
                                </TouchableOpacity>
                            )}
                        </Reanimated.View>

                        {/* Price & CTA */}
                        <View style={styles.priceRow}>
                            <View style={styles.pricePill}>
                                <Text style={styles.mainPrice}>{formatPrice(item.price)}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.buyButton}
                                onPress={async () => {
                                    if (!userId) {
                                        Alert.alert(
                                            t('loginRequiredTitle'),
                                            t('loginRequiredCart'),
                                            [
                                                { text: t('cancel'), style: 'cancel' },
                                                { text: t('login'), onPress: () => navigation.navigate('Login') }
                                            ]
                                        );
                                        return;
                                    }
                                    try {
                                        const payload = {
                                            userId: userId,
                                            product: {
                                                name: item.name,
                                                price: item.price,
                                                image: item.images?.[0] || 'https://via.placeholder.com/150',
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
                                            showSuccess(t('addedToCartSuccess'));
                                        } else {
                                            showAlert(t('error'), data.message || t('failedAddToCart'));
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        showAlert(t('error'), t('somethingWentWrong'));
                                    }
                                }}
                            >
                                <Text style={styles.buyButtonText}>{t('addToCart') || 'Add to Cart'}</Text>
                                <Ionicons name="cart" size={16} color="#000" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Right Side Actions */}
                    <View style={styles.rightColumn}>
                        <TouchableOpacity style={styles.iconButton} onPress={toggleLike}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={32}
                                color={isLiked ? "#E50914" : "#fff"}
                                style={styles.iconShadow}
                            />
                            <Text style={styles.iconLabel}>{likesCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={() => setShowComments(true)}>
                            <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={30}
                                color="#fff"
                                style={styles.iconShadow}
                            />
                            <Text style={styles.iconLabel}>{comments.length}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                            <Ionicons
                                name="paper-plane-outline"
                                size={30}
                                color="#fff"
                                style={styles.iconShadow}
                            />
                            <Text style={styles.iconLabel}>{t('shareLabel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("ProductDetails", { product: item })}>
                            <Ionicons
                                name="ellipsis-horizontal-circle-outline"
                                size={32}
                                color="#fff"
                                style={styles.iconShadow}
                            />
                            <Text style={styles.iconLabel}>{t('moreLabel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Comment Modal */}
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



// ... (ReelItem component remains unchanged)

// --- MAIN SCREEN ---
const ReelsScreen = () => {
    const { t } = useLanguage();
    const navigation = useNavigation();
    const route = useRoute(); // Get route
    const isScreenFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null); // Ref for FlatList

    // Params from navigation (e.g. from SellerProfile)
    const { initialReels, initialIndex } = route.params || {};

    const [reels, setReels] = useState([]);
    const [sourceReels, setSourceReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
    const [userId, setUserId] = useState(null);

    const ignoreInitialScroll = useRef(initialIndex > 0);

    // Ensure unique keys for infinite loop
    const addUniqueKeys = useCallback((list) => {
        return list.map(item => ({
            ...item,
            _listId: Math.random().toString(36).substr(2, 9) + '-' + Date.now() + '-' + item._id
        }));
    }, []);

    const handleLoadMore = () => {
        if (sourceReels.length === 0) return;
        const nextBatch = addUniqueKeys([...sourceReels]);
        setReels(prev => [...prev, ...nextBatch]);
    };

    // Viewability Config
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (ignoreInitialScroll.current) return;

        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80
    }).current;

    useEffect(() => {
        if (initialIndex > 0) {
            const timer = setTimeout(() => {
                ignoreInitialScroll.current = false;
            }, 1200);
            return () => clearTimeout(timer);
        } else {
            ignoreInitialScroll.current = false;
        }
    }, [initialIndex]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem('userInfo');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setUserId(user._id);
                } else {
                    const id = await AsyncStorage.getItem('userId');
                    if (id) setUserId(id);
                }
            } catch (e) {
                console.error("Failed to load user info", e);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (initialReels && initialReels.length > 0) {
            setSourceReels(initialReels);
            setReels(addUniqueKeys(initialReels));
            setLoading(false);
        } else {
            console.log("Fetching default reels...");
            fetch(`${API_BASE_URL}/products`)
                .then(res => res.json())
                .then(data => {
                    const products = Array.isArray(data) ? data : (data.products || []);
                    const videoProducts = products.filter(p => p.videoUrl);

                    const shuffled = videoProducts.sort(() => Math.random() - 0.5);

                    setSourceReels(shuffled);
                    setReels(addUniqueKeys(shuffled));
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching reels:", err);
                    setLoading(false);
                });
        }
    }, [initialReels]);

    // Sync active index if params change (handle stale screen case)
    useEffect(() => {
        if (initialIndex !== undefined && reels.length > 0) {
            setActiveIndex(initialIndex);
            if (flatListRef.current) {
                setTimeout(() => {
                    flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
                }, 100);
            }
        }
    }, [initialIndex, reels.length === 0]);

    if (loading || reels.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.centerContainer, { paddingTop: 100 }]}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Custom Header with Back Button */}
            <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('reelsTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                ref={flatListRef}
                key={`reels-list-${initialIndex}-${reels.length > 0 ? 'loaded' : 'loading'}`}
                data={reels}
                keyExtractor={(item) => item._listId}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={1}
                renderItem={({ item, index }) => (
                    <ReelItem
                        item={item}
                        isActive={index === activeIndex}
                        isScreenFocused={isScreenFocused}
                        userId={userId}
                        navigation={navigation}
                    />
                )}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={height}
                disableIntervalMomentum={true}
                initialScrollIndex={initialIndex || 0}
                getItemLayout={(data, index) => ({
                    length: height,
                    offset: height * index,
                    index,
                })}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    });
                }}
                removeClippedSubviews={Platform.OS === 'android'} // Memory optimization
            />
        </View>
    );
};

export default ReelsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    reelContainer: {
        width: width,
        height: height,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    centerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    playPauseBackdrop: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(5px)', // Works on some versions
    },
    topGradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 150,
        zIndex: 5,
    },
    bottomGradient: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: 350,
        zIndex: 5,
    },

    // Header
    headerContainer: {
        position: 'absolute',
        left: 0, right: 0,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
        textShadowOffset: { width: 0, height: 1 }
    },

    // Main Content Overlay Logic
    contentWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        // The paddingBottom is dynamically set in code + insets
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        zIndex: 20,
    },
    leftColumn: {
        flex: 1,
        marginRight: 60, // Space for right actions
        justifyContent: 'flex-end',
        paddingBottom: 10,
    },
    rightColumn: {
        width: 50,
        alignItems: 'center',
        paddingBottom: 20,
    },

    // User Profile in Left Column
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarBorder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        borderColor: '#fff',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    profileImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    placeholderAvatar: {
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    followBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#E50914',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },
    username: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginRight: 10,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 3,
        textShadowOffset: { width: 0, height: 1 }
    },
    followBtnSmall: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    followingBtnSmall: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    followBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600'
    },

    // Description
    textContainer: {
        marginBottom: 12,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 3,
        textShadowOffset: { width: 0, height: 1 }
    },
    itemDesc: {
        color: '#e0e0e0',
        fontSize: 13,
        lineHeight: 18,
    },

    // Price & CTA
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    pricePill: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10
    },
    mainPrice: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    buyButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4
    },
    buyButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 13,
    },

    // Right Icons
    iconButton: {
        alignItems: 'center',
        marginBottom: 22,
    },
    iconShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 }
    },
    iconLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 3,
        textShadowOffset: { width: 0, height: 1 }
    },

    // Empty/Loading
    emptyText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 15,
        fontWeight: '600'
    },

    // Modal
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
    commentList: { flex: 1 },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    commentAvatarText: { fontWeight: 'bold', color: '#555' },
    commentTextContent: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 12,
    },
    commentUser: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    commentText: { fontSize: 14, color: '#444' },
    commentTime: { fontSize: 10, color: '#888', alignSelf: 'flex-end' },
    noComments: { textAlign: 'center', color: '#888', marginTop: 20 },
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
    postText: { color: '#E50914', fontWeight: 'bold', fontSize: 16 },
});
