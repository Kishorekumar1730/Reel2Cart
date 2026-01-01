import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, FlatList, Share, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, normalize } from '../utils/responsive';
import { useCurrency } from '../context/CurrencyContext';
import AnimatedButton from '../components/AnimatedButton';
import { API_BASE_URL } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProductDetailsScreen = ({ route, navigation }) => {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { product } = route.params;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [seller, setSeller] = useState(null);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [userId, setUserId] = useState(null);
    const [userReview, setUserReview] = useState({ rating: 0, text: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [allReviews, setAllReviews] = useState(product.comments || []);
    const [productRating, setProductRating] = useState(product.rating || 0);
    const [productReviewCount, setProductReviewCount] = useState(product.reviews || 0);

    const [cartIds, setCartIds] = useState(new Set());

    // Calculate discount percentage
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : product.discount || 0;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch user info for wishlist
                const storedUserInfo = await AsyncStorage.getItem("userInfo");
                if (storedUserInfo) {
                    const user = JSON.parse(storedUserInfo);
                    setUserId(user._id);
                    checkWishlist(user._id);
                    checkCart(user._id);
                }

                // Determine Seller ID (Handles both populated object or string ID)
                const sId = product.sellerId?._id || product.sellerId;

                if (sId) {
                    const sellerRes = await fetch(`${API_BASE_URL}/seller/profile/${sId}/public`);
                    const sellerData = await sellerRes.json();
                    if (sellerRes.ok) {
                        setSeller(sellerData.seller);
                    }
                }

                // Fetch Similar Products (by category)
                const similarRes = await fetch(`${API_BASE_URL}/products?category=${product.category}&limit=6`);
                const similarData = await similarRes.json();
                if (similarRes.ok) {
                    setSimilarProducts(similarData.filter(p => p._id !== product._id));
                }

                // Fetch Recommended Products (e.g., Featured or Best Sellers)
                const recRes = await fetch(`${API_BASE_URL}/products?featured=true&limit=6`);
                const recData = await recRes.json();
                if (recRes.ok) {
                    // Filter out current product and duplicates from similar list
                    const existingIds = new Set(similarData.map(p => p._id));
                    setRecommendedProducts(recData.filter(p => p._id !== product._id && !existingIds.has(p._id)));
                }

            } catch (error) {
                console.log("Error fetching details", error);
            }
        };

        fetchDetails();
    }, [product]);

    const checkWishlist = async (uid) => {
        try {
            const res = await fetch(`${API_BASE_URL}/wishlist/${uid}`);
            const data = await res.json();
            if (res.ok && data.products) {
                const ids = new Set(data.products.map(p => p.productId));
                setWishlistIds(ids);
            }
        } catch (e) { console.error(e); }
    };

    const checkCart = async (uid) => {
        try {
            const res = await fetch(`${API_BASE_URL}/cart/${uid}`);
            const data = await res.json();
            if (res.ok && data.cartItems) {
                // Assuming cartItems contains objects with productId property or is mixed. 
                // Based on addToCart payload, productId is stored.
                const ids = new Set(data.cartItems.map(item => item.productId || item._id));
                setCartIds(ids);
            }
        } catch (e) { console.error(e); }
    };

    const toggleWishlist = async () => {
        if (!userId) {
            alert(t('loginRequired'));
            return;
        }
        const isWishlisted = wishlistIds.has(product._id);
        const newSet = new Set(wishlistIds);
        if (isWishlisted) newSet.delete(product._id);
        else newSet.add(product._id);
        setWishlistIds(newSet);

        try {
            const url = isWishlisted ? `${API_BASE_URL}/wishlist/remove` : `${API_BASE_URL}/wishlist/add`;
            const payload = isWishlisted
                ? { userId, productId: product._id }
                : {
                    userId,
                    product: {
                        productId: product._id,
                        name: product.name,
                        image: product.images[0],
                        price: product.price
                    }
                };
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) { console.error(error); }
    };

    const addToCart = async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem("userInfo");
            if (!storedUserInfo) {
                alert(t('loginToCart'));
                return;
            }

            if (cartIds.has(product._id)) {
                Alert.alert("Already in Cart", "This item is already in your cart.");
                return;
            }

            const user = JSON.parse(storedUserInfo);
            const payload = {
                userId: user._id,
                product: {
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    quantity: 1,
                    productId: product._id
                }
            };
            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                Alert.alert(t('success'), t('addedToCart'));
                setCartIds(new Set(cartIds).add(product._id)); // Optimistically update
            }
        } catch (error) { console.error(error); }
    };

    const handleSubmitReview = async () => {
        if (!userId) {
            Alert.alert("Login Required", "Please login to write a review.");
            return;
        }
        if (userReview.rating === 0) {
            Alert.alert("Rating Required", "Please tap a star to rate the product.");
            return;
        }
        if (userReview.text.trim().length === 0) {
            Alert.alert("Review Required", "Please write a few words about the product.");
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products/${product._id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    text: userReview.text,
                    rating: userReview.rating
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Real-time update
                setAllReviews(data.comments);
                setProductRating(data.rating); // Update aggregated rating
                setProductReviewCount(data.reviews);
                setUserReview({ rating: 0, text: '' }); // Reset form
                Alert.alert("Success", "Thank you for your review!");
            } else {
                Alert.alert("Error", data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Submit Review Error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${t('checkOut')} ${product.name} ${t('onReel2Cart')} ${t('price')}: ${formatPrice(product.price)}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const onScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveImageIndex(Math.round(index));
    };

    const renderProductCard = ({ item }) => (
        <AnimatedButton
            style={styles.suggestionCard}
            onPress={() => navigation.push('ProductDetails', { product: item })}
        >
            <View style={styles.suggestionImageContainer}>
                <Image source={{ uri: item.images[0] }} style={styles.suggestionImage} />
                {item.discount > 0 && (
                    <View style={styles.cardDiscountBadge}>
                        <Text style={styles.cardDiscountText}>{item.discount}% OFF</Text>
                    </View>
                )}
            </View>
            <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.suggestionRatingRow}>
                    <Ionicons name="star" size={10} color="#FFA41C" />
                    <Text style={styles.suggestionRatingText}>{item.rating || '4.5'}</Text>
                    <Text style={styles.suggestionReviewCount}>({item.reviews || 99})</Text>
                </View>
                <View style={styles.suggestionPriceRow}>
                    <Text style={styles.suggestionPrice}>{formatPrice(item.price)}</Text>
                    {item.originalPrice && (
                        <Text style={styles.suggestionOriginalPrice}>{formatPrice(item.originalPrice)}</Text>
                    )}
                </View>
            </View>
        </AnimatedButton>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                            <Ionicons name="share-social-outline" size={24} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Cart' })} style={styles.headerBtn}>
                            <Ionicons name="cart-outline" size={24} color="#333" />
                            {/* Add Badge if needed */}
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Image Carousel */}
                    <View style={styles.carouselContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                        >
                            {product.images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    style={styles.carouselImage}
                                    resizeMode="contain"
                                />
                            ))}
                        </ScrollView>
                        {/* Pagination Dots */}
                        {product.images.length > 1 && (
                            <View style={styles.pagination}>
                                {product.images.map((_, i) => (
                                    <View key={i} style={[styles.dot, activeImageIndex === i && styles.activeDot]} />
                                ))}
                            </View>
                        )}
                        {/* Wishlist Fab */}
                        <TouchableOpacity style={styles.wishlistFab} onPress={toggleWishlist}>
                            <Ionicons
                                name={wishlistIds.has(product._id) ? "heart" : "heart-outline"}
                                size={24}
                                color={wishlistIds.has(product._id) ? "#E50914" : "#555"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Product Info */}
                    <View style={styles.infoContainer}>
                        <View style={styles.glassCard}>
                            <View style={styles.titleRow}>
                                <Text style={styles.brandText}>{product.category || 'Generic'}</Text>
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.ratingText}>{productRating || 'New'} </Text>
                                    <Ionicons name="star" size={12} color="#fff" />
                                </View>
                            </View>

                            <Text style={styles.productName}>{product.name}</Text>

                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>{formatPrice(product.price)}</Text>
                                {product.originalPrice && (
                                    <>
                                        <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
                                        <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                                    </>
                                )}
                            </View>
                            <Text style={styles.taxText}>{t('inclusiveTaxes')}</Text>

                            <View style={styles.divider} />

                            {/* Features / Details */}
                            <Text style={styles.sectionTitle}>{t('description')}</Text>
                            <Text style={styles.description}>{product.description}</Text>

                            <View style={styles.divider} />

                            {/* Seller Info */}
                            <TouchableOpacity
                                style={styles.sellerRow}
                                onPress={() => seller && navigation.navigate('SellerProfile', { sellerId: seller._id })}
                                disabled={!seller}
                            >
                                <View style={styles.sellerIcon}>
                                    {seller?.profileImage ? (
                                        <Image source={{ uri: seller.profileImage }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    ) : (
                                        <Ionicons name="storefront-outline" size={24} color="#555" />
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.sellerLabel}>{t('soldBy')}</Text>
                                    <Text style={styles.sellerName}>{seller ? (seller.businessName || seller.sellerName) : 'Loading...'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>

                        </View>

                        {/* Customer Reviews Section */}
                        <View style={[styles.glassCard, { marginTop: hp(2) }]}>
                            <Text style={styles.sectionTitle}>{t('customerReviews')} ({productReviewCount})</Text>

                            {/* Write Review Form */}
                            <View style={styles.writeReviewContainer}>
                                <Text style={styles.writeReviewTitle}>{t('rateProduct')}</Text>
                                <View style={styles.starRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setUserReview({ ...userReview, rating: star })}>
                                            <Ionicons
                                                name={star <= userReview.rating ? "star" : "star-outline"}
                                                size={32}
                                                color={star <= userReview.rating ? "#FFA41C" : "#ccc"}
                                                style={{ marginRight: 5 }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Write your review here..."
                                    multiline
                                    numberOfLines={3}
                                    value={userReview.text}
                                    onChangeText={(text) => setUserReview({ ...userReview, text })}
                                />
                                <TouchableOpacity
                                    style={[styles.submitReviewBtn, submittingReview && { opacity: 0.7 }]}
                                    onPress={handleSubmitReview}
                                    disabled={submittingReview}
                                >
                                    {submittingReview ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitReviewText}>{t('submitReview')}</Text>}
                                </TouchableOpacity>
                            </View>

                            {/* Reviews List */}
                            {allReviews && allReviews.length > 0 ? (
                                [...allReviews].reverse().map((comment, index) => (
                                    <View key={index} style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.reviewAvatar}>
                                                <Text style={styles.reviewAvatarText}>{(comment.userName || 'U').charAt(0).toUpperCase()}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.reviewUser}>{comment.userName || 'User'}</Text>
                                                {/* Display User Rating if available */}
                                                <View style={{ flexDirection: 'row' }}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Ionicons
                                                            key={s}
                                                            name="star"
                                                            size={10}
                                                            color={s <= (comment.rating || 5) ? "#FFA41C" : "#e3e3e3"}
                                                        />
                                                    ))}
                                                </View>
                                            </View>
                                        </View>
                                        <Text style={styles.reviewText}>{comment.text}</Text>
                                        <Text style={styles.reviewDate}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                                        {index < allReviews.length - 1 && <View style={styles.reviewDivider} />}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noReviewsText}>{t('noReviewsYet')}</Text>
                            )}
                        </View>


                        {/* Similar Products */}
                        {similarProducts.length > 0 && (
                            <View style={styles.suggestionSection}>
                                <Text style={styles.sectionTitle}>{t('similarProducts')}</Text>
                                <FlatList
                                    horizontal
                                    data={similarProducts}
                                    renderItem={renderProductCard}
                                    keyExtractor={item => item._id}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 5 }}
                                />
                            </View>
                        )}

                        {/* Recommended Products */}
                        {recommendedProducts.length > 0 && (
                            <View style={styles.suggestionSection}>
                                <Text style={styles.sectionTitle}>{t('recommendedForYou')}</Text>
                                <FlatList
                                    horizontal
                                    data={recommendedProducts}
                                    renderItem={renderProductCard}
                                    keyExtractor={item => "rec_" + item._id}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 5 }}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.cartBtn} onPress={addToCart}>
                        <Text style={styles.cartBtnText}>{t('addToCart')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buyBtn} onPress={() => {
                        addToCart(); // Or direct checkout logic
                        navigation.navigate('Home', { screen: 'Cart' });
                    }}>
                        <Text style={styles.buyBtnText}>{t('buyNow')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerBtn: {
        padding: 8,
        marginLeft: 10,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20
    },
    carouselContainer: {
        width: wp(100),
        height: wp(90),
        backgroundColor: 'transparent',
        position: 'relative',
        alignItems: 'center',
        paddingVertical: 10,
    },
    carouselImage: {
        width: wp(90),
        height: '100%',
        borderRadius: 20,
        marginHorizontal: wp(5),
    },
    pagination: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#E50914',
    },
    wishlistFab: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 25,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    infoContainer: {
        padding: wp(4),
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.65)',
        borderRadius: 20,
        padding: wp(4),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandText: {
        fontSize: normalize(14),
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        color: '#fff',
        fontSize: normalize(12),
        fontWeight: 'bold',
        marginRight: 2,
    },
    productName: {
        fontSize: normalize(18),
        color: '#222',
        fontWeight: '600',
        marginBottom: 10,
        lineHeight: 24,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: normalize(24),
        color: '#000',
        fontWeight: 'bold',
    },
    originalPrice: {
        fontSize: normalize(16),
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 10,
    },
    discountText: {
        fontSize: normalize(16),
        color: '#CC0C39', // Amazon red
        fontWeight: 'bold',
        marginLeft: 10,
    },
    taxText: {
        fontSize: normalize(12),
        color: '#666',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: normalize(14),
        color: '#444',
        lineHeight: 22,
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    sellerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sellerLabel: {
        fontSize: normalize(11),
        color: '#888',
    },
    sellerName: {
        fontSize: normalize(14),
        color: '#333',
        fontWeight: '600',
    },
    reviewItem: {
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    reviewAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    reviewAvatarText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    reviewUser: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#333',
    },
    reviewText: {
        fontSize: normalize(13),
        color: '#444',
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: 10,
        color: '#999',
    },
    writeReviewContainer: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee'
    },
    writeReviewTitle: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    starRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    reviewInput: {
        backgroundColor: '#fff',
        borderRadius: 4,
        padding: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        marginBottom: 10,
        textAlignVertical: 'top',
        minHeight: 60
    },
    submitReviewBtn: {
        backgroundColor: '#E50914',
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center'
    },
    submitReviewText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(13)
    },
    noReviewsText: {
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10
    },
    reviewDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 8,
    },
    similarCard: {
        width: wp(35),
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    similarImage: {
        width: '100%',
        height: wp(35),
        resizeMode: 'contain',
        marginBottom: 8,
    },
    similarTitle: {
        fontSize: normalize(12),
        color: '#333',
        marginBottom: 4,
    },
    similarPrice: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#000',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.5)',
        elevation: 10,
    },
    cartBtn: {
        flex: 1,
        backgroundColor: '#FFD814', // Amazon yellow
        paddingVertical: 12,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        elevation: 2,
    },
    cartBtnText: {
        color: '#000',
        fontSize: normalize(15),
        fontWeight: '500',
    },
    buyBtn: {
        flex: 1,
        backgroundColor: '#FFA41C', // Amazon orange
        paddingVertical: 12,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    buyBtnText: {
        color: '#000',
        fontSize: normalize(15),
        fontWeight: '500',
    },
    suggestionSection: {
        marginTop: 15,
        marginBottom: 10
    },
    suggestionCard: {
        width: wp(40),
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fff',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    suggestionImageContainer: {
        width: '100%',
        height: wp(40),
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    suggestionImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    cardDiscountBadge: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: '#CC0C39',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    cardDiscountText: {
        color: '#fff',
        fontSize: normalize(10),
        fontWeight: 'bold',
    },
    suggestionInfo: {
        padding: 8,
    },
    suggestionTitle: {
        fontSize: normalize(12),
        color: '#333',
        marginBottom: 4,
        height: 32,
    },
    suggestionRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    suggestionRatingText: {
        fontSize: normalize(10),
        color: '#555',
        marginLeft: 2,
        marginRight: 2,
    },
    suggestionReviewCount: {
        fontSize: normalize(10),
        color: '#999',
    },
    suggestionPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionPrice: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#000',
    },
    suggestionOriginalPrice: {
        fontSize: normalize(10),
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 4,
    },
});

export default ProductDetailsScreen;
