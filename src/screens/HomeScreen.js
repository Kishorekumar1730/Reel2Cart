import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, FlatList, TouchableOpacity, Dimensions, Platform, StatusBar, ActivityIndicator, RefreshControl, Modal, Animated, LayoutAnimation, UIManager } from 'react-native';

import { wp, hp, normalize } from '../utils/responsive';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FadeInView = ({ delay = 0, style, children }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay]);

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
};
import AnimatedButton from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { isTablet } from '../utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // Add Location



const { width, height } = Dimensions.get('window');

const ALL_COUNTRIES = [
    { code: 'Global', name: 'Global Store', flag: '🌍' },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', flag: '🇦🇱' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'USA', name: 'United States', flag: '🇺🇸' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' }
];

const CATEGORIES = [
    { id: 0, key: 'all', value: 'all', icon: 'grid-outline' },
    { id: 1, key: 'catFashion', value: 'Fashion', icon: 'shirt-outline' },
    { id: 2, key: 'catElectronics', value: 'Electronics', icon: 'phone-portrait-outline' },
    { id: 3, key: 'catHome', value: 'Home', icon: 'home-outline' },
    { id: 4, key: 'catBeauty', value: 'Beauty', icon: 'lipstick', type: 'MaterialCommunityIcons' },
    { id: 5, key: 'catSports', value: 'Sports', icon: 'football-outline' },
];

const SkeletonItem = ({ style }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7]
    });

    return <Animated.View style={[{ backgroundColor: '#ccc', opacity, borderRadius: 4 }, style]} />;
};

const ProductCard = React.memo(({ item, index, navigation, toggleWishlist, isWishlisted, formatPrice, addToCart }) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(50)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 50, // Fast stagger
                useNativeDriver: true
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: index * 50,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    const onHeartPress = () => {
        Animated.sequence([
            Animated.spring(scaleValue, { toValue: 1.3, useNativeDriver: true, speed: 60, bounciness: 10 }),
            Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 10 })
        ]).start();
        toggleWishlist(item);
    };

    const hasMultipleImages = item.images && item.images.length > 1;

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
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
                            <Text style={{ color: '#fff', fontSize: 10 }}>{t('slideView')}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.productHeartIcon} onPress={onHeartPress}>
                        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                            <Ionicons
                                name={isWishlisted ? "heart" : "heart-outline"}
                                size={20}
                                color={isWishlisted ? "#E50914" : "#555"}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
                <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#FFA41C" />
                        <Text style={styles.ratingText}>{item.rating || '4.5'} ({item.reviews || 0})</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                        <AnimatedButton style={styles.addToCartBtn} onPress={() => addToCart(item)}>
                            <Ionicons name="add" size={20} color="#fff" />
                        </AnimatedButton>
                    </View>
                </View>
            </AnimatedButton>
        </Animated.View>
    );
});

const HomeScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [products, setProducts] = useState([]);
    const [featured, setFeatured] = useState([]); // Now stores Admin Offers
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Location State
    const { region, changeRegion, formatPrice, setCurrencyByCountry } = useCurrency();
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [countrySearch, setCountrySearch] = useState(''); // New search state

    // Filtered Countries
    const filteredCountries = ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );

    // Fetch Address (Existing)
    const fetchAddress = async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem("userInfo");
            if (storedUserInfo) {
                const parsedUser = JSON.parse(storedUserInfo);
                const response = await fetch(`${API_BASE_URL}/addresses/${parsedUser._id}`);
                const data = await response.json();
                if (response.ok && data.addresses?.length > 0) {
                    const latestAddress = data.addresses[data.addresses.length - 1];
                    setSelectedAddress(latestAddress);
                    // Update Currency based on this address if needed (e.g. if we are in Global region but have a localized address)
                    if (latestAddress.country) {
                        setCurrencyByCountry(latestAddress.country);
                    }
                }
            }
        } catch (error) { console.log(error); }
    };

    // Fetch Data
    const fetchData = async (category = 'all') => {
        if (!refreshing) setLoading(true);

        try {
            // Apply Country Filter
            // We pass the country NAME (e.g. 'India') because that's likely what we save in DB?
            // Wait, AddProduct used 'India' from manual input? Or did I add a dropdown?
            // In AddProduct I added a text input "e.g. India".
            // So if user typed "India", backend has "India".
            // Here my country.code is 'IN' for India.
            // So I MUST pass country.name (e.g. 'India').
            // Exception: For Global, my object is { code: 'Global', name: 'Global Store' }.
            // Strict check: if code is 'Global', use 'Global'. Else use region.name.
            // Strict check: if code is 'Global', use 'Global'. Else use region.name.
            const countryFilter = region.code === 'Global' ? 'Global' : region.name;

            // Resolve Category Key to Value
            const selectedCat = CATEGORIES.find(c => c.key === category);
            const categoryValue = selectedCat ? (selectedCat.value || 'all') : 'all';

            let prodUrl = `${API_BASE_URL}/products?country=${countryFilter}`;
            if (categoryValue !== 'all') prodUrl += `&category=${categoryValue}`;
            prodUrl += '&limit=20';

            const [prodRes, offerRes, reelRes] = await Promise.all([
                fetch(prodUrl),
                fetch(`${API_BASE_URL}/offers`),
                fetch(`${API_BASE_URL}/products/reels?country=${countryFilter}`) // Added country filter to reels
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveCategory(cat.key);
    };

    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [userId, setUserId] = useState(null);

    const [cartIds, setCartIds] = useState(new Set());

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

    const checkCart = async (uid) => {
        try {
            const res = await fetch(`${API_BASE_URL}/cart/${uid}`);
            const data = await res.json();
            if (res.ok && data.cartItems) {
                const ids = new Set(data.cartItems.map(item => item.productId || item._id));
                setCartIds(ids);
            }
        } catch (e) { console.error(e); }
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
                    fetchAddress();
                    fetchWishlist(user._id);
                    checkCart(user._id);
                }
                // TRIGGER DATA FETCH WHEN SCREEN IS FOCUSED OR COUNTRY CHANGES
                fetchData(activeCategory);
            };
            init();

        }, [activeCategory, region]) // Re-fetch when country changes
    );

    // Initial Country Detection removed - Handled by Context or User Selection
    // If you want auto-detect, implement it here to call changeRegion(detected) once
    useEffect(() => {
        fetchData(activeCategory);
    }, [region]);


    const handleCountrySelect = async (item) => {
        changeRegion(item);
        setIsCountryModalVisible(false); // Close modal

        // Update User Profile location on backend if logged in
        if (userId) {
            fetch(`${API_BASE_URL}/user/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, country: item.code })
            });
        }
    };

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

            if (cartIds.has(product._id)) {
                // Using React Native Alert for consistency with ProductDetailsScreen
                const { Alert } = require('react-native');
                Alert.alert(t('alreadyInCart'), t('itemAlreadyInCart'));
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
                const { Alert } = require('react-native');
                Alert.alert(t('success'), t('addedToCartSuccess'));
                setCartIds(new Set(cartIds).add(product._id)); // Optimistically update
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
                {item.type === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons name={item.icon} size={24} color={activeCategory === item.key ? "#fff" : "#333"} />
                ) : (
                    <Ionicons name={item.icon} size={24} color={activeCategory === item.key ? "#fff" : "#333"} />
                )}
            </View>
            <Text style={[styles.categoryName, activeCategory === item.key && { fontWeight: 'bold', color: '#E50914' }]}>
                {t(item.key)}
            </Text>
        </AnimatedButton>
    );

    const renderBanner = ({ item }) => (
        <View style={styles.bannerContainer}>
            <AnimatedButton style={styles.bannerCard} scaleTo={0.98}>
                <Image
                    source={{ uri: item.imageUrl || item.images?.[0] }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
                    style={styles.bannerGradient}
                />

                <View style={styles.bannerTextContainer}>
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>
                            {item.couponCode ? `CODE: ${item.couponCode}` : t('limitedOffer')}
                        </Text>
                    </View>

                    <Text style={styles.bannerTitle} numberOfLines={2}>
                        {item.title || item.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        {item.discountPercentage ? (
                            <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
                        ) : (
                            item.price && <Text style={styles.bannerPrice}>{formatPrice(item.price)}</Text>
                        )}
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginHorizontal: 8 }} />
                        <Text style={styles.timeText}>{t('expiresMidnight')}</Text>
                    </View>
                </View>
            </AnimatedButton>
        </View>
    );

    const renderVideoCard = ({ item, index }) => (
        <AnimatedButton
            style={styles.videoCard}
            onPress={() => navigation.push('ReelsScreen', {
                initialReels: reels, // Pass the full list so user can scroll
                initialIndex: index  // Start exactly at this video
            })}
        >
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

    const renderProduct = ({ item, index }) => {
        const isWishlisted = wishlistIds.has(item._id);
        return (
            <ProductCard
                item={item}
                index={index}
                navigation={navigation}
                toggleWishlist={toggleWishlist}
                isWishlisted={isWishlisted}
                formatPrice={formatPrice}
                addToCart={addToCart}
            />
        );
    };

    // AI FAB Animation
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08, // Softer pulse
                    duration: 1500, // Slower breath
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

                {/* Header with Search & Region */}
                <View style={styles.header}>
                    <View style={styles.searchRow}>

                        {/* Search Bar */}
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

                        {/* Region Selector (Right Side) */}
                        <TouchableOpacity style={styles.regionSelector} onPress={() => setIsCountryModalVisible(true)}>
                            <Text style={{ fontSize: 18 }}>{region.flag}</Text>
                            <Text style={{ fontSize: 12, color: '#333', fontWeight: 'bold', marginHorizontal: 2 }}>
                                {region.code === 'Global' ? 'GL' : region.code}
                            </Text>
                            <Ionicons name="caret-down" size={10} color="#555" />
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Address Bar (Separate) */}
                <AnimatedButton style={styles.addressBar} onPress={() => navigation.navigate("Address")}>
                    <Ionicons name="location-outline" size={18} color="#333" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {selectedAddress
                                ? `${t('deliverTo')} ${selectedAddress.name} - ${selectedAddress.city} ${selectedAddress.postalCode}`
                                : t('selectLocationAvailability')
                            }
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#333" />
                </AnimatedButton>

                <FlatList
                    data={isSearching ? searchResults : products}
                    keyExtractor={(item) => item._id}
                    key={isSearching ? 'search-list' : 'home-list'} // Force re-render on mode switch
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: wp(2) }}
                    contentContainerStyle={{ paddingBottom: 130 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

                    // HEADER: Categories, Banners, Reels, Section Titles
                    ListHeaderComponent={
                        <View>
                            {/* Categories */}
                            <FadeInView delay={0}>
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
                            </FadeInView>

                            {/* Search Header Text */}
                            {isSearching && (
                                <FadeInView delay={100} style={{ paddingHorizontal: wp(4), marginTop: 10 }}>
                                    <Text style={styles.sectionHeader}>
                                        {searchLoading ? t('searching') : `${t('resultsFor').replace('{query}', search)}`}
                                    </Text>
                                    {searchLoading && <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />}
                                </FadeInView>
                            )}

                            {/* Normal Home Headers (Banners, Reels) */}
                            {!isSearching && (
                                <>
                                    {/* Featured Banner */}
                                    {featured.length > 0 && (
                                        <FadeInView delay={200}>
                                            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
                                                {featured.map((item) => (
                                                    <View key={item._id} style={{ width }}>
                                                        {renderBanner({ item })}
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </FadeInView>
                                    )}

                                    {/* Reels / Trendz */}
                                    {reels.length > 0 && (
                                        <FadeInView delay={300}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionTitle}>{t('shopflixTrendz')}</Text>
                                                <AnimatedButton onPress={() => navigation.push('ReelsScreen')}>
                                                    <Text style={styles.seeAll}>{t('seeAll')}</Text>
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
                                        </FadeInView>
                                    )}

                                    {/* Recommended Section Title */}
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>
                                            {activeCategory === 'all' ? t('recommended') : t(activeCategory)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    }

                    // RENDER ITEM (Product)
                    renderItem={({ item, index }) => {
                        // Don't render items if search is loading (header handles spinner)
                        if (isSearching && searchLoading) return null;
                        return renderProduct({ item, index });
                    }}

                    // EMPTY STATE
                    ListEmptyComponent={
                        isSearching ? (
                            !searchLoading && (
                                <View style={styles.noResults}>
                                    <Ionicons name="search-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>No products found matching "{search}"</Text>
                                    <Text style={styles.subEmptyText}>Try checking your spelling or use different keywords.</Text>
                                </View>
                            )
                        ) : (
                            // Normal Home Empty State
                            loading ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: wp(2) }}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <View key={i} style={[styles.productCard, { backgroundColor: '#fff', elevation: 0 }]}>
                                            <SkeletonItem style={{ width: '100%', height: isTablet() ? wp(30) : wp(45), marginBottom: 8 }} />
                                            <View style={{ paddingHorizontal: 5 }}>
                                                <SkeletonItem style={{ width: '90%', height: 15, marginBottom: 5 }} />
                                                <SkeletonItem style={{ width: '60%', height: 15 }} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Image
                                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }}
                                        style={styles.emptyImage}
                                    />
                                    <Text style={styles.emptyTitle}>No items in {region.name}</Text>
                                    <Text style={styles.emptySubTitle}>
                                        We couldn't find any products or reels in this region yet.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.globalButton}
                                        onPress={() => changeRegion({ code: 'Global', name: 'Global Store', flag: '🌍' })}
                                    >
                                        <Text style={styles.globalButtonText}>Switch to Global Store 🌍</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        )
                    }
                />

                {/* Country Selector Modal */}
                <Modal
                    visible={isCountryModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsCountryModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Region</Text>
                                <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            {/* Country Search Bar */}
                            <View style={styles.countrySearchContainer}>
                                <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
                                <TextInput
                                    placeholder="Search Country..."
                                    style={styles.countrySearchInput}
                                    value={countrySearch}
                                    onChangeText={setCountrySearch}
                                    autoCorrect={false}
                                />
                            </View>

                            <FlatList
                                data={filteredCountries}
                                keyExtractor={item => item.code}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.countryItem, region.code === item.code && styles.selectedCountry]}
                                        onPress={() => handleCountrySelect(item)}
                                    >
                                        <Text style={styles.countryFlag}>{item.flag}</Text>
                                        <Text style={[styles.countryName, region.code === item.code && { fontWeight: 'bold', color: '#E50914' }]}>
                                            {item.name}
                                        </Text>
                                        {region.code === item.code && <Ionicons name="checkmark" size={20} color="#E50914" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                {/* AI Assistant FAB with Pulse Animation */}
                <Animated.View style={[styles.aiFabContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                        style={styles.aiFab}
                        onPress={() => navigation.navigate('AIChat')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#FF512F', '#DD2476']} // Elegant Sunset Red-Pink
                            style={styles.aiFabGradient}
                        >
                            <MaterialCommunityIcons name="robot-happy-outline" size={normalize(24)} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

            </SafeAreaView>
        </LinearGradient>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        paddingBottom: hp(1.5),
        paddingTop: Platform.OS === 'android' ? hp(1) : 0,
        paddingHorizontal: wp(4),
        // Removed dark gradient background
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    regionSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: 'rgba(255,255,255,0.2)', // Glassmorphism effect
        paddingHorizontal: 6,
        paddingVertical: 8,
        height: 45,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(15),
        color: '#000',
    },
    addressBar: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Semi-transparent
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: 12,
        borderBottomWidth: 0, // Remove border for cleaner look
    },
    addressText: {
        fontSize: normalize(13),
        color: '#333',
        fontWeight: '500',
    },
    togglePill: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    toggleText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#E50914'
    },
    scrollContent: {
        paddingBottom: hp(18),
    },
    sectionContainer: {
        backgroundColor: 'transparent',
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
        height: hp(28),
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5
    },
    bannerCard: {
        width: width - wp(8),
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0, top: 0,
    },
    bannerTextContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    premiumBadgeText: {
        color: '#000',
        fontSize: normalize(10),
        fontWeight: 'bold',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: normalize(24),
        fontWeight: '800',
        marginBottom: 15,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        lineHeight: 32,
    },
    bannerFooter: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
    },
    discountText: {
        color: '#fff',
        fontSize: normalize(26),
        fontWeight: '900',
    },
    bannerPrice: {
        color: '#fff',
        fontSize: normalize(22),
        fontWeight: 'bold',
    },
    timeText: {
        color: '#eee',
        fontSize: normalize(12),
        fontWeight: '500',
        marginTop: 4
    },
    shopNowBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3
    },
    shopNowText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: normalize(13),
        marginRight: 6
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
        marginBottom: 8,
    },
    ratingText: {
        fontSize: normalize(10),
        color: '#555',
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#000',
    },
    addToCartBtn: {
        backgroundColor: '#F3A847', // Amazon Add to Cart Yellow
        borderRadius: 4,
        padding: 4,
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    countryItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9'
    },
    selectedCountry: { backgroundColor: '#f0f8ff' },
    countryFlag: { fontSize: 24, marginRight: 15 },
    countryName: { fontSize: 16, flex: 1, color: '#333' },
    countrySearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 10
    },
    countrySearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333'
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
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20
    },
    emptyImage: {
        width: 100,
        height: 100,
        marginBottom: 20,
        opacity: 0.5
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10
    },
    emptySubTitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20
    },
    globalButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3
    },
    globalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    aiFabContainer: {
        position: 'absolute',
        bottom: hp(12),
        right: wp(5),
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#DD2476', // Colored shadow for glow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    aiFab: {
        width: wp(14), // Responsive size
        height: wp(14),
        borderRadius: wp(7),
        overflow: 'hidden',
    },
    aiFabGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
