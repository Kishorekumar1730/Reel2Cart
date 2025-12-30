import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';

const SellerPromoteScreen = ({ route, navigation }) => {
    const { sellerId } = route.params;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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
        // Toggle promotion status
        try {
            const res = await fetch(`${API_BASE_URL}/products/promote/${item._id}`, {
                method: 'PUT'
            });
            const data = await res.json();

            if (res.ok) {
                // Update local state
                setProducts(products.map(p =>
                    p._id === item._id ? { ...p, isFeatured: data.isFeatured } : p
                ));
                Alert.alert("Success", data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Could not update promotion status");
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, item.isFeatured && styles.featuredCard]}>
            <Image source={{ uri: item.images[0] }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>

                {item.isFeatured && (
                    <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={10} color="#fff" />
                        <Text style={styles.featuredText}>Featured</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={[styles.promoteBtn, item.isFeatured ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => handlePromote(item)}
            >
                <MaterialCommunityIcons
                    name={item.isFeatured ? "rocket" : "rocket-outline"}
                    size={20}
                    color={item.isFeatured ? "#fff" : "#FF9800"}
                />
                <Text style={[styles.btnText, item.isFeatured && { color: '#fff' }]}>
                    {item.isFeatured ? "Promoted" : "Boost"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Promote Products</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.banner}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFD700" />
                <Text style={styles.bannerText}>
                    Boost your products to appear on the main page and get 2x more views!
                </Text>
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator color="#E50914" /></View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    banner: { flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 15, alignItems: 'center' },
    bannerText: { marginLeft: 10, color: '#E65100', fontSize: 12, flex: 1 },
    list: { padding: 15 },
    card: { flexDirection: 'row', padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginBottom: 10, alignItems: 'center' },
    featuredCard: { borderColor: '#FF9800', backgroundColor: '#FFF8E1' },
    image: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f0f0f0' },
    info: { flex: 1, marginLeft: 15 },
    name: { fontWeight: '600', fontSize: 14 },
    price: { fontSize: 12, color: '#666', marginTop: 2 },
    featuredBadge: { flexDirection: 'row', backgroundColor: '#FF9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4, alignItems: 'center' },
    featuredText: { color: '#fff', fontSize: 10, marginLeft: 3, fontWeight: 'bold' },
    promoteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    inactiveBtn: { borderColor: '#FF9800', backgroundColor: '#fff' },
    activeBtn: { borderColor: '#FF9800', backgroundColor: '#FF9800' },
    btnText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5, color: '#FF9800' }
});

export default SellerPromoteScreen;
