import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { wp, hp, normalize } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const FavouriteScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [navigatingId, setNavigatingId] = useState(null);

    const handleProductClick = async (productId) => {
        if (!productId || navigatingId) return;
        try {
            setNavigatingId(productId);
            const res = await fetch(`${API_BASE_URL}/products/${productId}`);
            const data = await res.json();
            if (res.ok) {
                navigation.navigate('ProductDetails', { product: data });
            } else {
                Alert.alert(t('error'), t('productNotFound'));
            }
        } catch (error) {
            console.error("Navigation error:", error);
        } finally {
            setNavigatingId(null);
        }
    };

    useEffect(() => {
        const getUserId = async () => {
            const storedUser = await AsyncStorage.getItem("userInfo");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUserId(parsed._id);
            }
        };
        getUserId();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchWishlist(userId);
            }
        }, [userId])
    );

    const fetchWishlist = async (uid) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/wishlist/${uid}`);
            const data = await response.json();
            if (response.ok) {
                setWishlist(data.products || []);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/wishlist/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId }),
            });
            if (response.ok) {
                fetchWishlist(userId);
            }
        } catch (error) {
            console.error("Error removing from wishlist:", error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleProductClick(item.productId)}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromWishlist(item.productId)}
                >
                    <Ionicons name="trash-outline" size={20} color="#E50914" />
                </TouchableOpacity>
            </View>
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.price}>{formatPrice(item.price)}</Text>
                    {navigatingId === item.productId && (
                        <ActivityIndicator size="small" color="#E50914" style={{ marginLeft: 8, marginBottom: 10 }} />
                    )}
                </View>
                <TouchableOpacity style={styles.cartBtn} onPress={() => {
                    // Quick add to cart logic (simplified)
                    Alert.alert("Info", "Go to Home to add to cart or implement quick add here.");
                }}>
                    <Text style={styles.cartBtnText}>{t('addToCart') || 'Add to Cart'}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('favouriteTab') || "My Wishlist"}</Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{wishlist.length} {t('items')}</Text>
                    </View>
                </View>

                {loading && wishlist.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                ) : wishlist.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-dislike-outline" size={80} color="#777" />
                        <Text style={styles.emptyText}>{t('noFavorites')}</Text>
                        <Text style={styles.emptySubText}>{t('saveLoveItems')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={wishlist}
                        renderItem={renderItem}
                        keyExtractor={item => item._id || item.productId}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: "800",
        color: "#111",
        letterSpacing: 0.5,
    },
    headerBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    headerBadgeText: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#555',
    },
    listContent: {
        padding: 15,
        paddingBottom: 130,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        width: wp(44),
        borderRadius: 16,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: wp(44),
        position: 'relative',
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    details: {
        padding: 12,
    },
    name: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
        height: 36,
    },
    price: {
        fontSize: normalize(15),
        fontWeight: '800',
        color: '#111',
        marginBottom: 10,
    },
    cartBtn: {
        backgroundColor: '#111',
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
    cartBtnText: {
        fontSize: normalize(12),
        color: '#fff',
        fontWeight: '700',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 20,
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: '#444',
    },
    emptySubText: {
        marginTop: 10,
        fontSize: normalize(14),
        color: '#666',
        textAlign: 'center',
    },
});

export default FavouriteScreen;
