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
                // Store token and user info
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('authToken', data.token);
                if (data.user) {
                    await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                }
                // Navigate to Welcome - passing language for backward compatibility if WelcomeScreen is not yet refactored
                navigation.navigate("Welcome", { language, user: data.user, token: data.token });
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError('Network error. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.container}>
                        <Image source={require("../assets/simple-logo.png")} style={styles.logo} />

                        <View style={styles.formContainer}>
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
                                colors={["#00008B", "#FF0000"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
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

                        <AnimatedButton onPress={() => navigation.navigate("Register", { language })}>
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

                        <Text style={styles.footerText}>© 2025, Reel2Cart, Internvita 2.0, P01</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: wp(5),
        backgroundColor: "#fff",
        alignItems: "center",
        maxWidth: 600, // Tablet support
        width: '100%',
        alignSelf: 'center',
        paddingBottom: hp(5),
    },
    logo: {
        width: wp(40),
        height: hp(8),
        resizeMode: "contain",
        marginTop: hp(2),
        marginBottom: hp(3),
    },
    formContainer: {
        width: '100%',
        marginBottom: hp(2),
    },
    title: {
        fontSize: normalize(20),
        fontWeight: "bold",
        color: "#000",
        marginBottom: hp(2),
        alignSelf: "center",
        textAlign: "center",
    },
    input: {
        width: "100%",
        height: hp(6), // Responsive height
        minHeight: 48,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: normalize(14),
        backgroundColor: "#fff",
        marginBottom: hp(2),
    },
    errorText: {
        color: "#D32F2F",
        fontSize: normalize(13),
        marginBottom: hp(1),
        alignSelf: "flex-start",
    },
    gradient: {
        width: "100%",
        height: hp(6),
        minHeight: 48,
        borderRadius: 25,
        marginBottom: hp(2),
        justifyContent: "center",
    },
    button: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: normalize(16),
    },
    agreeText: {
        fontSize: normalize(12),
        color: "#333",
        textAlign: "center",
        marginVertical: hp(1.5),
        paddingHorizontal: wp(2),
        fontStyle: "italic",
        lineHeight: normalize(18),
        flexWrap: 'wrap', // Ensure wrapping
    },
    link: {
        textDecorationLine: "underline",
        color: "#007AFF",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: hp(2),
        width: "100%",
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#bbb",
    },
    orText: {
        marginHorizontal: 10,
        fontSize: normalize(13),
        color: "#666",
    },
    createAccount: {
        fontSize: normalize(16),
        color: "#000",
        fontWeight: "600",
        textDecorationLine: "underline",
        marginBottom: hp(3),
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderColor: "#ddd",
        marginBottom: hp(1),
    },
    footerLink: {
        fontSize: normalize(13),
        color: "#007AFF",
        textDecorationLine: "underline",
    },
    footerText: {
        fontSize: normalize(11),
        color: "#444",
        textAlign: "center",
        marginTop: hp(1),
    },
});
