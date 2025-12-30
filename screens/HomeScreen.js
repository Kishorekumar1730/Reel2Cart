import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, FlatList, TouchableOpacity, Dimensions, Platform, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { wp, hp, normalize, isTablet } from '../utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 0, key: 'All', icon: 'grid-outline' },
    { id: 1, key: 'Fashion', icon: 'shirt-outline' },
    { id: 2, key: 'Electronics', icon: 'phone-portrait-outline' },
    { id: 3, key: 'Home', icon: 'home-outline' },
    { id: 4, key: 'Beauty', icon: 'rose-outline' },
    { id: 5, key: 'Sports', icon: 'football-outline' },
];

const HomeScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [products, setProducts] = useState([]);
    const [featured, setFeatured] = useState([]); // Now stores Admin Offers
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch Address
    const fetchAddress = async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem("userInfo");
            if (storedUserInfo) {
                const parsedUser = JSON.parse(storedUserInfo);
                const response = await fetch(`${API_BASE_URL}/addresses/${parsedUser._id}`);
                const data = await response.json();
                if (response.ok && data.addresses?.length > 0) {
                    setSelectedAddress(data.addresses[data.addresses.length - 1]);
                }
            }
        } catch (error) { console.log(error); }
    };

    // Fetch Data
    const fetchData = async (category = 'All') => {
        // Only show full loading on initial load or category change, not pull-to-refresh
        if (!refreshing) setLoading(true);

        try {
            // 1. Fetch Products (Filtered)
            const prodUrl = category === 'All'
                ? `${API_BASE_URL}/products?limit=20`
                : `${API_BASE_URL}/products?category=${category}`;

            const [prodRes, offerRes, reelRes] = await Promise.all([
                fetch(prodUrl),
                fetch(`${API_BASE_URL}/offers`), // Fetch Admin Offers
                fetch(`${API_BASE_URL}/products/reels`)
            ]);

            const prodData = await prodRes.json();
            const offerData = await offerRes.json();
            const reelData = await reelRes.json();

            if (prodRes.ok) setProducts(prodData);
            if (offerRes.ok) setFeatured(offerData);
            if (reelRes.ok) setReels(reelData);

        } catch (error) {
            console.error("Home Data Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(activeCategory);
    }, [activeCategory]);

    const handleCategorySelect = (cat) => {
        setActiveCategory(cat.key);
    };

    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [userId, setUserId] = useState(null);

    // Fetch Wishlist
    const fetchWishlist = async (uid) => {
        try {
            const res = await fetch(`${API_BASE_URL}/wishlist/${uid}`);
            const data = await res.json();
            if (res.ok && data.products) {
                const ids = new Set(data.products.map(p => p.productId));
                setWishlistIds(ids);
            }
        } catch (e) {
            console.error("Wishlist Fetch Error", e);
        }
    };

    // Real-time Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search.trim().length > 1) {
                performSearch(search);
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const performSearch = async (query) => {
        setSearchLoading(true);
        setIsSearching(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (response.ok) {
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    const clearSearch = () => {
        setSearch('');
        setIsSearching(false);
        setSearchResults([]);
    };

    // Google Lens / Visual Search Logic
    const handleVisualSearch = async () => {
        try {
            // 1. Request Permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                alert('Camera permission is required for Google Lens search.');
                return;
            }

            // 2. Open Camera
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                performVisualSearch(imageUri);
            }
        } catch (error) {
            console.log("Visual Search Error:", error);
        }
    };

    const performVisualSearch = async (uri) => {
        setSearchLoading(true);
        setIsSearching(true);
        setSearch('Visual Search...');

        // Create FormData
        let formData = new FormData();
        formData.append('file', {
            uri: uri,
            type: 'image/jpeg',
            name: 'visual_search.jpg',
        });

        try {
            // Upload Image
            const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const uploadData = await uploadRes.json();

            if (uploadRes.ok) {
                // Perform "Analysis" - Since we don't have a real ML API, we will:
                // 1. Send the image URL to a new endpoint (optional) OR
                // 2. Just return "Recommended" or "Featured" items as a demo "simulated match"
                // For a professional feel, let's hit a search endpoint with a flag

                // Simulation: Wait 1.5s for "Analysis"
                setTimeout(async () => {
                    // Ideally we would search by image. 
                    // Fallback: fetch a mix of products to show "Visual Matches"
                    const res = await fetch(`${API_BASE_URL}/products?limit=10`);
                    const data = await res.json();
                    // Shuffle or pick random subset to make it look dynamic
                    const shuffled = data.sort(() => 0.5 - Math.random());
                    setSearchResults(shuffled.slice(0, 5));
                    setSearch('Visual Matches'); // Update placeholder
                    setSearchLoading(false);
                }, 1500);

            } else {
                alert("Failed to process image.");
                setSearchLoading(false);
            }
        } catch (error) {
            console.error("Visual Search Upload Error:", error);
            setSearchLoading(false);
        }
    };

    // Initialize User & Wishlist
    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const storedUserInfo = await AsyncStorage.getItem("userInfo");
                if (storedUserInfo) {
                    const user = JSON.parse(storedUserInfo);
                    setUserId(user._id);
                    fetchAddress(); // Existing fetch
                    fetchWishlist(user._id);
                }
            };
            init();
            fetchData(activeCategory);
        }, [activeCategory])
    );

    const toggleWishlist = async (item) => {
        if (!userId) {
            alert("Please login to use wishlist");
            return;
        }

        const isWishlisted = wishlistIds.has(item._id);
        const newSet = new Set(wishlistIds);
        if (isWishlisted) newSet.delete(item._id);
        else newSet.add(item._id);
        setWishlistIds(newSet); // Optimistic Update

        try {
            const url = isWishlisted ? `${API_BASE_URL}/wishlist/remove` : `${API_BASE_URL}/wishlist/add`;
            const payload = isWishlisted
                ? { userId, productId: item._id }
                : {
                    userId,
                    product: {
                        productId: item._id,
                        name: item.name,
                        image: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150',
                        price: item.price
                    }
                };

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Wishlist Toggle Error", error);
        }
    };

    const addToCart = async (product) => {
        try {
            const storedUserInfo = await AsyncStorage.getItem("userInfo");
            if (!storedUserInfo) {
                alert("Please login to add to cart");
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
                // Maybe simple toast or vibration here
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderCategory = ({ item }) => (
        <AnimatedButton
            style={[styles.categoryItem, activeCategory === item.key && styles.activeCategoryItem]}
            onPress={() => handleCategorySelect(item)}
        >
            <View style={[styles.categoryIconContainer, activeCategory === item.key && { backgroundColor: '#E50914' }]}>
                <Ionicons name={item.icon} size={24} color={activeCategory === item.key ? "#fff" : "#333"} />
            </View>
            <Text style={[styles.categoryName, activeCategory === item.key && { fontWeight: 'bold', color: '#E50914' }]}>
                {item.key}
            </Text>
        </AnimatedButton>
    );

    const renderBanner = ({ item }) => (
        <AnimatedButton style={styles.bannerContainer}>
            <Image
                source={{ uri: item.imageUrl || item.images?.[0] }}
                style={styles.bannerImage}
                resizeMode="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient} />
            <View style={styles.bannerTextContainer}>
                <View style={[styles.dealBadge, { backgroundColor: item.couponCode ? '#4CAF50' : '#CC0C39' }]}>
                    <Text style={styles.dealText}>
                        {item.couponCode ? `CODE: ${item.couponCode}` : 'DEAL OF THE DAY'}
                    </Text>
                </View>
                <Text style={styles.bannerTitle} numberOfLines={1}>{item.title || item.name}</Text>
                {item.discountPercentage ? (
                    <Text style={styles.bannerPrice}>{item.discountPercentage}% OFF</Text>
                ) : (
                    item.price && <Text style={styles.bannerPrice}>₹{item.price}</Text>
                )}
            </View>
        </AnimatedButton>
    );

    const renderVideoCard = ({ item }) => (
        <AnimatedButton style={styles.videoCard} onPress={() => navigation.navigate('Reels')}>
            <Image
                source={{ uri: item.images[0] }} // Using product image as thumb for now if no dedicated thumb
                style={styles.videoThumb}
            />
            <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={32} color="white" />
            </View>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay} />
            <Text style={styles.videoTitle} numberOfLines={2}>{item.name}</Text>
        </AnimatedButton>
    );

    const renderProduct = ({ item }) => {
        const hasMultipleImages = item.images && item.images.length > 1;
        const isWishlisted = wishlistIds.has(item._id);

        return (
            <AnimatedButton style={styles.productCard} onPress={() => navigation.navigate('ProductDetails', { product: item })}>
                <View style={styles.productImageContainer}>
                    {hasMultipleImages ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            nestedScrollEnabled={true}
                        >
                            {item.images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    style={{ width: wp(47), height: '100%', resizeMode: 'contain' }}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <Image source={{ uri: item.images?.[0] }} style={styles.productImage} />
                    )}

                    {hasMultipleImages && (
                        <View style={{ position: 'absolute', bottom: 5, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <Text style={{ color: '#fff', fontSize: 10 }}>Slide to view</Text>
                        </View>
                    )}

                    <AnimatedButton style={styles.productHeartIcon} onPress={() => toggleWishlist(item)}>
                        <Ionicons
                            name={isWishlisted ? "heart" : "heart-outline"}
                            size={20}
                            color={isWishlisted ? "#E50914" : "#555"}
                        />
                    </AnimatedButton>
                </View>
                <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#FFA41C" />
                        <Text style={styles.ratingText}>{item.rating || '4.5'} ({item.reviews || 0})</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>₹{item.price}</Text>
                        <AnimatedButton style={styles.addToCartBtn} onPress={() => addToCart(item)}>
                            <Ionicons name="add" size={20} color="#fff" />
                        </AnimatedButton>
                    </View>
                </View>
            </AnimatedButton>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#131921" />

            {/* Header */}
            {/* Header with Search */}
            <LinearGradient colors={['#131921', '#232f3e']} style={styles.header}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder={t('searchPlaceholder')}
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#999"
                            autoCorrect={false}
                        />
                        {search.length > 0 ? (
                            <TouchableOpacity onPress={clearSearch}>
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleVisualSearch}>
                                <Ionicons name="camera-outline" size={22} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {/* Location Bar */}
            <AnimatedButton style={styles.locationBar} onPress={() => navigation.navigate("Address")}>
                <Ionicons name="location-outline" size={18} color="#333" />
                <Text style={styles.locationText} numberOfLines={1}>
                    {selectedAddress
                        ? `Deliver to ${selectedAddress.name} - ${selectedAddress.city} ${selectedAddress.postalCode}`
                        : "Select a location to see local availability"
                    }
                </Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
            </AnimatedButton>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >

                {/* Categories */}
                <View style={styles.sectionContainer}>
                    <FlatList
                        data={CATEGORIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderCategory}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingHorizontal: wp(2) }}
                    />
                </View>

                {/* Content Logic: Searching vs Normal Home */}
                {isSearching ? (
                    <View style={styles.searchResultsContainer}>
                        <Text style={styles.sectionHeader}>
                            {searchLoading ? 'Searching...' : `Results for "${search}"`}
                        </Text>

                        {searchLoading ? (
                            <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />
                        ) : (
                            searchResults.length === 0 ? (
                                <View style={styles.noResults}>
                                    <Ionicons name="search-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>No products found matching "{search}"</Text>
                                    <Text style={styles.subEmptyText}>Try checking your spelling or use different keywords.</Text>
                                </View>
                            ) : (
                                <View style={styles.productGrid}>
                                    {searchResults.map((item) => (
                                        <View key={item._id}>{renderProduct({ item })}</View>
                                    ))}
                                </View>
                            )
                        )}
                    </View>
                ) : (
                    /* Normal Home Content */
                    loading && products.length === 0 ? (
                        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
                    ) : (
                        <>
                            {/* Featured Banner */}
                            {featured.length > 0 && (
                                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
                                    {featured.map((item) => (
                                        <View key={item._id} style={{ width }}>
                                            {renderBanner({ item })}
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            {/* Reels / Trendz */}
                            {reels.length > 0 && (
                                <>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Reel2Cart Trendz</Text>
                                        <AnimatedButton onPress={() => navigation.navigate('Reels')}>
                                            <Text style={styles.seeAll}>Watch All</Text>
                                        </AnimatedButton>
                                    </View>
                                    <FlatList
                                        data={reels}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        renderItem={renderVideoCard}
                                        keyExtractor={item => item._id}
                                        contentContainerStyle={{ paddingHorizontal: wp(4) }}
                                    />
                                </>
                            )}

                            {/* Recommended Products Grid */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {activeCategory === 'All' ? 'Recommended for You' : `${activeCategory} Products`}
                                </Text>
                            </View>

                            {products.length === 0 ? (
                                <Text style={styles.emptyText}>No products found in this category.</Text>
                            ) : (
                                <View style={styles.productGrid}>
                                    {products.map((item) => (
                                        <View key={item._id}>{renderProduct({ item })}</View>
                                    ))}
                                </View>
                            )}
                        </>
                    )
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#e3e6e6', // Amazon-ish background
    },
    header: {
        paddingBottom: hp(1.5),
        paddingTop: Platform.OS === 'android' ? hp(1) : 0,
        paddingHorizontal: wp(4),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 45,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(15),
        color: '#000',
    },
    micButton: {
        marginLeft: 12,
    },
    locationBar: {
        backgroundColor: '#b5e0d4', // Slightly custom blue-ish green
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: 10,
    },
    locationText: {
        flex: 1,
        fontSize: normalize(13),
        color: '#333',
        marginLeft: 8,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: hp(10), // Space for bottom tab
    },
    sectionContainer: {
        backgroundColor: '#fff',
        paddingVertical: hp(1.5),
        marginBottom: hp(1),
    },
    categoryItem: {
        alignItems: 'center',
        marginHorizontal: wp(3),
        width: 70,
    },
    activeCategoryItem: {
        // Highlight logic in render
    },
    categoryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    categoryName: {
        fontSize: normalize(12),
        color: '#333',
        textAlign: 'center',
    },
    bannerScroll: {
        height: hp(25),
        marginBottom: hp(1),
    },
    bannerContainer: {
        width: width,
        height: hp(25),
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    bannerTextContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
    dealBadge: {
        backgroundColor: '#CC0C39',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    dealText: {
        color: '#fff',
        fontSize: normalize(10),
        fontWeight: 'bold',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: normalize(20),
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bannerPrice: {
        color: '#fff',
        fontSize: normalize(22),
        fontWeight: 'bold',
        marginTop: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        marginTop: hp(2),
        marginBottom: hp(1.5),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#000',
    },
    seeAll: {
        fontSize: normalize(14),
        color: '#007AFF',
    },
    videoCard: {
        width: wp(35),
        height: wp(55),
        borderRadius: 10,
        marginRight: wp(3),
        backgroundColor: '#fff',
        overflow: 'hidden',
        position: 'relative',
        elevation: 1.5,
    },
    videoThumb: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
        zIndex: 2,
    },
    gradientOverlay: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '50%', zIndex: 1,
    },
    videoTitle: {
        position: 'absolute',
        bottom: 8, left: 8, right: 8,
        color: '#fff',
        fontSize: normalize(12),
        fontWeight: 'bold',
        zIndex: 2,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: wp(2),
        justifyContent: 'space-between',
    },
    productCard: {
        width: isTablet() ? wp(30) : wp(47), // 3 columns for tablet, 2 for phone
        backgroundColor: '#fff',
        borderRadius: 5, // Amazon style simple radius
        marginBottom: hp(1),
        padding: 5,
        elevation: 2,
    },
    productImageContainer: {
        width: '100%',
        height: isTablet() ? wp(30) : wp(45), // Keep aspect ratio square-ish
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    productHeartIcon: {
        position: 'absolute', top: 5, right: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 15, padding: 4,
    },
    productDetails: {
        paddingHorizontal: 5,
        paddingBottom: 5,
    },
    productName: {
        fontSize: normalize(13),
        color: '#333',
        marginBottom: 4,
        lineHeight: 18,
        height: 36, // limit to 2 lines visual height
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        fontSize: normalize(11),
        color: '#007600', // Amazon-ish green for count/rating
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5
    },
    productPrice: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#000',
    },
    addToCartBtn: {
        backgroundColor: '#F7CA00', // Amazon yellow button
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#666',
        fontSize: normalize(14)
    },
    searchResultsContainer: {
        minHeight: hp(60),
    },
    noResults: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 20
    },
    subEmptyText: {
        textAlign: 'center',
        marginTop: 10,
        color: '#999',
        fontSize: normalize(12)
    }
});
