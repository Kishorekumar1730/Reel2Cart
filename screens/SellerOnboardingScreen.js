import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, normalize } from '../utils/responsive';

const { width } = Dimensions.get('window');

const SellerOnboardingScreen = () => {
    const navigation = useNavigation();

    const FeatureItem = ({ icon, title, description }) => (
        <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
                <MaterialIcons name={icon} size={32} color="#E50914" />
            </View>
            <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Image / Hero Section */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['#E50914', '#B20710']}
                        style={styles.heroGradient}
                    >
                        <View style={styles.navBar}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.navTitle}>Reel2Cart Business</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>Become a Seller on Reel2Cart</Text>
                            <Text style={styles.heroSubtitle}>Reach millions of customers and grow your business today.</Text>
                            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('SellerRegistration')}>
                                <Text style={styles.heroButtonText}>Start Selling</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats / Trust Banner */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>10M+</Text>
                        <Text style={styles.statLabel}>Customers</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>24/7</Text>
                        <Text style={styles.statLabel}>Support</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>0%</Text>
                        <Text style={styles.statLabel}>Listing Fees</Text>
                    </View>
                </View>

                {/* Why Sell Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Why sell on Reel2Cart?</Text>

                    <FeatureItem
                        icon="public"
                        title="Reach Huge Audience"
                        description="Access crores of customers across the country instantly."
                    />
                    <FeatureItem
                        icon="payments"
                        title="Timely Payments"
                        description="Get paid securely and on time directly to your bank account."
                    />
                    <FeatureItem
                        icon="local-shipping"
                        title="Stress-free Shipping"
                        description="Ship your products easily with our logistics partners."
                    />
                    <FeatureItem
                        icon="support-agent"
                        title="Dedicated Support"
                        description="Expert seller support to help you at every step."
                    />
                </View>

                {/* Call to Action Footer */}
                <View style={styles.ctaContainer}>
                    <Text style={styles.ctaText}>Ready to start your journey?</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('SellerRegistration')}>
                        <Text style={styles.ctaButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    heroSection: {
        height: hp(35),
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    heroGradient: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    navTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 30,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    heroButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 5,
    },
    heroButtonText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -30,
        padding: 20,
        borderRadius: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#eee',
    },
    sectionContainer: {
        padding: 20,
        marginTop: 10,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 20,
        textAlign: 'center',
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 25,
        alignItems: 'center',
    },
    featureIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF0F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    ctaContainer: {
        backgroundColor: '#F8F9FA',
        padding: 30,
        marginHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    ctaText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    ctaButton: {
        backgroundColor: '#E50914',
        paddingVertical: 15,
        width: '100%',
        borderRadius: 10,
        alignItems: 'center',
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SellerOnboardingScreen;
