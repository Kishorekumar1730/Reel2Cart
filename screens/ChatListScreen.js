import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { normalize, wp, hp } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const ChatListScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchChats = async (showLoading = false) => {
                if (showLoading) setLoading(true);
                try {
                    const stored = await AsyncStorage.getItem("userInfo");
                    if (!stored) return;

                    const uid = JSON.parse(stored)._id;
                    setUserId(uid);

                    const res = await fetch(`${API_BASE_URL}/messages/conversations/${uid}`);
                    const data = await res.json();

                    if (res.ok) {
                        setChats(data);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    if (showLoading) setLoading(false);
                }
            };

            fetchChats(true);
            const interval = setInterval(() => fetchChats(false), 5000); // Poll list every 5s
            return () => clearInterval(interval);
        }, [])
    );

    const renderItem = ({ item }) => {
        const otherUser = item.otherUserId;
        if (!otherUser) return null; // Should not happen

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate("Chat", {
                    receiverId: otherUser._id,
                    receiverName: otherUser.name
                })}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#E50914', '#B81C26']}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>{otherUser.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>

                <View style={styles.chatInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{otherUser.name}</Text>
                        <Text style={styles.time}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={styles.lastMsg} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Glassmorphic Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('messages')}</Text>
                    <View style={{ width: normalize(24) }} />
                </View>

                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#E50914" /></View>
                ) : (
                    <FlatList
                        data={chats}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={normalize(80)} color="#ccc" />
                                <Text style={styles.emptyText}>{t('noMessagesYet')}</Text>
                                <Text style={styles.emptySubText}>{t('startConversation')}</Text>
                            </View>
                        }
                    />
                )}
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
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(255,255,255,0.6)', // Glassmorphism
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: '#333',
    },
    backBtn: {
        padding: 5,
    },
    list: {
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
        paddingBottom: hp(15), // Ensure visibility at bottom
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
        marginBottom: hp(1.5),
        backgroundColor: 'rgba(255,255,255,0.85)', // White card
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    avatar: {
        width: wp(13),
        height: wp(13),
        borderRadius: wp(6.5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    avatarText: {
        color: '#fff',
        fontSize: normalize(18),
        fontWeight: 'bold',
    },
    chatInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        color: '#333',
    },
    time: {
        fontSize: normalize(12),
        color: '#888',
    },
    lastMsg: {
        color: '#666',
        fontSize: normalize(14),
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: hp(10),
        opacity: 0.7,
    },
    emptyText: {
        color: '#666',
        marginTop: hp(2),
        fontSize: normalize(18),
        fontWeight: 'bold',
    },
    emptySubText: {
        color: '#999',
        marginTop: hp(1),
        fontSize: normalize(14),
    }
});

export default ChatListScreen;
