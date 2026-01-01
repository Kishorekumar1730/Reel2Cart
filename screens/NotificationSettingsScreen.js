import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalize, wp, hp } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

const NotificationSettingsScreen = ({ navigation }) => {
    const { t } = useLanguage();
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
        } catch (e) {
            console.error(e);
        }
    };

    const SettingItem = ({ title, description, value, onToggle, last }) => (
        <View style={[styles.itemContainer, last && styles.lastItem]}>
            <View style={{ flex: 1, paddingRight: wp(4) }}>
                <Text style={styles.itemTitle}>{title}</Text>
                {description && <Text style={styles.itemDescription}>{description}</Text>}
            </View>
            <Switch
                trackColor={{ false: "#ccc", true: "#E50914" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onToggle}
                value={value}
            />
        </View>
    );

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={normalize(26)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('notifications')}</Text>
                    <View style={{ width: 30 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.sectionHeader}>{t('orderUpdates')}</Text>
                    <View style={styles.glassCard}>
                        <SettingItem
                            title={t('orderStatus')}
                            description={t('orderStatusDesc')}
                            value={settings.orderUpdates}
                            onToggle={() => toggleSwitch('orderUpdates')}
                            last
                        />
                    </View>

                    <Text style={styles.sectionHeader}>{t('promotionsOffers')}</Text>
                    <View style={styles.glassCard}>
                        <SettingItem
                            title={t('discountsDeals')}
                            description={t('discountsDealsDesc')}
                            value={settings.promotions}
                            onToggle={() => toggleSwitch('promotions')}
                            last
                        />
                    </View>

                    <Text style={styles.sectionHeader}>{t('activity')}</Text>
                    <View style={styles.glassCard}>
                        <SettingItem
                            title={t('accountSecurity')}
                            description={t('accountSecurityDesc')}
                            value={settings.accountActivity}
                            onToggle={() => toggleSwitch('accountActivity')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            title={t('chatMessages')}
                            description={t('chatMessagesDesc')}
                            value={settings.chatMessages}
                            onToggle={() => toggleSwitch('chatMessages')}
                            last
                        />
                    </View>

                    <Text style={styles.sectionHeader}>{t('emailPreferences')}</Text>
                    <View style={styles.glassCard}>
                        <SettingItem
                            title={t('emailNotifications')}
                            description={t('emailNotificationsDesc')}
                            value={settings.emailNotifications}
                            onToggle={() => toggleSwitch('emailNotifications')}
                            last
                        />
                    </View>

                    <View style={{ height: hp(5) }} />

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1a1a1a',
    },
    backBtn: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: wp(6),
        paddingBottom: hp(5),
    },
    sectionHeader: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#555',
        marginTop: hp(2.5),
        marginBottom: hp(1.5),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: wp(1)
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        padding: wp(4),
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: "#E8DFF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 2,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(1),
    },
    lastItem: {
        // No bottom border or spacing if needed
    },
    itemTitle: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    itemDescription: {
        fontSize: normalize(13),
        color: '#666',
        lineHeight: normalize(18)
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: hp(1.5),
    }
});

export default NotificationSettingsScreen;
