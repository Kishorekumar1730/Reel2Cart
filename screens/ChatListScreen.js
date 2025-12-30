import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';
import { normalize } from '../utils/responsive';

const ChatListScreen = ({ navigation }) => {
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
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{otherUser.name.charAt(0).toUpperCase()}</Text>
                </View>
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#E50914" /></View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>No messages yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    list: { padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    chatInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 16, fontWeight: 'bold' },
    time: { fontSize: 12, color: '#999' },
    lastMsg: { color: '#666', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 15, fontSize: 16 }
});

export default ChatListScreen;
