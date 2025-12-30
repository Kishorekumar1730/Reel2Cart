import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

const AIChatScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([
        { id: '1', text: "Hello! I'm your sophisticated personal shopping assistant. How can I assist you today? 🛍️", sender: 'ai', type: 'text' }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const quickSuggestions = ["Where is my order? 📦", "Show me sneakers 👟", "Best deals today 🔥"];

    const sendMessage = async (textOverride) => {
        const text = textOverride || inputText.trim();
        if (!text) return;

        // Add User Message
        const userMsg = { id: Date.now().toString(), text, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);

        try {
            const userStr = await AsyncStorage.getItem('userInfo');
            const userId = userStr ? JSON.parse(userStr)._id : null;

            const res = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: text })
            });
            const data = await res.json();

            // Add AI Message
            let aiMsg = {
                id: (Date.now() + 1).toString(),
                text: data.text,
                sender: 'ai',
                type: 'text',
                suggestions: data.suggestions
            };
            setMessages(prev => [...prev, aiMsg]);

            // Add Product Cards if any
            if (data.products && data.products.length > 0) {
                const prodMsg = {
                    id: (Date.now() + 2).toString(),
                    sender: 'ai',
                    type: 'products',
                    products: data.products
                };
                setMessages(prev => [...prev, prodMsg]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: 'err', text: "I'm having trouble connecting to the brain. Please try again. 🔌", sender: 'ai', type: 'text' }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';

        if (item.type === 'products') {
            return (
                <View style={styles.productRow}>
                    <FlatList
                        data={item.products}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={p => p._id}
                        renderItem={({ item: p }) => (
                            <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetails', { product: p })}>
                                <Image source={{ uri: p.images[0] }} style={styles.productImage} />
                                <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                                <Text style={styles.productPrice}>₹{p.price}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <LinearGradient colors={['#E50914', '#b81c26']} style={styles.avatarGradient}>
                            <Ionicons name="sparkles" size={12} color="#fff" />
                        </LinearGradient>
                    </View>
                )}
                <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.aiContent]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.headerTitle}>AI Personal Assistant</Text>
                    <Text style={styles.headerSubtitle}>Always here to help</Text>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContent}
                style={{ flex: 1 }}
            />

            {/* Suggestion Chips */}
            {messages.length < 3 && (
                <View style={styles.suggestionsContainer}>
                    {quickSuggestions.map((s, index) => (
                        <TouchableOpacity key={index} style={styles.chip} onPress={() => sendMessage(s)}>
                            <Text style={styles.chipText}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask anything..."
                        value={inputText}
                        onChangeText={setInputText}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() && !loading) && { opacity: 0.5 }]}
                        onPress={() => sendMessage()}
                        disabled={!inputText.trim() || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 12, color: '#2ecc71', fontWeight: '600' },
    chatContent: { padding: 15, paddingBottom: 20 },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 15,
        maxWidth: '85%',
    },
    userBubble: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    aiBubble: { alignSelf: 'flex-start' },
    aiAvatar: { marginRight: 8, marginTop: 5 },
    avatarGradient: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    bubbleContent: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '100%'
    },
    userContent: { backgroundColor: '#333', borderBottomRightRadius: 4 },
    aiContent: { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 1 },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: '#333' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f2f6',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        color: '#333',
        maxHeight: 100
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2
    },
    suggestionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    chip: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    chipText: { fontSize: 13, color: '#555' },
    productRow: { marginBottom: 15, marginLeft: 35 },
    productCard: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 8,
        marginRight: 10,
        elevation: 2
    },
    productImage: { width: '100%', height: 100, borderRadius: 8, resizeMode: 'cover', marginBottom: 5 },
    productName: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 2 },
    productPrice: { fontSize: 13, color: '#E50914', fontWeight: 'bold' }
});

export default AIChatScreen;
