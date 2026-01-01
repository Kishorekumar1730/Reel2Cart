import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

const OrderSuccessModal = ({ visible, message = "Order Placed Successfully!", onClose }) => {
    const scaleValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Spring Animation for Checkmark
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={false} // Full screen
            visible={visible}
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={['#10B981', '#047857']} // Emerald Gradient
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleValue }] }]}>
                        <Ionicons name="checkmark" size={64} color="#10B981" />
                    </Animated.View>

                    <Text style={styles.title}>Success!</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.buttonText}>Continue Shopping</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        width: '100%',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: normalize(32),
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
        letterSpacing: 1,
    },
    message: {
        fontSize: normalize(18),
        color: '#D1FAE5', // Light green
        textAlign: 'center',
        marginBottom: 60,
        lineHeight: 26,
    },
    button: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#047857',
        fontSize: normalize(16),
        fontWeight: '700',
    }
});

export default OrderSuccessModal;
