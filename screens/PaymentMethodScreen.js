import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../context/LanguageContext";
import { wp, hp, normalize } from "../utils/responsive";

const PaymentMethodScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState("cod"); // Default fallback

    useEffect(() => {
        loadDefaultMethod();
    }, []);

    const loadDefaultMethod = async () => {
        try {
            const savedMethod = await AsyncStorage.getItem("defaultPaymentMethod");
            if (savedMethod) {
                setSelectedMethod(savedMethod);
            }
        } catch (error) {
            console.log("Error loading default method", error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await AsyncStorage.setItem("defaultPaymentMethod", selectedMethod);
            Alert.alert(t('save'), t('defaultPaymentUpdated'));
        } catch (error) {
            console.log("Error saving method", error);
            Alert.alert(t('error'), t('failedToSavePayment'));
        } finally {
            setLoading(false);
        }
    };

    const PaymentOption = ({ id, icon, label, subLabel }) => (
        <TouchableOpacity
            style={[
                styles.glassCard,
                selectedMethod === id && styles.selectedCard,
            ]}
            onPress={() => setSelectedMethod(id)}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconBox, selectedMethod === id && styles.selectedIconBox]}>
                    {icon}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.optionLabel, selectedMethod === id && styles.selectedText]}>
                        {label}
                    </Text>
                    {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
                </View>
                <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedMethod === id && styles.selectedRadioOuter]}>
                        {selectedMethod === id && <View style={styles.radioInner} />}
                    </View>
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

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('paymentMethod')}</Text>
                    <View style={{ width: wp(10) }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>{t('selectDefaultMethod')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('chooseDefaultPay')}</Text>

                    <PaymentOption
                        id="wallet"
                        label={t('shopflixBalance')}
                        subLabel={t('payWithBalance')}
                        icon={<Ionicons name="wallet-outline" size={normalize(24)} color={selectedMethod === 'wallet' ? '#E50914' : '#555'} />}
                    />

                    <PaymentOption
                        id="upi"
                        label={t('upi')}
                        subLabel={t('upiSub')}
                        icon={<Ionicons name="qr-code-outline" size={normalize(24)} color={selectedMethod === 'upi' ? '#E50914' : '#555'} />}
                    />

                    <PaymentOption
                        id="card"
                        label={t('creditDebitCard')}
                        subLabel={t('cardSub')}
                        icon={<Ionicons name="card-outline" size={normalize(24)} color={selectedMethod === 'card' ? '#E50914' : '#555'} />}
                    />

                    <PaymentOption
                        id="cod"
                        label={t('cashOnDelivery')}
                        subLabel={t('payDoorstep')}
                        icon={<Ionicons name="cash-outline" size={normalize(24)} color={selectedMethod === 'cod' ? '#E50914' : '#555'} />}
                    />

                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={loading}>
                        <LinearGradient
                            colors={['#E50914', '#B81C26']}
                            style={styles.saveBtnGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>{t('save')}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: "700",
        color: "#1a1a1a",
    },
    backButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: "bold",
        color: "#333",
        marginTop: hp(2),
        marginBottom: hp(0.5),
    },
    sectionSubtitle: {
        fontSize: normalize(14),
        color: "#666",
        marginBottom: hp(3),
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    selectedCard: {
        borderColor: '#E50914',
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
    },
    iconBox: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(6),
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    selectedIconBox: {
        backgroundColor: '#FFF0F0',
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: normalize(16),
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    selectedText: {
        color: "#E50914",
        fontWeight: "700",
    },
    subLabel: {
        fontSize: normalize(12),
        color: "#888",
    },
    radioContainer: {
        marginLeft: 10,
    },
    radioOuter: {
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#aaa",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedRadioOuter: {
        borderColor: "#E50914",
    },
    radioInner: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: "#E50914",
    },
    saveBtn: {
        marginTop: hp(4),
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnGradient: {
        paddingVertical: hp(2),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
});
