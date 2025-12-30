import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalize } from '../utils/responsive';

const NotificationSettingsScreen = ({ navigation }) => {
    // State for separate notification channels
    const [settings, setSettings] = useState({
        orderUpdates: true,
        promotions: true,
        accountActivity: true,
        chatMessages: true,
        emailNotifications: true,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('notificationSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleSwitch = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
            // In a real app, you might sync this preference to the backend here
        } catch (e) {
            console.error(e);
        }
    };

    const SettingItem = ({ title, description, value, onToggle }) => (
        <View style={styles.itemContainer}>
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.itemTitle}>{title}</Text>
                {description && <Text style={styles.itemDescription}>{description}</Text>}
            </View>
            <Switch
                trackColor={{ false: "#767577", true: "#E50914" }}
                thumbColor={value ? "#fff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onToggle}
                value={value}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionHeader}>Order Updates</Text>
                <SettingItem
                    title="Order Status"
                    description="Get updates when your order is shipped or delivered."
                    value={settings.orderUpdates}
                    onToggle={() => toggleSwitch('orderUpdates')}
                />

                <Text style={styles.sectionHeader}>Promotions & Offers</Text>
                <SettingItem
                    title="Discounts & Deals"
                    description="Receive alerts about new sales and exclusive offers."
                    value={settings.promotions}
                    onToggle={() => toggleSwitch('promotions')}
                />

                <Text style={styles.sectionHeader}>Activity</Text>
                <SettingItem
                    title="Account Security"
                    description="Notify me about logins activity and password changes."
                    value={settings.accountActivity}
                    onToggle={() => toggleSwitch('accountActivity')}
                />
                <SettingItem
                    title="Chat Messages"
                    description="Notifications for direct messages from sellers or support."
                    value={settings.chatMessages}
                    onToggle={() => toggleSwitch('chatMessages')}
                />

                <View style={styles.divider} />

                <Text style={styles.sectionHeader}>Email Preferences</Text>
                <SettingItem
                    title="Email Notifications"
                    description="Receive the above notifications via email as well."
                    value={settings.emailNotifications}
                    onToggle={() => toggleSwitch('emailNotifications')}
                />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff'
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    backBtn: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9'
    },
    itemTitle: {
        fontSize: normalize(16),
        fontWeight: '500',
        color: '#333',
        marginBottom: 4
    },
    itemDescription: {
        fontSize: normalize(13),
        color: '#888',
        lineHeight: 18
    },
    divider: {
        height: 10,
        backgroundColor: '#f5f5f5',
        marginVertical: 20,
        marginHorizontal: -20
    }
});

export default NotificationSettingsScreen;
