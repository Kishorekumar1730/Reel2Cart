import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image, Linking, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
    const [useWallet, setUseWallet] = useState(false); // Kept for logic compatibility, though UI implies direct selection
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
    // If 'wallet' is selected as the main method, we treat it as full payment from wallet
    const payAmount = selectedMethod === 'wallet' ? Math.max(0, finalAmount - walletBalance) : finalAmount;

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
            Alert.alert(t('error'), t('enterCoupon'));
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
                Alert.alert(t('success'), `${t('couponApplied')} ${t('saved') || 'Saved'} ${formatPrice(data.discountAmount)}`);
            } else {
                setDiscountAmount(0);
                setAppliedCoupon(null);
                Alert.alert(t('invalidCoupon') || 'Invalid Coupon', data.message || t('couponInvalid') || "Coupon is not valid.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('failedValidateCoupon') || "Failed to validate coupon");
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
                t('regionMismatch'),
                t('regionMismatchDesc').replace('{region}', region.name).replace('{country}', shippingAddress.country).replace('{country}', shippingAddress.country)
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
        const vpa = 'reel2cart@upi'; // Replace with your Merchant VPA
        const payeeName = 'Reel2Cart';
        const transactionNote = t('paymentForOrder') || 'Payment for Order';
        const amount = finalAmount.toFixed(2);
        const currency = 'INR';

        const upiUrl = `upi://pay?pa=${vpa}&pn=${payeeName}&am=${amount}&cu=${currency}&tn=${transactionNote}`;

        try {
            const supported = await Linking.canOpenURL(upiUrl);

            if (supported) {
                await Linking.openURL(upiUrl);
                // Direct UPI intents do not return a callback to the app. 
                Alert.alert(
                    t('paymentConfirmation'),
                    t('paymentConfirmationDesc'),
                    [
                        { text: t('noCanceled'), style: "cancel" },
                        {
                            text: t('yesPaid'),
                            onPress: () => createOrder(`UPI-${Date.now()}`)
                        }
                    ]
                );
            } else {
                Alert.alert(t('error'), t('noUpiApps'));
            }
        } catch (err) {
            console.log("UPI Error:", err);
            Alert.alert(t('error'), t('upiError'));
        }
    };

    const createOrder = async (pId) => {
        try {
            const orderPayload = {
                userId: userInfo._id,
                products: items.length > 0 ? items : [{ name: "Mock Product", quantity: 1, price: totalAmount, image: "https://via.placeholder.com/150" }],
                totalAmount: finalAmount,
                shippingAddress,
                paymentMethod: selectedMethod === 'wallet' ? "Reel2Cart Balance" : getMethodName(selectedMethod),
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
                Alert.alert(t('success'), t('orderPlaced'), [
                    { text: t('ok'), onPress: () => navigation.navigate("Home") }
                ]);
            } else {
                Alert.alert(t('error'), data.message || t('failedPlaceOrder'));
            }

        } catch (error) {
            Alert.alert(t('error'), t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    const getMethodName = (key) => {
        switch (key) {
            case 'wallet': return "Reel2Cart Balance";
            case 'upi': return "UPI";
            case 'cod': return "Cash on Delivery";
            default: return "Unknown";
        }
    };

    const PaymentOption = ({ id, label, icon, subContent }) => (
        <TouchableOpacity
            style={[styles.glassCard, selectedMethod === id && styles.selectedCard]}
            onPress={() => setSelectedMethod(id)}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedMethod === id && styles.selectedRadioOuter]}>
                        {selectedMethod === id && <View style={styles.radioInner} />}
                    </View>
                </View>

                <View style={[styles.iconBox, selectedMethod === id && styles.selectedIconBox]}>
                    {icon}
                </View>

                <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, selectedMethod === id && styles.selectedText]}>{label}</Text>
                    {subContent}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('checkout') || 'Checkout'}</Text>
                        <View style={{ width: wp(10) }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Order Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.sectionTitle}>{t('orderSummary')}</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('items')}</Text>
                                <Text style={styles.summaryValue}>{formatPrice(totalAmount)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('delivery')}</Text>
                                <Text style={styles.summaryValue}>{deliveryCharge === 0 ? t('free') || 'Free' : formatPrice(deliveryCharge)}</Text>
                            </View>
                            {discountAmount > 0 && (
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>{t('discount')}</Text>
                                    <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- {formatPrice(discountAmount)}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{t('total')}</Text>
                                <Text style={styles.totalValue}>{formatPrice(finalAmount)}</Text>
                            </View>
                        </View>

                        {/* Coupon Section */}
                        <View style={styles.couponCard}>
                            <View style={styles.couponRow}>
                                <View style={styles.couponInputWrapper}>
                                    <Ionicons name="pricetag-outline" size={normalize(18)} color="#666" style={styles.couponIcon} />
                                    <TextInput
                                        style={styles.couponInput}
                                        placeholder={t('enterCoupon')}
                                        placeholderTextColor="#999"
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                        autoCapitalize="characters"
                                        editable={!appliedCoupon}
                                    />
                                </View>
                                {appliedCoupon ? (
                                    <TouchableOpacity style={styles.removeBtn} onPress={removeCoupon}>
                                        <Text style={styles.removeBtnText}>{t('remove')}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                                        <Text style={styles.applyBtnText}>{t('apply')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {appliedCoupon && (
                                <Text style={styles.appliedText}>
                                    <Ionicons name="checkmark-circle" size={14} /> {t('couponSuccess').replace('{code}', appliedCoupon)}
                                </Text>
                            )}
                        </View>

                        <Text style={styles.mainSectionTitle}>{t('paymentMethod')}</Text>

                        {/* Wallet Option */}
                        <PaymentOption
                            id="wallet"
                            label={t('shopflixBalance')}
                            icon={<Ionicons name="wallet-outline" size={normalize(24)} color={selectedMethod === 'wallet' ? '#E50914' : '#555'} />}
                            subContent={
                                <View>
                                    <Text style={styles.balanceText}>{t('available')}: {formatPrice(walletBalance)}</Text>
                                    {walletBalance < finalAmount && (
                                        <Text style={styles.errorText}>{t('insufficientBalance')}</Text>
                                    )}
                                </View>
                            }
                        />

                        {/* UPI Option */}
                        <PaymentOption
                            id="upi"
                            label={t('upi')}
                            icon={<Ionicons name="qr-code-outline" size={normalize(24)} color={selectedMethod === 'upi' ? '#E50914' : '#555'} />}
                            subContent={<Text style={styles.subText}>Google Pay, PhonePe, Paytm</Text>}
                        />

                        {/* COD Option */}
                        <PaymentOption
                            id="cod"
                            label={t('cashOnDelivery')}
                            icon={<Ionicons name="cash-outline" size={normalize(24)} color={selectedMethod === 'cod' ? '#E50914' : '#555'} />}
                            subContent={<Text style={styles.subText}>{t('paySecurelyOnDelivery')}</Text>}
                        />

                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerTotal}>
                            <Text style={styles.footerTotalLabel}>{t('toPay')}</Text>
                            <Text style={styles.footerTotalValue}>{formatPrice(finalAmount)}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.placeOrderButton, (selectedMethod === 'wallet' && walletBalance < finalAmount) && styles.disabledButton]}
                            onPress={handlePlaceOrder}
                            disabled={loading || (selectedMethod === 'wallet' && walletBalance < finalAmount)}
                        >
                            <LinearGradient
                                colors={loading || (selectedMethod === 'wallet' && walletBalance < finalAmount) ? ['#ccc', '#bbb'] : ['#E50914', '#B81C26']}
                                style={styles.btnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.placeOrderText}>{t('placeOrder')}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1a1a1a',
    },
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(15),
        paddingTop: hp(2),
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        padding: wp(5),
        marginBottom: hp(2.5),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    couponCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        padding: wp(5),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: '#fff',
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
    },
    selectedCard: {
        borderColor: '#E50914',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1.5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(1.5),
    },
    mainSectionTitle: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#333',
        marginBottom: hp(2),
        marginLeft: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: normalize(14),
        color: '#666',
    },
    summaryValue: {
        fontSize: normalize(14),
        color: '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginVertical: hp(1.5),
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: normalize(16),
        fontWeight: '800',
        color: '#333',
    },
    totalValue: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#E50914',
    },
    couponRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    couponIcon: {
        marginRight: 8,
    },
    couponInput: {
        flex: 1,
        fontSize: normalize(14),
        color: '#333',
    },
    applyBtn: {
        backgroundColor: '#333',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    removeBtn: {
        backgroundColor: '#D32F2F',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    applyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(14),
    },
    removeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(14),
    },
    appliedText: {
        marginTop: 10,
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: normalize(13),
    },
    radioContainer: {
        marginRight: wp(3),
    },
    radioOuter: {
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#aaa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedRadioOuter: {
        borderColor: '#E50914',
    },
    radioInner: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#E50914',
    },
    iconBox: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    selectedIconBox: {
        backgroundColor: '#FFF0F0',
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    selectedText: {
        color: '#E50914',
    },
    subText: {
        fontSize: normalize(12),
        color: '#888',
    },
    balanceText: {
        fontSize: normalize(12),
        color: '#666',
    },
    errorText: {
        fontSize: normalize(11),
        color: '#D32F2F',
        marginTop: 2,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2.5),
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerTotal: {
        flex: 1,
    },
    footerTotalLabel: {
        fontSize: normalize(12),
        color: '#888',
        fontWeight: '600',
    },
    footerTotalValue: {
        fontSize: normalize(20),
        fontWeight: '800',
        color: '#333',
    },
    placeOrderButton: {
        flex: 1.5,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnGradient: {
        paddingVertical: hp(1.8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeOrderText: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default PaymentScreen;
