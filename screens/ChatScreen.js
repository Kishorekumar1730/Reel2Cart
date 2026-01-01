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
    ActivityIndicator,
    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/apiConfig";
import { normalize, wp, hp } from "../utils/responsive";
import { useLanguage } from "../context/LanguageContext";

const ChatScreen = ({ route, navigation }) => {
    const { t } = useLanguage();
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
            <View style={[styles.msgWrapper, isMe ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                {isMe ? (
                    <LinearGradient
                        colors={['#E50914', '#B81C26']}
                        style={[styles.msgContainer, styles.myMsg]}
                    >
                        <Text style={styles.myMsgText}>{item.message}</Text>
                        <Text style={styles.myTimeText}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </LinearGradient>
                ) : (
                    <View style={[styles.msgContainer, styles.theirMsg]}>
                        <Text style={styles.theirMsgText}>{item.message}</Text>
                        <Text style={styles.theirTimeText}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
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
            <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                >
                    {/* Glassmorphic Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <LinearGradient
                                colors={['#E50914', '#B81C26']}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>{receiverName?.charAt(0) || '?'}</Text>
                            </LinearGradient>
                            <Text style={styles.headerTitle}>{receiverName || "Chat"}</Text>
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: hp(10), flex: 1 }} />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.list}
                            style={{ flex: 1 }}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="chatbubbles-outline" size={normalize(60)} color="#ccc" />
                                    <Text style={styles.emptyText}>{t('sayHi')}</Text>
                                </View>
                            }
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('typeMessage')}
                            value={text}
                            onChangeText={setText}
                            placeholderTextColor="#888"
                        />
                        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={!text.trim()}>
                            <LinearGradient
                                colors={text.trim() ? ['#E50914', '#B81C26'] : ['#ccc', '#bbb']}
                                style={styles.sendBtnGradient}
                            >
                                <Ionicons name="send" size={normalize(20)} color="#fff" />
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
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    backBtn: { marginRight: wp(3) },
    headerInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3)
    },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: normalize(16) },
    headerTitle: { fontSize: normalize(18), fontWeight: "bold", color: '#333' },
    list: { paddingHorizontal: wp(4), paddingBottom: hp(5), paddingTop: hp(2) },
    msgWrapper: {
        marginBottom: hp(1.5),
        width: '100%',
    },
    myMsgWrapper: {
        alignItems: 'flex-end',
    },
    theirMsgWrapper: {
        alignItems: 'flex-start',
    },
    msgContainer: {
        padding: wp(3.5),
        borderRadius: 16,
        maxWidth: "80%",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    myMsg: {
        borderBottomRightRadius: 4,
    },
    theirMsg: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 4,
    },
    myMsgText: { color: "#fff", fontSize: normalize(15) },
    theirMsgText: { color: "#333", fontSize: normalize(15) },
    myTimeText: {
        fontSize: normalize(10),
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        alignSelf: 'flex-end'
    },
    theirTimeText: {
        fontSize: normalize(10),
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end'
    },
    inputContainer: {
        flexDirection: "row",
        padding: wp(3),
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: "center",
    },
    input: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        borderRadius: 25,
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.2),
        marginRight: wp(3),
        fontSize: normalize(15),
        color: '#333'
    },
    sendBtn: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    sendBtnGradient: {
        width: wp(11),
        height: wp(11),
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: hp(10),
        opacity: 0.6
    },
    emptyText: {
        color: '#888',
        marginTop: hp(2),
        fontSize: normalize(14)
    }
});

export default ChatScreen;
