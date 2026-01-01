import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const AIChatScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([
        { id: '1', text: t('aiGreeting'), sender: 'ai', type: 'text' }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const quickSuggestions = [t('suggestionOrder'), t('suggestionSneakers'), t('suggestionDeals')];

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

            // Simulate API for UI demo if endpoint fails or for smooth feel
            // In real app, remove this mock timeout and use fetch
            // const res = await fetch(`${API_BASE_URL}/ai/chat`...);

            const res = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: text })
            });

            // Fallback for demo if API isn't ready
            let data;
            if (res.ok) {
                data = await res.json();
            } else {
                // Mock response for aesthetics testing if API fails
                data = { text: t('aiDefaultResponse'), suggestions: [] };
            }

            // Add AI Message
            let aiMsg = {
                id: (Date.now() + 1).toString(),
                text: data.text || t('checkingTrends'),
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
            setMessages(prev => [...prev, { id: 'err', text: t('aiConnectionError'), sender: 'ai', type: 'text' }]);
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
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                                    <Text style={styles.productPrice}>₹{p.price}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingHorizontal: wp(2) }}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <LinearGradient colors={['#FF512F', '#DD2476']} style={styles.avatarGradient}>
                            <Ionicons name="sparkles" size={normalize(12)} color="#fff" />
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
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
                >
                    {/* Glassmorphic Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>{t('aiAssistant')}</Text>
                            <Text style={styles.headerSubtitle}>{t('alwaysHere')}</Text>
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
                        showsVerticalScrollIndicator={false}
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
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('askAnything')}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholderTextColor="#888"
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() && !loading) && { opacity: 0.6 }]}
                            onPress={() => sendMessage()}
                            disabled={!inputText.trim() || loading}
                        >
                            <LinearGradient
                                colors={['#FF512F', '#DD2476']}
                                style={styles.sendButtonGradient}
                            >
                                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={normalize(18)} color="#fff" />}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    backButton: {
        padding: 5,
    },
    headerTextContainer: {
        marginLeft: wp(3),
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: normalize(12),
        color: '#E50914', // Brand accent
        fontWeight: '600',
    },
    chatContent: {
        padding: wp(4),
        paddingBottom: hp(15),
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: hp(2),
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    aiBubble: {
        alignSelf: 'flex-start',
    },
    aiAvatar: {
        marginRight: wp(2),
        marginTop: 5,
    },
    avatarGradient: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleContent: {
        padding: wp(3.5),
        borderRadius: 18,
        maxWidth: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userContent: {
        backgroundColor: '#333', // Dark premium
        borderBottomRightRadius: 4,
    },
    aiContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 4,
    },
    messageText: {
        fontSize: normalize(14),
        lineHeight: normalize(20),
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: wp(3),
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 25,
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.2),
        marginRight: wp(3),
        color: '#333',
        fontSize: normalize(14),
        maxHeight: hp(12),
    },
    sendButton: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(4),
        marginBottom: hp(1.5),
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: '#fff',
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(1),
        borderRadius: 20,
        marginRight: wp(2),
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#E8E8E8',
        elevation: 1,
    },
    chipText: {
        fontSize: normalize(12),
        color: '#555',
        fontWeight: '500',
    },
    productRow: {
        marginBottom: hp(2),
        marginLeft: wp(10), // Offset for avatar
    },
    productCard: {
        width: wp(35),
        backgroundColor: '#fff',
        borderRadius: 12,
        marginRight: wp(3),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
        paddingBottom: 8,
    },
    productImage: {
        width: '100%',
        height: wp(30),
        resizeMode: 'cover',
    },
    productInfo: {
        padding: 8,
    },
    productName: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        height: normalize(32), // 2 lines approx
    },
    productPrice: {
        fontSize: normalize(13),
        color: '#E50914',
        fontWeight: 'bold',
    },
});

export default AIChatScreen;
