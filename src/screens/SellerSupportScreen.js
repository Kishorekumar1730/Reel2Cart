import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');

const SellerSupportScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert, showSuccess } = useAlert();

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            showAlert("Incomplete", "Please enter both subject and message.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/support/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, subject, message })
            });

            if (res.ok) {
                showSuccess("Ticket Created! We will contact you shortly.", () => {
                    navigation.goBack();
                });
            } else {
                showAlert("Error", "Could not submit ticket.");
            }
        } catch (error) {
            console.error(error);
            showAlert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#F9F9FF', '#E8DFF5', '#CBF1F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientContainer}
            >
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Support Center</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            {/* Intro Text */}
                            <Text style={styles.introText}>
                                How can we help you today? Fill out the form below or contact us directly.
                            </Text>

                            <View style={styles.formCard}>
                                <Text style={styles.label}>Subject</Text>
                                <TextInput
                                    style={styles.input}
                                    value={subject}
                                    onChangeText={setSubject}
                                    placeholder="e.g. Payment Issue"
                                    placeholderTextColor="#9CA3AF"
                                />

                                <Text style={styles.label}>Message</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={message}
                                    onChangeText={setMessage}
                                    placeholder="Describe your issue in detail..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={loading}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#FF512F', '#DD2476']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.submitBtn}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <View style={styles.btnContent}>
                                                <Text style={styles.submitText}>Submit Ticket</Text>
                                                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.contactCard}>
                                <Text style={styles.contactTitle}>Direct Contact</Text>
                                <View style={styles.contactRow}>
                                    <View style={styles.iconCircle}>
                                        <MaterialCommunityIcons name="email" size={20} color="#DD2476" />
                                    </View>
                                    <View>
                                        <Text style={styles.contactLabel}>Email Support</Text>
                                        <Text style={styles.contactValue}>reel2cart2025@gmail.com</Text>
                                    </View>
                                </View>
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introText: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 24,
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        height: 120,
    },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    contactCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fff',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    }
});

export default SellerSupportScreen;
