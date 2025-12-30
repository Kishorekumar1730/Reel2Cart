import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    Alert,
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

const CartScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();

    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

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
            Alert.alert(t('cartEmpty'), "Please select at least one item to proceed.");
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
                    <Text style={styles.emptyText}>Sign in to view your cart</Text>
                    <AnimatedButton onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} style={styles.shopNowBtn}>
                        <Text style={styles.shopNowText}>Sign In / Join</Text>
                    </AnimatedButton>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('cartTab') || "Cart"}</Text>
                    <Ionicons name="cart-outline" size={28} color="#fff" />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.container}>
                {cartItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>{t('cartEmpty')}</Text>
                        <AnimatedButton onPress={() => navigation.navigate("HomeTab")} style={styles.shopNowBtn}>
                            <Text style={styles.shopNowText}>{t('shopNow')}</Text>
                        </AnimatedButton>
                    </View>
                ) : (
                    <>
                        {/* Subtotal Header */}
                        <View style={styles.subtotalContainer}>
                            <View style={styles.selectAllRow}>
                                <AnimatedButton onPress={toggleSelectAll} style={styles.checkBoxContainer}>
                                    <Ionicons
                                        name={selectedItems.size === cartItems.length ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={selectedItems.size === cartItems.length ? "#007185" : "#555"}
                                    />
                                    <Text style={styles.selectAllText}>
                                        {selectedItems.size === cartItems.length ? "Deselect All" : "Select All Items"}
                                    </Text>
                                </AnimatedButton>
                            </View>

                            <Text style={styles.subtotalText}>
                                {t('subtotal')} ({selectedItems.size} {t('items')}): <Text style={styles.priceText}>₹{totalAmount.toLocaleString()}</Text>
                            </Text>
                            <AnimatedButton onPress={handeProceedToBuy} style={[styles.proceedBtn, selectedItems.size === 0 && styles.disabledBtn]} disabled={selectedItems.size === 0}>
                                <Text style={styles.proceedBtnText}>
                                    {t('proceedToBuy')} ({selectedItems.size} items)
                                </Text>
                            </AnimatedButton>
                        </View>

                        {/* Cart Items */}
                        {cartItems.map((item) => (
                            <View key={item._id} style={styles.cartItemContainer}>
                                <View style={styles.itemCheckbox}>
                                    <AnimatedButton onPress={() => toggleSelection(item._id)}>
                                        <Ionicons
                                            name={selectedItems.has(item._id) ? "checkbox" : "square-outline"}
                                            size={24}
                                            color={selectedItems.has(item._id) ? "#007185" : "#ccc"}
                                        />
                                    </AnimatedButton>
                                </View>
                                <View style={styles.cartItem}>
                                    <Image source={{ uri: item.image }} style={styles.itemImage} />

                                    <View style={styles.itemDetails}>
                                        <Text numberOfLines={2} style={styles.itemTitle}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
                                        <Text style={styles.uStock}>In Stock</Text>

                                        {/* Quantity Control */}
                                        <View style={styles.qtyContainer}>
                                            <View style={styles.qtyBox}>
                                                <AnimatedButton onPress={() => decreaseQuantity(item._id)} style={styles.qtyBtn}>
                                                    <Ionicons name="remove" size={20} color="#333" />
                                                </AnimatedButton>
                                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                                <AnimatedButton onPress={() => increaseQuantity(item._id)} style={styles.qtyBtn}>
                                                    <Ionicons name="add" size={20} color="#333" />
                                                </AnimatedButton>
                                            </View>
                                            <AnimatedButton onPress={() => removeItem(item._id)} style={styles.deleteBtn}>
                                                <Text style={styles.deleteText}>{t('delete')}</Text>
                                            </AnimatedButton>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CartScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#EAEDED",
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
        fontSize: normalize(20),
        fontWeight: "bold",
        color: "#fff",
    },
    container: {
        paddingBottom: hp(2),
    },
    subtotalContainer: {
        padding: wp(4),
        backgroundColor: '#fff',
        marginBottom: hp(1),
        borderBottomWidth: 1,
        borderColor: '#ddd'
    },
    subtotalText: {
        fontSize: normalize(18),
        marginBottom: hp(1),
    },
    priceText: {
        fontWeight: 'bold',
        color: '#B12704'
    },
    proceedBtn: {
        backgroundColor: '#FFD814',
        padding: hp(1.5),
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCD200'
    },
    disabledBtn: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ddd',
        opacity: 0.7
    },
    proceedBtnText: {
        fontSize: normalize(16),
        color: '#333',
    },
    cartItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 2,
        paddingLeft: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0'
    },
    itemCheckbox: {
        marginRight: 5,
    },
    cartItem: {
        flex: 1,
        flexDirection: 'row',
        padding: wp(4),
    },
    selectAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    checkBoxContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    selectAllText: {
        marginLeft: 10,
        fontSize: normalize(14),
        color: '#333'
    },
    itemImage: {
        width: wp(25),
        height: wp(25),
        resizeMode: 'contain',
        marginRight: wp(4),
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: normalize(16),
        marginBottom: 5,
        color: '#0F1111'
    },
    itemPrice: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    uStock: {
        color: '#067D62',
        marginBottom: 10,
        fontSize: normalize(12),
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#F0F2F2',
        marginRight: 15,
    },
    qtyBtn: {
        padding: 5,
        paddingHorizontal: 10,
    },
    qtyText: {
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        paddingVertical: 5,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#ddd',
        fontSize: normalize(14),
    },
    deleteBtn: {
        padding: 5,
    },
    deleteText: {
        color: '#007185',
        fontSize: normalize(14),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(15),
    },
    emptyText: {
        marginTop: 20,
        fontSize: normalize(18),
        color: '#555',
    },
    shopNowBtn: {
        marginTop: 20,
        backgroundColor: '#E50914',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    shopNowText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(16),
    }
});
