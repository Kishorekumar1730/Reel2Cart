import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';



const FAQS = [
    {
        question: "Where is my order?",
        answer: "You can track your order status in the 'Orders' section. We also send SMS and email updates at every step."
    },
    {
        question: "How do I return an item?",
        answer: "Go to 'Orders', select the item, and tap 'Return/Replace'. Ensure the product is unused and tags are intact."
    },
    {
        question: "When will I get my refund?",
        answer: "Refunds are processed within 5-7 business days after we receive the returned item. It will be credited to your original payment method."
    },
    {
        question: "How can I change my delivery address?",
        answer: "You can change the address before the order is shipped from the 'My Orders' section. Once shipped, address changes may not be possible."
    },
    {
        question: "I received a damaged product.",
        answer: "We apologize for this! Please report it within 24 hours of delivery via 'My Orders' > 'Return' > 'Damaged Item' to get a replacement."
    }
];

const HelpScreen = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [expandedIndex, setExpandedIndex] = useState(null);

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleContact = (type) => {
        if (type === 'email') Linking.openURL('mailto:reel2cart2025@gmail.com');
        if (type === 'call') Linking.openURL('tel:1800123456');
        if (type === 'chat') alert("Live Chat connecting...");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#131921', '#232f3e']} style={styles.header}>
                <View style={styles.headerRow}>
                    <AnimatedButton onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Home');
                    }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </AnimatedButton>
                    <Text style={styles.headerTitle}>Help Center</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Text style={styles.greeting}>How can we help you?</Text>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Search for issues..."
                        placeholderTextColor="#999"
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Support Options */}
                <View style={styles.supportGrid}>
                    <AnimatedButton style={styles.supportCard} onPress={() => navigation.navigate('Orders')}>
                        <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                            <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
                        </View>
                        <Text style={styles.supportLabel}>My Orders</Text>
                    </AnimatedButton>

                    <AnimatedButton style={styles.supportCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialIcons name="assignment-return" size={28} color="#4CAF50" />
                        </View>
                        <Text style={styles.supportLabel}>Returns</Text>
                    </AnimatedButton>

                    <AnimatedButton style={styles.supportCard} onPress={() => navigation.navigate('PaymentMethod')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialIcons name="payment" size={28} color="#FF9800" />
                        </View>
                        <Text style={styles.supportLabel}>Payment</Text>
                    </AnimatedButton>

                    <AnimatedButton style={styles.supportCard} onPress={() => navigation.navigate('EditProfile')}>
                        <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                            <MaterialIcons name="person" size={28} color="#9C27B0" />
                        </View>
                        <Text style={styles.supportLabel}>Account</Text>
                    </AnimatedButton>
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqList}>
                    {FAQS.filter(f => f.question.toLowerCase().includes(search.toLowerCase())).map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <AnimatedButton style={styles.faqHeader} onPress={() => toggleFAQ(index)}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons name={expandedIndex === index ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                            </AnimatedButton>
                            {expandedIndex === index && (
                                <View style={styles.faqBody}>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Contact Us */}
                <Text style={styles.sectionTitle}>Still need help?</Text>
                <View style={styles.contactContainer}>
                    <AnimatedButton style={styles.contactItem} onPress={() => handleContact('chat')}>
                        <Ionicons name="chatbubbles-outline" size={24} color="#E50914" />
                        <View style={styles.contactText}>
                            <Text style={styles.contactTitle}>Chat with us</Text>
                            <Text style={styles.contactSub}>Instant support</Text>
                        </View>
                    </AnimatedButton>

                    <View style={styles.divider} />

                    <AnimatedButton style={styles.contactItem} onPress={() => handleContact('call')}>
                        <Ionicons name="call-outline" size={24} color="#E50914" />
                        <View style={styles.contactText}>
                            <Text style={styles.contactTitle}>Call us</Text>
                            <Text style={styles.contactSub}>1800-123-456</Text>
                        </View>
                    </AnimatedButton>

                    <View style={styles.divider} />

                    <AnimatedButton style={styles.contactItem} onPress={() => handleContact('email')}>
                        <Ionicons name="mail-outline" size={24} color="#E50914" />
                        <View style={styles.contactText}>
                            <Text style={styles.contactTitle}>Email us</Text>
                            <Text style={styles.contactSub}>Get response in 24h</Text>
                        </View>
                    </AnimatedButton>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    content: {
        padding: 20,
    },
    supportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    supportCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    supportLabel: {
        fontWeight: '600',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 5,
    },
    faqList: {
        marginBottom: 30,
    },
    faqItem: {
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 1,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    faqBody: {
        padding: 15,
        paddingTop: 0,
        backgroundColor: '#fafafa',
    },
    faqAnswer: {
        color: '#666',
        lineHeight: 20,
    },
    contactContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 5,
        elevation: 2,
        marginBottom: 30,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    contactText: {
        marginLeft: 15,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    contactSub: {
        color: '#999',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 54,
    }
});

export default HelpScreen;
