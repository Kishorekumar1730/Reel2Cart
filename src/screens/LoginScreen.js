import { StyleSheet, Text, View, Pressable, Image, TextInput, Platform, KeyboardAvoidingView, StatusBar, ScrollView } from "react-native";
import AnimatedButton from "../components/AnimatedButton";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { wp, hp, normalize } from "../utils/responsive";
import { useLanguage } from "../context/LanguageContext";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const navigation = useNavigation();

    // Use global language context
    const { t, language } = useLanguage();

    const isValidInput = (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input);
    };

    const handleContinue = async () => {
        if (!isValidInput(email.trim())) {
            setError(t('invalidEmail'));
            return;
        }
        setError("");

        try {
            const { API_BASE_URL } = require('../config/apiConfig');
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.twoFactorRequired) {
                    navigation.navigate('VerifyScreenSignin', { userInput: email.trim() });
                    return;
                }
                // Store token and user info
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('authToken', data.token);
                if (data.user) {
                    await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                }
                // Navigate to Welcome
                navigation.navigate("Welcome", { language, user: data.user, token: data.token });
            } else {
                setError(data.message || t('loginFailed'));
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError(t('networkError'));
        }
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientBackground}
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
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.container}>
                            <Image source={require("../../assets/simple-logo.png")} style={styles.logo} />

                            <View style={styles.cardContainer}>
                                <Text style={styles.title}>{t('signInTitle')}</Text>

                                <TextInput
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setError("");
                                    }}
                                    placeholder={t('enterEmail')}
                                    placeholderTextColor="#888"
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                {error !== "" && <Text style={styles.errorText}>{error}</Text>}

                                <LinearGradient
                                    colors={["#E50914", "#B20710"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <AnimatedButton style={styles.button} onPress={handleContinue}>
                                        <Text style={styles.buttonText}>{t('continue')}</Text>
                                    </AnimatedButton>
                                </LinearGradient>

                                <Text style={styles.agreeText}>
                                    {t('agreePrefix')}{" "}
                                    <Text style={styles.link} onPress={() => Linking.openURL("https://example.com/terms")}>
                                        {t('condition')}
                                    </Text>{" "}
                                    {t('and')}{" "}
                                    <Text style={styles.link} onPress={() => Linking.openURL("https://example.com/privacy")}>
                                        {t('privacyNotice')}
                                    </Text>
                                    .
                                </Text>
                            </View>

                            <View style={styles.dividerContainer}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>{t('or')}</Text>
                                <View style={styles.line} />
                            </View>

                            <AnimatedButton
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate("Register", { language })}
                            >
                                <Text style={styles.createAccount}>{t('createNewAccount')}</Text>
                            </AnimatedButton>

                            <View style={styles.footer}>
                                <AnimatedButton onPress={() => Linking.openURL("https://example.com/terms")}>
                                    <Text style={styles.footerLink}>{t('condition')}</Text>
                                </AnimatedButton>
                                <AnimatedButton onPress={() => Linking.openURL("https://example.com/privacy")}>
                                    <Text style={styles.footerLink}>{t('privacyNotice')}</Text>
                                </AnimatedButton>
                                <AnimatedButton onPress={() => Linking.openURL("https://example.com/help")}>
                                    <Text style={styles.footerLink}>{t('help')}</Text>
                                </AnimatedButton>
                            </View>

                            <Text style={styles.footerText}>© 2025, Reel2Cart</Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        paddingHorizontal: wp(6),
        alignItems: "center",
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
        paddingVertical: hp(2),
    },
    logo: {
        width: wp(40),
        height: wp(30), // Slightly taller for better containment
        resizeMode: "contain",
        marginTop: hp(2),
        marginBottom: hp(3),
    },
    cardContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Glassy effect
        borderRadius: 20,
        padding: wp(6),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 4,
    },
    title: {
        fontSize: normalize(22), // Larger title
        fontWeight: "800",
        color: "#333",
        marginBottom: hp(3),
        textAlign: "center",
    },
    input: {
        width: "100%",
        height: hp(6.5), // Taller input
        minHeight: 50,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: normalize(15),
        backgroundColor: "#fff",
        marginBottom: hp(2),
        color: '#333',
    },
    errorText: {
        color: "#E50914",
        fontSize: normalize(13),
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    buttonGradient: {
        width: "100%",
        height: hp(6.5),
        minHeight: 50,
        borderRadius: 30, // Pill shape
        marginBottom: hp(2),
        justifyContent: "center",
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    button: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: normalize(17),
        letterSpacing: 0.5,
    },
    agreeText: {
        fontSize: normalize(12),
        color: "#666",
        textAlign: "center",
        marginTop: hp(1),
        lineHeight: normalize(18),
    },
    link: {
        textDecorationLine: "underline",
        color: "#007AFF",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: hp(2),
        width: "80%",
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    orText: {
        marginHorizontal: 10,
        fontSize: normalize(14),
        color: "#777",
        fontWeight: '500',
    },
    secondaryButton: {
        marginBottom: hp(4),
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    createAccount: {
        fontSize: normalize(16),
        color: "#333",
        fontWeight: "700",
        textDecorationLine: "underline",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%", // Narrower footer
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        marginBottom: hp(1),
    },
    footerLink: {
        fontSize: normalize(12),
        color: "#666",
    },
    footerText: {
        fontSize: normalize(11),
        color: "#999",
        textAlign: "center",
        marginTop: hp(0.5),
    },
});

