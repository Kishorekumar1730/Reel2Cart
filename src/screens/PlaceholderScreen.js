import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, normalize } from '../utils/responsive'; // Ensure you have this utility

const PlaceholderScreen = ({ name = "Coming Soon" }) => {
    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                <View style={styles.contentContainer}>
                    <View style={styles.glassCard}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="construct-outline" size={normalize(50)} color="#E50914" />
                        </View>
                        <Text style={styles.title}>{name}</Text>
                        <Text style={styles.subTitle}>
                            This screen is currently under development. Stay tuned for updates!
                        </Text>
                    </View>
                </View>
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
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(5),
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: 25,
        paddingVertical: hp(5),
        paddingHorizontal: wp(8),
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: "#E8DFF5",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    iconContainer: {
        width: wp(22),
        height: wp(22),
        borderRadius: wp(11),
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: '#2d3436',
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    subTitle: {
        fontSize: normalize(15),
        color: '#636e72',
        textAlign: 'center',
        lineHeight: normalize(22),
        paddingHorizontal: wp(2),
    },
});

export default PlaceholderScreen;
