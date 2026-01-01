import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, normalize } from '../utils/responsive';

const { width } = Dimensions.get('window');

const SellerOnboardingScreen = () => {
    const navigation = useNavigation();

    const FeatureItem = ({ icon, title, description, color }) => (
        <View style={styles.glassFeatureCard}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={normalize(28)} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Navbar */}
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Reel2Cart Business</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroIllustration}>
                            <LinearGradient colors={['#E50914', '#FF5F6D']} style={styles.illustrationCircle}>
                                <Ionicons name="storefront" size={normalize(60)} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.heroTitle}>Become a Seller</Text>
                        <Text style={styles.heroSubtitle}>Start your digital store in seconds. Reach millions, sell globally.</Text>

                        <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('SellerRegistration')}>
                            <Text style={styles.heroButtonText}>Start Selling Now</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Stats Banner */}
                    <View style={styles.glassStatsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>10M+</Text>
                            <Text style={styles.statLabel}>Shoppers</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0%</Text>
                            <Text style={styles.statLabel}>Commission*</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>24/7</Text>
                            <Text style={styles.statLabel}>Support</Text>
                        </View>
                    </View>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        <Text style={styles.sectionHeader}>Why choose us?</Text>
                        <FeatureItem
                            icon="videocam"
                            title="Reels-Powered Sales"
                            description="World's first reels-powered online shopping platform."
                            color="#E50914"
                        />
                        <FeatureItem
                            icon="touch-app"
                            title="Shoppable Videos"
                            description="Turn viewers into buyers instantly with direct links."
                            color="#3B82F6"
                        />
                        <FeatureItem
                            icon="trending-up"
                            title="Higher Engagement"
                            description="Video listings drive 5x more engagement than images."
                            color="#10B981"
                        />
                        <FeatureItem
                            icon="stars"
                            title="Viral Reach"
                            description="Get discovered by millions on our trending feed."
                            color="#F59E0B"
                        />
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginFooter}>
                        <Text style={styles.loginText}>Already have a seller account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Login to Dashboard</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(5),
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    navTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: wp(8),
        marginTop: hp(2),
        marginBottom: hp(4),
    },
    heroIllustration: {
        marginBottom: hp(3),
        shadowColor: "#E50914",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    illustrationCircle: {
        width: wp(35),
        height: wp(35),
        borderRadius: wp(17.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: normalize(32),
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: normalize(16),
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: hp(4),
        lineHeight: 24,
    },
    heroButton: {
        backgroundColor: '#111827',
        paddingVertical: hp(2),
        paddingHorizontal: wp(8),
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    heroButtonText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },

    // Glass Cards
    glassStatsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.7)',
        marginHorizontal: wp(5),
        padding: wp(5),
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: hp(4),
        // No borders
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: normalize(20),
        fontWeight: '800',
        color: '#333',
    },
    statLabel: {
        fontSize: normalize(12),
        color: '#666',
        marginTop: 4,
        fontWeight: '600'
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    // Features
    featuresContainer: {
        paddingHorizontal: wp(5),
    },
    sectionHeader: {
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(3),
    },
    glassFeatureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginBottom: hp(2),
        padding: wp(4),
        borderRadius: 20,
    },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: normalize(13),
        color: '#666',
        lineHeight: 18,
    },

    // Footer
    loginFooter: {
        marginTop: hp(2),
        alignItems: 'center',
        paddingBottom: hp(2)
    },
    loginText: {
        fontSize: normalize(14),
        color: '#888',
        marginBottom: 4
    },
    loginLink: {
        fontSize: normalize(14),
        color: '#E50914',
        fontWeight: 'bold'
    }
});

export default SellerOnboardingScreen;
