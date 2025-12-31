import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const PaymentScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useLanguage();
    const { formatPrice, region } = useCurrency();

    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState('cod'); // Default to COD
    const [useWallet, setUseWallet] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Mock Params if not passed
    const totalAmount = route.params?.totalAmount || 1499;
    const items = route.params?.items || [];
    const shippingAddress = route.params?.shippingAddress || {};

    const deliveryCharge = 0; // Free delivery logic could be added
    const subTotal = totalAmount + deliveryCharge;
    const finalAmount = Math.max(0, subTotal - discountAmount);
    const payAmount = useWallet ? Math.max(0, finalAmount - walletBalance) : finalAmount;

    useEffect(() => {
        fetchUserData();
        loadDefaultSettings();
    }, []);

    const loadDefaultSettings = async () => {
        try {
            const defaultMethod = await AsyncStorage.getItem("defaultPaymentMethod");
            // If default was card, switch to cod
            if (defaultMethod && defaultMethod !== 'card') {
                setSelectedMethod(defaultMethod);
            } else if (defaultMethod === 'card') {
                setSelectedMethod('cod');
            }
        } catch (e) {
            console.log("Error loading default settings", e);
        }
    };

    const fetchUserData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('userInfo');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUserInfo(parsedUser);

                // Fetch fresh wallet balance
                const response = await fetch(`${API_BASE_URL}/user/${parsedUser._id}`);
                const data = await response.json();
                if (response.ok) {
                    setWalletBalance(data.user.walletBalance || 0);
                }
            }
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Alert.alert("Error", "Please enter a coupon code");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, cartTotal: totalAmount, region: userInfo?.region || "India" }), // Assuming India default
            });
            const data = await response.json();

            if (response.ok && data.valid) {
                setDiscountAmount(data.discountAmount);
                setAppliedCoupon(data.couponCode);
                Alert.alert("Success", `Coupon Applied! Saved ${formatPrice(data.discountAmount)}`);
            } else {
                setDiscountAmount(0);
                setAppliedCoupon(null);
                Alert.alert("Invalid Coupon", data.message || "Coupon is not valid.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to validate coupon");
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const handlePlaceOrder = async () => {
        if (!userInfo) return;

        // Region Validation
        if (region && region.code !== 'Global' && shippingAddress?.country !== region.name) {
            Alert.alert(
                "Region Mismatch",
                `You are currently shopping in the ${region.name} region but your shipping address is in ${shippingAddress.country}. Please switch your region to ${shippingAddress.country} or select a valid address.`
            );
            return;
        }

        if (selectedMethod === 'wallet' && walletBalance < finalAmount) {
            Alert.alert("Error", t('insufficientBalance'));
            return;
        }

        setLoading(true);

        if (selectedMethod === 'upi') {
            await handleDirectUPIPayment();
            return;
        }

        // For Non-UPI methods or fallback
        await createOrder(null);
    };

    const handleDirectUPIPayment = async () => {
        const vpa = 'reel2cart@upi'; // Replace with your Merchant VPA (e.g., merchant@oksbi)
        const payeeName = 'Reel2Cart';
        const transactionNote = 'Payment for Order';
        const amount = finalAmount.toFixed(2);
        const currency = 'INR';

        const upiUrl = `upi://pay?pa=${vpa}&pn=${payeeName}&am=${amount}&cu=${currency}&tn=${transactionNote}`;

        try {
            const supported = await Linking.canOpenURL(upiUrl);

            if (supported) {
                await Linking.openURL(upiUrl);
                // Direct UPI intents do not return a callback to the app. 
                // We must ask the user to confirm the status or implement a backend poller.
                // For this implementation, we will ask the user.
                Alert.alert(
                    "Payment Confirmation",
                    "Please complete the payment in your UPI app.\n\nDid you make the payment successfully?",
                    [
                        { text: "No, Canceled", style: "cancel" },
                        {
                            text: "Yes, Paid",
                            onPress: () => createOrder(`UPI-${Date.now()}`)
                        }
                    ]
                );
            } else {
                Alert.alert("Error", "No UPI apps found on this device. Please install GPay, PhonePe, or Paytm.");
            }
        } catch (err) {
            console.log("UPI Error:", err);
            Alert.alert("Error", "Unable to open UPI apps.");
        }
    };

    const createOrder = async (pId) => {
        try {
            const orderPayload = {
                userId: userInfo._id,
                products: items.length > 0 ? items : [{ name: "Mock Product", quantity: 1, price: totalAmount, image: "https://via.placeholder.com/150" }],
                totalAmount: finalAmount,
                shippingAddress,
                paymentMethod: useWallet && payAmount === 0 ? "Reel2Cart Balance" : getMethodName(selectedMethod),
                paymentId: pId,
                couponCode: appliedCoupon
            };

            const token = await AsyncStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Order placed successfully!", [
                    { text: "OK", onPress: () => navigation.navigate("Home") }
                ]);
            } else {
                Alert.alert("Error", data.message || "Failed to place order.");
            }

        } catch (error) {
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getMethodName = (key) => {
        switch (key) {
            case 'wallet': return "Reel2Cart Balance";
            case 'upi': return "UPI";
            // case 'card': return "Card"; // Removed
            case 'cod': return "Cash on Delivery";
            default: return "Unknown";
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('paymentMethod')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Wallet Option */}
                <Text style={styles.sectionTitle}>{t('shopflixBalance')}</Text>
                <TouchableOpacity
                    style={[styles.paymentOption, selectedMethod === 'wallet' && styles.selectedOption]}
                    onPress={() => setSelectedMethod('wallet')}
                >
                    <View style={styles.row}>
                        <View style={styles.radioOuter}>
                            {selectedMethod === 'wallet' && <View style={styles.radioInner} />}
                        </View>
                        <View style={styles.walletDetails}>
                            <Text style={styles.optionTitle}>{t('shopflixBalance')}</Text>
                            <Text style={styles.balanceText}>{formatPrice(walletBalance)}</Text>
                            {walletBalance < finalAmount && (
                                <Text style={styles.lowBalanceText}>{t('insufficientBalance')}</Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Other Options */}
                <Text style={styles.sectionTitle}>{t('payWith')}</Text>

                {/* UPI */}
                <TouchableOpacity
                    style={[styles.paymentOption, selectedMethod === 'upi' && styles.selectedOption]}
                    onPress={() => setSelectedMethod('upi')}
                >
                    <View style={styles.row}>
                        <View style={styles.radioOuter}>
                            {selectedMethod === 'upi' && <View style={styles.radioInner} />}
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.optionTitle}>{t('upi')}</Text>
                        </View>
                    </View>
                    <Image source={{ uri: 'https://img.icons8.com/color/48/bhim-upi.png' }} style={styles.iconImage} />
                </TouchableOpacity>

                {/* Cards Option Removed */}

                {/* COD */}
                <TouchableOpacity
                    style={[styles.paymentOption, selectedMethod === 'cod' && styles.selectedOption]}
                    onPress={() => setSelectedMethod('cod')}
                >
                    <View style={styles.row}>
                        <View style={styles.radioOuter}>
                            {selectedMethod === 'cod' && <View style={styles.radioInner} />}
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.optionTitle}>{t('cashOnDelivery')}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Coupon Section */}
                <View style={styles.couponContainer}>
                    <Text style={styles.sectionTitle}>Add Coupon</Text>
                    <View style={styles.couponRow}>
                        <View style={styles.couponInputWrapper}>
                            <Ionicons name="pricetag-outline" size={20} color="#555" style={styles.couponIcon} />
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Enter Code"
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                                editable={!appliedCoupon}
                            />
                        </View>
                        {appliedCoupon ? (
                            <TouchableOpacity style={styles.removeBtn} onPress={removeCoupon}>
                                <Text style={styles.removeBtnText}>Remove</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {appliedCoupon && (
                        <Text style={styles.appliedText}>Coupon '{appliedCoupon}' applied!</Text>
                    )}
                </View>

                {/* Order Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>{t('orderSummary')}</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{t('items')}</Text>
                        <Text style={styles.summaryValue}>{formatPrice(totalAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{t('delivery')}</Text>
                        <Text style={styles.summaryValue}>{formatPrice(deliveryCharge)}</Text>
                    </View>
                    {discountAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: 'green' }]}>Discount</Text>
                            <Text style={[styles.summaryValue, { color: 'green' }]}>- {formatPrice(discountAmount)}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>{t('total')}</Text>
                        <Text style={styles.totalValue}>{formatPrice(finalAmount)}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.placeOrderButton, (selectedMethod === 'wallet' && walletBalance < finalAmount) && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={loading || (selectedMethod === 'wallet' && walletBalance < finalAmount)}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.placeOrderText}>{t('placeOrder')}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default PaymentScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#f2f2f2',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    backButton: {
        marginRight: wp(3),
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(12),
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
        marginTop: hp(2.5),
        marginBottom: hp(1),
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: hp(1.5),
        elevation: 1,
    },
    selectedOption: {
        borderColor: '#e77600',
        backgroundColor: '#fffaf5',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuter: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#555',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#e77600',
    },
    optionTitle: {
        fontSize: normalize(15),
        color: '#000',
        fontWeight: '500',
    },
    walletDetails: {
        marginLeft: 10,
    },
    balanceText: {
        fontSize: normalize(14),
        color: '#555',
    },
    lowBalanceText: {
        fontSize: normalize(12),
        color: '#d9534f', // Red for error
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: hp(1),
    },
    iconImage: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    summaryContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginTop: hp(2),
        borderWidth: 1,
        borderColor: '#eee',
    },
    summaryTitle: {
        fontSize: normalize(17),
        fontWeight: 'bold',
        marginBottom: hp(1.5),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: normalize(14),
        color: '#555',
    },
    summaryValue: {
        fontSize: normalize(14),
        color: '#333',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        marginTop: 5,
    },
    totalLabel: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#b12704', // Amazon price red
    },
    totalValue: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#b12704',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f2f2f2',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        elevation: 10,
    },
    placeOrderButton: {
        backgroundColor: '#FFD814', // Amazon 'Place Your Order' Yellow
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
        borderColor: '#FCD200',
        borderWidth: 1,
    },
    placeOrderText: {
        fontSize: normalize(16),
        fontWeight: '500',
        color: '#000',
    },
    disabledButton: {
        backgroundColor: '#ddd',
        borderColor: '#ccc',
    },
    couponContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: hp(1.5),
        elevation: 1,
    },
    couponRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
        height: 45,
    },
    couponIcon: {
        marginRight: 5,
    },
    couponInput: {
        flex: 1,
        fontSize: normalize(15),
        color: '#333',
    },
    applyBtn: {
        backgroundColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    applyBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(14),
    },
    removeBtn: {
        backgroundColor: '#d9534f',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    removeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: normalize(14),
    },
    appliedText: {
        marginTop: 8,
        color: 'green',
        fontWeight: '500',
        fontSize: normalize(14),
    }
});
