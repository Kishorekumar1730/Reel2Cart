import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');

const SellerPromoteScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showSuccess } = useAlert();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/seller/${sellerId}`);
            const data = await res.json();
            if (res.ok) setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (item) => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/promote/${item._id}`, {
                method: 'PUT'
            });
            const data = await res.json();

            if (res.ok) {
                setProducts(products.map(p =>
                    p._id === item._id ? { ...p, isFeatured: data.isFeatured } : p
                ));
                if (data.isFeatured) {
                    showSuccess(`"${item.name}" is now Boosted! 🚀`);
                } else {
                    showAlert("Update", `"${item.name}" is no longer featured.`);
                }
            } else {
                showAlert("Error", data.message || "Failed to update status");
            }
        } catch (error) {
            showAlert("Error", "Could not update promotion status");
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, item.isFeatured && styles.featuredCard]}>
            <View style={styles.cardInternal}>
                <Image source={{ uri: item.images[0] }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.price}>₹{item.price}</Text>

                    {item.isFeatured && (
                        <LinearGradient
                            colors={['#FF9800', '#F57C00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.featuredBadge}
                        >
                            <Ionicons name="rocket" size={12} color="#fff" />
                            <Text style={styles.featuredText}>Boosted</Text>
                        </LinearGradient>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.promoteBtn, item.isFeatured ? styles.activeBtn : styles.inactiveBtn]}
                    onPress={() => handlePromote(item)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.btnText, item.isFeatured ? styles.textWhite : styles.textPrimary]}>
                        {item.isFeatured ? "Active" : "Boost"}
                    </Text>
                </TouchableOpacity>
            </View>
            {item.isFeatured && (
                <View style={styles.glowLine} />
            )}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#F9F9FF', '#E8DFF5', '#CBF1F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientContainer}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Promote Products</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Banner Card */}
                    <View style={styles.bannerContainer}>
                        <LinearGradient
                            colors={['#FFF3E0', '#FFE0B2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.banner}
                        >
                            <View style={styles.bannerIcon}>
                                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#E65100" />
                            </View>
                            <Text style={styles.bannerText}>
                                Boost items to appear on top & get 2x views!
                            </Text>
                        </LinearGradient>
                    </View>

                    {loading ? (
                        <View style={styles.centered}><ActivityIndicator size="large" color="#6366F1" /></View>
                    ) : (
                        <FlatList
                            data={products}
                            keyExtractor={item => item._id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    bannerContainer: { paddingHorizontal: 20, marginBottom: 15 },
    banner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#FFB74D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bannerText: {
        flex: 1,
        color: '#BF360C',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#6B7280",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
    },
    featuredCard: {
        shadowColor: "#FF9800",
        shadowOpacity: 0.15,
        elevation: 4,
        transform: [{ scale: 1.02 }], // Slight pop
    },
    cardInternal: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    info: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    featuredBadge: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
        alignItems: 'center',
    },
    featuredText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    promoteBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    activeBtn: {
        backgroundColor: '#10B981', // Emerald green for active status
    },
    inactiveBtn: {
        backgroundColor: '#F3F4F6',
    },
    btnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    textWhite: { color: '#fff' },
    textPrimary: { color: '#4B5563' },
    glowLine: {
        height: 3,
        width: '100%',
        backgroundColor: '#FF9800',
        opacity: 0.8,
    }
});

export default SellerPromoteScreen;
