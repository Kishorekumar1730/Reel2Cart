import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { wp, hp, normalize } from '../utils/responsive';
import { useCurrency } from '../context/CurrencyContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const SellerAnalyticsScreen = ({ route, navigation }) => {
    // SellerId might come from params or assume current logged in user context
    const sellerId = route.params?.sellerId;
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();

    // Date Filter State
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date'); // 'date'
    const [dateType, setDateType] = useState('start'); // 'start' or 'end'

    const [isFilterActive, setIsFilterActive] = useState(false);

    useEffect(() => {
        if (sellerId) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [sellerId, startDate, endDate]);

    const fetchStats = async () => {
        try {
            let url = `${API_BASE_URL}/seller/analytics/${sellerId}`;
            const params = [];
            if (startDate) params.push(`startDate=${startDate.toISOString()}`);
            if (endDate) params.push(`endDate=${endDate.toISOString()}`);

            if (params.length > 0) url += `?${params.join('&')}`;

            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setStats(data);
                setIsFilterActive(!!(startDate || endDate));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            if (dateType === 'start') {
                setStartDate(selectedDate);
                // If end date is before start date, reset end date
                if (endDate && endDate < selectedDate) setEndDate(null);
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const openDatePicker = (type) => {
        setDateType(type);
        setShowPicker(true);
    };

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setIsFilterActive(false); // Refetch triggered by useEffect
    };

    const renderBarChart = () => {
        // Prevent Divide by Zero
        const maxVal = Math.max(...(stats?.chartData || [0]));
        const displayMax = maxVal === 0 ? 100 : maxVal;

        return (
            <View style={styles.glassCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Earnings Trend</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isFilterActive && (
                            <Text style={styles.filterBadge}>Filtered</Text>
                        )}
                        <Ionicons name="bar-chart-outline" size={20} color="#666" />
                    </View>
                </View>

                <View style={styles.barsArea}>
                    {stats?.chartData?.length > 0 ? (
                        stats.chartData.map((val, index) => {
                            const height = (val / displayMax) * 150;
                            const barHeight = val > 0 ? Math.max(height, 5) : 0;

                            return (
                                <View key={index} style={styles.barGroup}>
                                    <View style={styles.barContainer}>
                                        <View style={[styles.barValueBubble, { opacity: val > 0 ? 1 : 0 }]}>
                                            <Text style={styles.barValueText}>{formatPrice(val)}</Text>
                                        </View>
                                        <LinearGradient
                                            colors={['#E50914', '#FF5F6D']}
                                            style={[styles.bar, { height: barHeight }]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                        />
                                    </View>
                                    <Text style={styles.barLabel}>{stats?.labels?.[index] || `M${index + 1}`}</Text>
                                </View>
                            )
                        })
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.placeholderText}>No data for this period.</Text>
                        </View>
                    )}
                </View>
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
            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Analytics Dashboard</Text>
                    {/* Placeholder right action if needed */}
                    <View style={{ width: 40 }} />
                </View>

                {/* Date Filter Section */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Date Range:</Text>
                    <View style={styles.dateButtonsRow}>
                        <TouchableOpacity onPress={() => openDatePicker('start')} style={[styles.dateBtn, startDate && styles.activeDateBtn]}>
                            <Ionicons name="calendar-outline" size={16} color={startDate ? "#fff" : "#666"} />
                            <Text style={[styles.dateBtnText, startDate && styles.activeDateText]}>
                                {startDate ? startDate.toLocaleDateString() : 'Start Date'}
                            </Text>
                        </TouchableOpacity>
                        <Ionicons name="arrow-forward" size={16} color="#999" style={{ marginHorizontal: 5 }} />
                        <TouchableOpacity onPress={() => openDatePicker('end')} style={[styles.dateBtn, endDate && styles.activeDateBtn]}>
                            <Ionicons name="calendar-outline" size={16} color={endDate ? "#fff" : "#666"} />
                            <Text style={[styles.dateBtnText, endDate && styles.activeDateText]}>
                                {endDate ? endDate.toLocaleDateString() : 'End Date'}
                            </Text>
                        </TouchableOpacity>

                        {isFilterActive && (
                            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                                <Ionicons name="close-circle" size={20} color="#E50914" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centered}><ActivityIndicator color="#E50914" size="large" /></View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Summary Cards */}
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryCard, styles.glassCardSmall]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="cash-outline" size={22} color="#E50914" />
                                </View>
                                <Text style={styles.summaryLabel}>Earnings</Text>
                                <Text style={styles.summaryValue}>{formatPrice(stats?.totalEarnings || 0)}</Text>
                            </View>
                            <View style={[styles.summaryCard, styles.glassCardSmall]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E8EAED' }]}>
                                    <Ionicons name="cart-outline" size={22} color="#333" />
                                </View>
                                <Text style={styles.summaryLabel}>Sales</Text>
                                <Text style={styles.summaryValue}>{stats?.totalSales || 0}</Text>
                            </View>
                        </View>

                        {/* Chart */}
                        {renderBarChart()}

                        {/* Insights */}
                        <View style={styles.insightBox}>
                            <View style={styles.insightIconAcc}>
                                <Ionicons name="bulb" size={24} color="#FFD700" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.insightTitle}>Performance Insight</Text>
                                <Text style={styles.insightText}>
                                    {stats?.totalSales > 0
                                        ? "Your sales are trending upward! Consider promoting your top-selling items to maximize reach."
                                        : "Start listing popular items to see your analytics grow!"}
                                </Text>
                            </View>
                        </View>

                    </ScrollView>
                )}

                {/* Date Picker Modal Logic */}
                {showPicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={dateType === 'start' ? (startDate || new Date()) : (endDate || new Date())}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()} // Cannot select future
                        minimumDate={dateType === 'end' ? startDate : undefined}
                    />
                )}

            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        marginBottom: 10
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)'
    },
    headerTitle: {
        color: '#333',
        fontSize: normalize(18),
        fontWeight: '700'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5)
    },

    // Glassmorphism Cards - Ensuring NO Borders & NO Shadows
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.75)', // Slightly more opaque for better contrast without shadow
        borderRadius: 20,
        padding: wp(5),
        marginBottom: hp(2.5),
        // Removed shadows/elevation for completely clean look
    },
    glassCardSmall: {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 15,
        padding: wp(4),
        // Removed shadows/elevation for completely clean look
    },

    // Filter Section
    filterSection: {
        paddingHorizontal: wp(5),
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: normalize(12),
        color: '#666',
        marginBottom: 5,
        fontWeight: '600'
    },
    dateButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        // Removed borderWidth entirely
    },
    activeDateBtn: {
        backgroundColor: '#E50914',
    },
    dateBtnText: {
        fontSize: normalize(12),
        color: '#333',
        marginLeft: 5,
        fontWeight: '500'
    },
    activeDateText: {
        color: '#fff'
    },
    clearBtn: {
        marginLeft: 10,
        padding: 5
    },
    filterBadge: {
        fontSize: 10,
        color: '#E50914',
        backgroundColor: '#FFE5E5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
        fontWeight: 'bold'
    },

    // Summary Section
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(2.5),
    },
    summaryCard: {
        width: '48%',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDECEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    summaryLabel: {
        fontSize: normalize(12),
        color: '#666',
        marginBottom: 4
    },
    summaryValue: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#111'
    },

    // Chart Area
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(3)
    },
    chartTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#333'
    },
    barsArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: hp(25),
        paddingHorizontal: 10
    },
    barGroup: {
        alignItems: 'center',
        width: 30,
        height: '100%',
        justifyContent: 'flex-end'
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
        width: '100%',
    },
    bar: {
        width: 10,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        minHeight: 5
    },
    barLabel: {
        fontSize: normalize(10),
        color: '#666',
        marginTop: 8,
        fontWeight: '600'
    },
    barValueBubble: {
        marginBottom: 5,
        backgroundColor: '#333',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    barValueText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold'
    },
    emptyChart: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Insights
    insightBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFDE7',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 0, // Explicitly removed border
        marginBottom: hp(2.5)
    },
    insightIconAcc: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        elevation: 1
    },
    insightTitle: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#F57F17',
        marginBottom: 2
    },
    insightText: {
        color: '#5D4037',
        fontSize: normalize(12),
        lineHeight: 18
    },
    emptyList: {
        paddingVertical: 20,
        alignItems: 'center'
    },
    placeholderText: {
        color: '#aaa',
        fontSize: normalize(12)
    }
});

export default SellerAnalyticsScreen;
