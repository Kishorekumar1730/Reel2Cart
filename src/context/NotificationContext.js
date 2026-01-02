import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config/apiConfig';

const NotificationContext = createContext();

if (Constants.executionEnvironment !== 'storeClient' && Constants.appOwnership !== 'expo') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

async function registerForPushNotificationsAsync() {
    if (Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo') {
        console.log("Push Notifications skipped in Expo Go (Execution Environment check).");
        return null;
    }

    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            // Check for Expo Go
            if (Constants.executionEnvironment === 'storeClient') {
                console.log("Push Notifications restricted in Expo Go. Use Dev Build.");
                return;
            }

            const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
            if (!projectId) {
                console.warn("No projectId found. Skipping push token fetch.");
                return;
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
            console.log("Expo Push Token:", token);
        } catch (e) {
            console.warn("Error fetching push token:", e.message);
        }
    } else {
        // console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expoPushToken, setExpoPushToken] = useState('');

    const notificationListener = useRef();
    const responseListener = useRef();

    const fetchNotifications = useCallback(async () => {
        try {
            const storedUser = await AsyncStorage.getItem("userInfo");
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const response = await fetch(`${API_BASE_URL}/notifications/${user._id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                const unread = data.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Notification polling error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Push Notification Setup
    useEffect(() => {
        const setupPush = async () => {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                setExpoPushToken(token);

                // Send to backend
                const storedUser = await AsyncStorage.getItem("userInfo");
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    try {
                        await fetch(`${API_BASE_URL}/user/push-token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user._id, pushToken: token })
                        });
                    } catch (e) {
                        console.error("Failed to save push token to backend", e);
                    }
                }
            }
        };

        setupPush();

        if (Constants.executionEnvironment !== 'storeClient' && Constants.appOwnership !== 'expo') {
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                fetchNotifications();
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log("Notification Clicked:", response);
            });
        }

        return () => {
            if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
            if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    // Initial fetch and Poll
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAllAsRead = async () => {
        // Optimistic UI update
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
        setUnreadCount(0);

        // Ideally call backend API here to mark read
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAllAsRead,
            expoPushToken
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
