import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';

const SellerSupportScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!subject || !message) {
            Alert.alert("Missing Fields", "Please enter both subject and message.");
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
                Alert.alert("Submitted", "Your ticket has been created. We will contact you soon.", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", "Could not submit ticket.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Support Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Subject</Text>
                <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="e.g. Payment Issue"
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Describe your issue in detail..."
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
                </TouchableOpacity>

                <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>Or contact us directly:</Text>
                    <Text style={styles.contactItem}>Email: reel2cart2025@gmail.com</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
    textArea: { height: 120 },
    submitBtn: { backgroundColor: '#E50914', padding: 15, borderRadius: 8, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    contactInfo: { marginTop: 40, alignItems: 'center' },
    contactTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    contactItem: { color: '#666', marginBottom: 5 }
});

export default SellerSupportScreen;
