import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";
import { normalize, wp, hp } from "../utils/responsive";

const ChatScreen = ({ route, navigation }) => {
    const { receiverId, receiverName } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        const init = async () => {
            const stored = await AsyncStorage.getItem("userInfo");
            if (stored) {
                setUserId(JSON.parse(stored)._id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchMessages(true); // Initial load with spinner
            const interval = setInterval(() => fetchMessages(false), 2000); // Poll every 2s (Silent)
            return () => clearInterval(interval);
        }
    }, [userId, receiverId]);

    const fetchMessages = async (showLoading = false) => {
        if (!userId) return;
        try {
            if (showLoading) setLoading(true);
            const response = await fetch(`${API_BASE_URL}/messages/${userId}/${receiverId}`);
            const data = await response.json();
            if (response.ok) {
                // Only update if length changed or new last message (simple optimization)
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!text.trim()) return;

        const newMessage = {
            senderId: userId,
            receiverId,
            message: text
        };

        // Optimistic Update
        setMessages([...messages, { ...newMessage, createdAt: new Date() }]);
        setText("");

        try {
            await fetch(`${API_BASE_URL}/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newMessage),
            });
            fetchMessages(); // Sync
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === userId;
        return (
            <View style={[styles.msgContainer, isMe ? styles.myMsg : styles.theirMsg]}>
                <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.theirMsgText]}>
                    {item.message}
                </Text>
                <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{receiverName?.charAt(0) || '?'}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{receiverName || "Chat"}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.5 }}>
                            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                            <Text style={{ color: '#999', marginTop: 10 }}>No messages yet. Say hi! 👋</Text>
                        </View>
                    }
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={text}
                        onChangeText={setText}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                        <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backBtn: { marginRight: 15 },
    headerInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarText: { color: '#fff', fontWeight: 'bold' },
    headerTitle: { fontSize: 18, fontWeight: "bold" },
    list: { padding: 15, paddingBottom: 20 },
    msgContainer: {
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        maxWidth: "80%",
    },
    myMsg: {
        alignSelf: "flex-end",
        backgroundColor: "#E50914",
    },
    theirMsg: {
        alignSelf: "flex-start",
        backgroundColor: "#f0f0f0",
    },
    msgText: { fontSize: 16 },
    myMsgText: { color: "#fff" },
    theirMsgText: { color: "#333" },
    timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end', opacity: 0.7 },
    inputContainer: {
        flexDirection: "row",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        alignItems: "center",
    },
    input: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16
    },
    sendBtn: {
        backgroundColor: "#E50914",
        padding: 10,
        borderRadius: 25,
    },
});

export default ChatScreen;
