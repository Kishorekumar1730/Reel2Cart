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
            onPress={() => {
                // Navigate to product details if implemented, or just show alert
                // navigation.navigate('ProductDetails', { product: item });
            }}
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
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E50914" />
            {/* Header */}
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('favouriteTab') || "My Wishlist"}</Text>
                    <Ionicons name="heart" size={28} color="#fff" />
                </View>
            </LinearGradient>

            {loading && wishlist.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E50914" />
                </View>
            ) : wishlist.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No favorites yet!</Text>
                </View>
            ) : (
                <FlatList
                    data={wishlist}
                    renderItem={renderItem}
                    keyExtractor={item => item._id || item.productId}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    listContent: {
        padding: 10,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        width: wp(46),
        borderRadius: 8,
        marginBottom: 15,
        elevation: 2,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: wp(40),
        position: 'relative',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        elevation: 2,
    },
    details: {
        padding: 10,
    },
    name: {
        fontSize: normalize(13),
        color: '#333',
        marginBottom: 5,
        height: 35,
    },
    price: {
        fontSize: normalize(15),
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    cartBtn: {
        backgroundColor: '#FFD814',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCD200'
    },
    cartBtnText: {
        fontSize: normalize(12),
        color: '#000',
        fontWeight: '500',
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
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        color: '#555',
    },
});

export default FavouriteScreen;
