import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Linking, LayoutAnimation, Platform, UIManager, TouchableOpacity, StatusBar } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, normalize } from '../utils/responsive';
import { useLanguage } from '../context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    // UIManager.setLayoutAnimationEnabledExperimental is a no-op in new architecture
}

const getFaqs = (t) => [
    {
        question: t('faq1Q'),
        answer: t('faq1A')
    },
    {
        question: t('faq2Q'),
        answer: t('faq2A')
    },
    {
        question: t('faq3Q'),
        answer: t('faq3A')
    },
    {
        question: t('faq4Q'),
        answer: t('faq4A')
    },
    {
        question: t('faq5Q'),
        answer: t('faq5A')
    }
];

const HelpScreen = ({ navigation }) => {
    const { t, language } = useLanguage();

    const getHelpUrl = () => {
        const langMap = {
            'English': 'en',
            'العربية': 'ar',
            'हिंदी': 'hi',
            'தமிழ்': 'ta',
            'తెలుగు': 'te',
            'മലയാളം': 'ml',
            'ಕನ್ನಡ': 'kn'
        };
        const langCode = langMap[language] || 'en';
        return `https://reel2cart-legal.vercel.app/help?lang=${langCode}`;
    };
    const [search, setSearch] = useState('');
    const [expandedIndex, setExpandedIndex] = useState(null);

    const FAQS = getFaqs(t);

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleContact = (type) => {
        if (type === 'chat') {
            navigation.navigate('AIChat');
        } else if (type === 'email') {
            Linking.openURL('mailto:shopflix2025@gmail.com');
        } else if (type === 'call') {
            Linking.openURL('tel:+919345413178');
        }
    };

    return (
        <LinearGradient
            colors={['#F9F9FF', '#F3E5F5', '#E1F5FE']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.floatingBackButton}
                >
                    <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroPreTitle}>{t('support')}</Text>
                        <Text style={styles.heroTitle}>{t('howCanWeHelp')}</Text>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={normalize(20)} color="#888" style={styles.searchIcon} />
                            <TextInput
                                placeholder={t('searchHelp')}
                                placeholderTextColor="#999"
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>

                    {/* Quick Access Grid - Large Cards */}
                    <View style={styles.gridContainer}>
                        <AnimatedButton style={styles.largeCard} onPress={() => navigation.navigate('Orders')}>
                            <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.cardGradient}>
                                <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                                    <Feather name="package" size={normalize(28)} color="#2196F3" />
                                </View>
                                <View>
                                    <Text style={styles.cardTitle}>{t('myOrders')}</Text>
                                    <Text style={styles.cardSub}>{t('trackManage')}</Text>
                                </View>
                            </LinearGradient>
                        </AnimatedButton>

                        <AnimatedButton style={styles.largeCard} onPress={() => navigation.navigate('Orders')}>
                            <LinearGradient colors={['#E8F5E9', '#FFFFFF']} style={styles.cardGradient}>
                                <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                                    <Feather name="refresh-cw" size={normalize(28)} color="#4CAF50" />
                                </View>
                                <View>
                                    <Text style={styles.cardTitle}>{t('returns')}</Text>
                                    <Text style={styles.cardSub}>{t('refundStatus')}</Text>
                                </View>
                            </LinearGradient>
                        </AnimatedButton>

                        <AnimatedButton style={styles.largeCard} onPress={() => navigation.navigate('PaymentMethod')}>
                            <LinearGradient colors={['#FFF3E0', '#FFFFFF']} style={styles.cardGradient}>
                                <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                                    <Feather name="credit-card" size={normalize(28)} color="#FF9800" />
                                </View>
                                <View>
                                    <Text style={styles.cardTitle}>{t('payments')}</Text>
                                    <Text style={styles.cardSub}>{t('methodsHistory')}</Text>
                                </View>
                            </LinearGradient>
                        </AnimatedButton>

                        <AnimatedButton style={styles.largeCard} onPress={() => navigation.navigate('EditProfile')}>
                            <LinearGradient colors={['#F3E5F5', '#FFFFFF']} style={styles.cardGradient}>
                                <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                                    <Feather name="user" size={normalize(28)} color="#9C27B0" />
                                </View>
                                <View>
                                    <Text style={styles.cardTitle}>{t('accountSettings')}</Text>
                                    <Text style={styles.cardSub}>{t('profileSettings')}</Text>
                                </View>
                            </LinearGradient>
                        </AnimatedButton>
                    </View>

                    {/* FAQ Surface */}
                    <Text style={styles.sectionTitle}>{t('faq')}</Text>
                    <View style={styles.faqSurface}>
                        {FAQS.filter(f => f.question.toLowerCase().includes(search.toLowerCase())).map((faq, index, arr) => (
                            <View key={index}>
                                <TouchableOpacity style={styles.faqItem} onPress={() => toggleFAQ(index)}>
                                    <View style={styles.faqRow}>
                                        <Text style={[styles.faqQuestion, expandedIndex === index && styles.faqQuestionActive]}>
                                            {faq.question}
                                        </Text>
                                        <Ionicons
                                            name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                                            size={normalize(18)}
                                            color="#999"
                                        />
                                    </View>
                                    {expandedIndex === index && (
                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                    )}
                                </TouchableOpacity>
                                {index < arr.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>

                    {/* Contact Section */}
                    <Text style={[styles.sectionTitle, { marginTop: hp(4) }]}>{t('contactSupport')}</Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.9}
                        onPress={() => handleContact('chat')}
                    >
                        <LinearGradient
                            colors={['#ff3a3aff', '#d13434ff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryButtonGradient}
                        >
                            <View style={styles.btnContent}>
                                <Ionicons name="chatbubbles" size={normalize(24)} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.primaryBtnText}>{t('chatWithAi')}</Text>
                            </View>
                            <View style={styles.onlineBadge}>
                                <View style={styles.dot} />
                                <Text style={styles.onlineText}>{t('online')}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.secondaryRow}>
                        <TouchableOpacity style={styles.outlineBtn} onPress={() => handleContact('email')}>
                            <Ionicons name="mail-outline" size={normalize(20)} color="#333" />
                            <Text style={styles.outlineBtnText}>{t('email')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.outlineBtn} onPress={() => handleContact('call')}>
                            <Ionicons name="call-outline" size={normalize(20)} color="#333" />
                            <Text style={styles.outlineBtnText}>{t('call')}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.outlineBtn, { width: '100%', marginTop: hp(2), backgroundColor: '#1a1a1a' }]}
                        onPress={() => Linking.openURL(getHelpUrl())}
                    >
                        <Ionicons name="globe-outline" size={normalize(20)} color="#fff" />
                        <Text style={[styles.outlineBtnText, { color: '#fff' }]}>View Detailed Online Guide</Text>
                    </TouchableOpacity>

                    <View style={{ height: hp(5) }} />

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    container: { flex: 1 },
    floatingBackButton: {
        position: 'absolute',
        top: hp(5),
        left: wp(5),
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 50,
        padding: 8,
        elevation: 2,
    },
    content: {
        paddingTop: hp(12), // Space for back button
        paddingHorizontal: wp(6),
        paddingBottom: hp(5),
    },
    heroSection: {
        marginBottom: hp(4),
    },
    heroPreTitle: {
        fontSize: normalize(14),
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#666',
        marginBottom: 5,
        fontWeight: '600',
    },
    heroTitle: {
        fontSize: normalize(32),
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: hp(3),
        letterSpacing: -0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: wp(5),
        height: hp(7),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
    },
    searchIcon: {
        marginRight: wp(3),
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(16),
        fontWeight: '500',
        color: '#333',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: hp(4),
    },
    largeCard: {
        width: '48%',
        marginBottom: hp(2),
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardGradient: {
        padding: wp(4.5),
        height: hp(18),
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    cardSub: {
        fontSize: normalize(13),
        color: '#888',
    },
    sectionTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: hp(2),
        marginLeft: 4,
    },
    faqSurface: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: hp(1),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    faqItem: {
        paddingVertical: hp(2.5),
        paddingHorizontal: wp(5),
    },
    faqRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: normalize(15),
        fontWeight: '500',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    faqQuestionActive: {
        fontWeight: '600',
        color: '#000',
    },
    faqAnswer: {
        marginTop: hp(1.5),
        fontSize: normalize(14),
        color: '#666',
        lineHeight: normalize(22),
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: wp(5),
    },
    primaryButton: {
        marginBottom: hp(2),
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#ff0000ff",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(2.5),
        paddingHorizontal: wp(6),
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: normalize(17),
        fontWeight: '700',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 4,
    },
    onlineText: {
        color: '#fff',
        fontSize: normalize(12),
        fontWeight: '600',
    },
    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    outlineBtn: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(2),
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    outlineBtnText: {
        marginLeft: 8,
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#333',
    }
});

export default HelpScreen;
