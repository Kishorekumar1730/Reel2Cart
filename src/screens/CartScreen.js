import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import AnimatedButton from "../components/AnimatedButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../context/LanguageContext";
import { wp, hp, normalize } from "../utils/responsive";
import { useCurrency } from "../context/CurrencyContext";

const CartScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();

    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [totalAmount, setTotalAmount] = useState(0);
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

    // Fetch User ID once
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

    // Fetch Cart Data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (userId) {
                fetchCart(userId);
            }
        }, [userId])
    );

    const fetchCart = async (uid) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/cart/${uid}`);
            const data = await response.json();
            if (response.ok) {
                const items = data.cartItems || [];
                setCartItems(items);
                // By default select all if first load or logic requires
                // For persistence we might not auto select, but here let's auto select all new items if set is empty?
                // Or just select all initially:
                if (selectedItems.size === 0 && items.length > 0) {
                    const allIds = new Set(items.map(i => i._id));
                    setSelectedItems(allIds);
                }
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total whenever cart or selections change
    useEffect(() => {
        let total = 0;
        cartItems.forEach(item => {
            if (selectedItems.has(item._id)) {
                total += (item.price * item.quantity);
            }
        });
        setTotalAmount(total);
    }, [cartItems, selectedItems]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === cartItems.length) {
            setSelectedItems(new Set()); // Deselect all
        } else {
            const allIds = new Set(cartItems.map(i => i._id));
            setSelectedItems(allIds);
        }
    };

    const increaseQuantity = async (itemId) => {
        updateCartQuantity(itemId, 'increase');
    };

    const decreaseQuantity = async (itemId) => {
        updateCartQuantity(itemId, 'decrease');
    };

    const updateCartQuantity = async (itemId, action) => {
        try {
            // Optimistic update (optional, but good for UI)
            // For now, let's wait for API response to ensure sync
            const response = await fetch(`${API_BASE_URL}/cart/update-quantity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, itemId, action }),
            });

            if (response.ok) {
                fetchCart(userId); // Refresh cart
            }
        } catch (error) {
            console.error("Error updating qty:", error);
        }
    };

    const removeItem = (itemId) => {
        Alert.alert(t('removeItem'), t('confirmRemove'), [
            {
                text: t('cancel'),
                style: "cancel",
            },
            {
                text: t('remove'),
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/cart/remove`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, itemId }),
                        });
                        if (response.ok) {
                            fetchCart(userId);
                        }
                    } catch (error) {
                        console.error("Error removing item:", error);
                    }
                },
                style: "destructive"
            }
        ]);
    };

    const handeProceedToBuy = () => {
        const itemsToBuy = cartItems.filter(item => selectedItems.has(item._id));

        if (itemsToBuy.length === 0) {
            Alert.alert(t('cartEmpty'), t('selectItemMsg'));
            return;
        }
        navigation.navigate("Address", {
            source: 'Cart',
            totalAmount: totalAmount,
            items: itemsToBuy
        });
    };


    // Guest View
    const [isGuest, setIsGuest] = useState(false);
    useEffect(() => {
        const checkGuest = async () => {
            const stored = await AsyncStorage.getItem("userInfo");
            if (stored) {
                const u = JSON.parse(stored);
                if (u.isGuest) setIsGuest(true);
            }
        };
        checkGuest();
    }, []);

    if (isGuest) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{t('cartTab') || "Cart"}</Text>
                        <Ionicons name="cart-outline" size={28} color="#fff" />
                    </View>
                </LinearGradient>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>{t('signInViewCart')}</Text>
                    <AnimatedButton onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} style={styles.shopNowBtn}>
                        <Text style={styles.shopNowText}>{t('signInJoin')}</Text>
                    </AnimatedButton>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('cartTab') || "Shopping Cart"}</Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText} numberOfLines={1} adjustsFontSizeToFit>{cartItems.length} {t('items')}</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {cartItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cart-outline" size={100} color="#eee" />
                            <Text style={styles.emptyText}>{t('cartEmpty')}</Text>
                            <Text style={styles.emptySubText}>{t('looksEmpty')}</Text>
                            <AnimatedButton onPress={() => navigation.navigate("HomeTab")} style={styles.shopNowBtn}>
                                <Text style={styles.shopNowText}>{t('startShopping')}</Text>
                            </AnimatedButton>
                        </View>
                    ) : (
                        <>
                            <View style={styles.actionBar}>
                                <AnimatedButton onPress={toggleSelectAll} style={styles.selectAllBtn}>
                                    <Ionicons
                                        name={selectedItems.size === cartItems.length ? "checkbox" : "square-outline"}
                                        size={22}
                                        color={selectedItems.size === cartItems.length ? "#E50914" : "#666"}
                                    />
                                    <Text style={styles.selectAllText}>{t('selectAll')}</Text>
                                </AnimatedButton>
                            </View>

                            {cartItems.map((item, index) => (
                                <View key={item._id} style={styles.cartCard}>
                                    <View style={styles.cardHeader}>
                                        <AnimatedButton onPress={() => toggleSelection(item._id)}>
                                            <Ionicons
                                                name={selectedItems.has(item._id) ? "checkbox" : "square-outline"}
                                                size={22}
                                                color={selectedItems.has(item._id) ? "#E50914" : "#ccc"}
                                            />
                                        </AnimatedButton>
                                        <View style={{ flex: 1 }} />
                                        <AnimatedButton onPress={() => removeItem(item._id)}>
                                            <Ionicons name="trash-outline" size={20} color="#999" />
                                        </AnimatedButton>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.cardBody}
                                        onPress={() => handleProductClick(item.productId)}
                                        activeOpacity={0.7}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.itemImage} />
                                        <View style={styles.itemInfo}>
                                            <Text numberOfLines={2} style={styles.itemTitle}>{item.name}</Text>
                                            <Text style={styles.itemCategory}>{item.category || 'Product'}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                                                {navigatingId === item.productId && (
                                                    <ActivityIndicator size="small" color="#E50914" style={{ marginLeft: 10 }} />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.qtyContainer}>
                                            <AnimatedButton onPress={() => decreaseQuantity(item._id)} style={styles.qtyBtn}>
                                                <Ionicons name="remove" size={16} color="#333" />
                                            </AnimatedButton>
                                            <Text style={styles.qtyText}>{item.quantity}</Text>
                                            <AnimatedButton onPress={() => increaseQuantity(item._id)} style={styles.qtyBtn}>
                                                <Ionicons name="add" size={16} color="#333" />
                                            </AnimatedButton>
                                        </View>
                                        <Text style={styles.subTotalText}>
                                            {t('subtotal')}: {formatPrice(item.price * item.quantity)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            <View style={{ height: 200 }} />
                        </>
                    )}
                </ScrollView>

                {cartItems.length > 0 && (
                    <View style={styles.footer}>
                        <View style={styles.footerRow}>
                            <View>
                                <Text style={styles.totalLabel}>{t('total')}</Text>
                                <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
                            </View>
                            <AnimatedButton
                                style={[styles.checkoutBtn, selectedItems.size === 0 && styles.disabledBtn]}
                                onPress={handeProceedToBuy}
                                disabled={selectedItems.size === 0}
                            >
                                <Text style={styles.checkoutText}>{t('checkOut')} ({selectedItems.size})</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </AnimatedButton>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default CartScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(255,255,255,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: "800",
        color: "#111",
        letterSpacing: 0.5,
        flex: 1, // Take available space
    },
    headerBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginLeft: 10, // Add margin
        flexShrink: 0, // Prevent badge from shrinking
    },
    headerBadgeText: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#555',
    },
    scrollContent: {
        paddingTop: 15,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    selectAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectAllText: {
        marginLeft: 8,
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#333'
    },
    removeSelectedText: {
        fontSize: normalize(12),
        color: '#E50914',
        fontWeight: '600'
    },
    cartCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        padding: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    cardBody: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    itemImage: {
        width: wp(20),
        height: wp(20),
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        resizeMode: 'contain',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: normalize(15),
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: normalize(12),
        color: '#888',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: normalize(16),
        fontWeight: '800',
        color: '#111',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 10,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        elevation: 1,
    },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
    },
    qtyText: {
        marginHorizontal: 12,
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#333',
    },
    subTotalText: {
        fontSize: normalize(12),
        color: '#666',
        fontWeight: '500'
    },
    footer: {
        position: 'absolute',
        bottom: 110, // Float above Tabs
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        zIndex: 1000,
    },
    footerRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: normalize(12),
        color: '#888',
        marginBottom: 2,
    },
    totalValue: {
        fontSize: normalize(20),
        fontWeight: '800',
        color: '#111',
    },
    checkoutBtn: {
        backgroundColor: '#111', // Black aesthetics
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#111',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    checkoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(14),
        marginRight: 8,
    },
    disabledBtn: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(15),
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: normalize(14),
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    shopNowBtn: {
        marginTop: 30,
        backgroundColor: '#E50914',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
        elevation: 5,
    },
    shopNowText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(15),
    }
});
