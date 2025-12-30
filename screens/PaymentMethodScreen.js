import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../context/LanguageContext";
import { wp, hp, normalize } from "../utils/responsive";

const PaymentMethodScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState("cod"); // Default fallack

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
            Alert.alert(t('save'), "Default payment method updated successfully!");
        } catch (error) {
            console.log("Error saving method", error);
            Alert.alert("Error", "Failed to save default payment method.");
        } finally {
            setLoading(false);
        }
    };

    const PaymentOption = ({ id, icon, label, subIcon }) => (
        <Pressable
            style={[
                styles.optionCard,
                selectedMethod === id && styles.selectedCard,
            ]}
            onPress={() => setSelectedMethod(id)}
        >
            <View style={styles.row}>
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <Text style={[styles.optionLabel, selectedMethod === id && styles.selectedText]}>
                    {label}
                </Text>
            </View>

            <View style={styles.row}>
                {subIcon && <View style={{ marginRight: 10 }}>{subIcon}</View>}
                <View style={styles.radioOuter}>
                    {selectedMethod === id && <View style={styles.radioInner} />}
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>{t('paymentMethod')}</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.subTitle}>Select Default Payment Method</Text>

                <PaymentOption
                    id="wallet"
                    label={t('shopflixBalance')}
                    icon={<Ionicons name="wallet-outline" size={24} color="#333" />}
                />

                <PaymentOption
                    id="upi"
                    label={t('upi')}
                    icon={<Ionicons name="qr-code-outline" size={24} color="#333" />}
                />

                <PaymentOption
                    id="cod"
                    label={t('cashOnDelivery')}
                    icon={<Ionicons name="cash-outline" size={24} color="#333" />}
                />

                <Pressable onPress={handleSave} style={styles.saveBtn} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f8f8",
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    content: {
        padding: 20,
    },
    subTitle: {
        fontSize: 16,
        color: "#555",
        marginBottom: 20,
        fontWeight: "500",
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    selectedCard: {
        borderColor: "#E50914",
        backgroundColor: "#fff0f0",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        marginRight: 15,
    },
    optionLabel: {
        fontSize: 16,
        color: "#333",
    },
    selectedText: {
        color: "#E50914",
        fontWeight: "bold",
    },
    radioOuter: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#777",
        alignItems: "center",
        justifyContent: "center",
    },
    radioInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: "#E50914",
    },
    saveBtn: {
        backgroundColor: '#E50914',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
