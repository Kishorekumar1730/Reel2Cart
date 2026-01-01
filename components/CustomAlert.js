import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../utils/responsive'; // Assuming you have this

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, buttons = [], onClose }) => {
    if (!visible) return null;

    // Default button if none provided
    const actionButtons = buttons.length > 0 ? buttons : [
        { text: 'OK', onPress: onClose, style: 'default' }
    ];

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Modern Gradient Card */}
                <View style={styles.alertContainer}>
                    <LinearGradient
                        colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
                        style={styles.gradientBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <View style={styles.contentContainer}>
                            {/* Icon or Title Decoration */}
                            <View style={styles.iconContainer}>
                                <Ionicons name="notifications" size={32} color="#4F46E5" />
                            </View>

                            {title && <Text style={styles.title}>{title}</Text>}
                            {message && <Text style={styles.message}>{message}</Text>}

                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                {actionButtons.map((btn, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            btn.style === 'cancel' ? styles.cancelButton : styles.defaultButton,
                                            actionButtons.length > 2 && { marginBottom: 10, width: '100%' }
                                        ]}
                                        onPress={() => {
                                            if (btn.onPress) btn.onPress();
                                            // Ensure modal closes if it's a simple alert, 
                                            // but usually context handles closing via wrapper.
                                            // Here we just trigger callback.
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.buttonText,
                                            btn.style === 'cancel' ? styles.cancelText : styles.defaultText
                                        ]}>
                                            {btn.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dimmed background
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    gradientBackground: {
        padding: 24,
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly', // Center buttons
        width: '100%',
        flexWrap: 'wrap',
        gap: 12
    },
    button: {
        flex: 1,
        minWidth: 100,
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    defaultButton: {
        backgroundColor: '#4F46E5', // Indigo
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    defaultText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    cancelText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default CustomAlert;
