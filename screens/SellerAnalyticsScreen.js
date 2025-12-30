import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

const { width } = Dimensions.get('window');

const SellerAnalyticsScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/seller/analytics/${sellerId}`);
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderBarChart = () => {
        // Simple manual bar chart rendering
        const maxVal = Math.max(...(stats?.chartData || [0]));

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Monthly Earnings</Text>
                <View style={styles.barsArea}>
                    {stats?.chartData?.map((val, index) => {
                        const height = maxVal > 0 ? (val / maxVal) * 150 : 0;
                        return (
                            <View key={index} style={styles.barGroup}>
                                <View style={[styles.bar, { height, backgroundColor: '#E50914' }]} />
                                <Text style={styles.barLabel}>{stats.labels[index]}</Text>
                            </View>
                        )
                    })}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#fff" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator color="#2575fc" size="large" /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Total Earnings</Text>
                        <Text style={styles.cardValue}>₹{stats?.totalEarnings?.toLocaleString()}</Text>
                    </View>

                    {renderBarChart()}

                    <View style={styles.insightBox}>
                        <Ionicons name="bulb-outline" size={24} color="#FFD700" />
                        <Text style={styles.insightText}>
                            Your sales have increased by 15% this month! Keep adding trending products to boost visibility.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, marginTop: -30 }, // Overlap header
    card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 5, alignItems: 'center' },
    cardLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
    cardValue: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    chartContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 3 },
    chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    barsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180 },
    barGroup: { alignItems: 'center', width: 30 },
    bar: { width: 12, borderRadius: 6 },
    barLabel: { fontSize: 10, color: '#666', marginTop: 5 },
    insightBox: { flexDirection: 'row', backgroundColor: '#FFF9C4', padding: 15, borderRadius: 10, alignItems: 'center' },
    insightText: { marginLeft: 10, flex: 1, color: '#5D4037', fontSize: 13 }
});

export default SellerAnalyticsScreen;
