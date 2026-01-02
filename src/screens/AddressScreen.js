import React, { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    Pressable,
    Alert,
    Modal,
    Platform,
    ActivityIndicator,
    StatusBar,
    KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config/apiConfig"; // Ensure this exists or use context
import { useLanguage } from "../context/LanguageContext";
import { wp, hp, normalize } from "../utils/responsive";

const AddressScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useLanguage();
    const { source, totalAmount, items } = route.params || {};
    const [addresses, setAddresses] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const availableCountries = [
        "India",
        "United States",
        "United Kingdom",
        "Canada",
        "Australia",
        "United Arab Emirates",
        "Germany",
        "France",
        "Japan"
    ];

    // Form State
    const [name, setName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [houseNo, setHouseNo] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("India");
    const [postalCode, setPostalCode] = useState("");

    const fetchUser = async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem("userInfo");
            if (storedUserInfo) {
                const parsedUser = JSON.parse(storedUserInfo);
                setUserId(parsedUser._id);
                fetchAddresses(parsedUser._id);
            }
        } catch (error) {
            console.log("Error fetching user info", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUser();
        }, [])
    );

    const fetchAddresses = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${id}`);
            const data = await response.json();
            if (response.ok) {
                setAddresses(data.addresses);
            } else {
                console.log("Error fetching addresses");
            }
        } catch (error) {
            console.log("Error", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setMobileNo("");
        setHouseNo("");
        setStreet("");
        setLandmark("");
        setCity("");
        setState("");
        setCountry("India");
        setPostalCode("");
        setEditingAddress(null);
    };

    const handleAddAddress = async () => {
        if (!name || !mobileNo || !houseNo || !street || !city || !state || !postalCode) {
            Alert.alert(t('error'), t('fillRequired'));
            return;
        }

        const addressData = {
            name,
            mobileNo,
            houseNo,
            street,
            landmark,
            city,
            state,
            country,
            postalCode,
        };

        setLoading(true);
        try {
            let url = `${API_BASE_URL}/addresses`;
            let method = "POST";
            let body = { userId, address: addressData };

            if (editingAddress) {
                url = `${API_BASE_URL}/addresses/${editingAddress._id}`;
                method = "PUT";
                body = { address: addressData };
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                Alert.alert(t('success'), editingAddress ? t('addressUpdated') : t('addressAdded'));
                fetchAddresses(userId);
                setModalVisible(false);
                resetForm();
            } else {
                Alert.alert(t('error'), t('failedSaveAddress'));
            }
        } catch (error) {
            console.log("Error saving address", error);
            Alert.alert(t('error'), t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setName(address.name);
        setMobileNo(address.mobileNo);
        setHouseNo(address.houseNo);
        setStreet(address.street);
        setLandmark(address.landmark);
        setCity(address.city);
        setState(address.state);
        setCountry(address.country);
        setPostalCode(address.postalCode);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        Alert.alert(t('confirmDelete'), t('deleteAddressConfirm'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            fetchAddresses(userId);
                            Alert.alert(t('success'), t('addressDeleted') || "Address Deleted");
                        }
                    } catch (error) {
                        console.log("Error deleting", error);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ])
    };

    return (
        <LinearGradient
            colors={['#FDFBFF', '#E8DFF5', '#CBF1F5']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </Pressable>
                        <Text style={styles.headerTitle}>{t('yourAddresses')}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Pressable
                            onPress={() => {
                                resetForm();
                                setModalVisible(true);
                            }}
                            style={styles.addButton}
                        >
                            <Text style={styles.addButtonText}>{t('addAddress')}</Text>
                            <Ionicons name="add-circle-outline" size={28} color="#E50914" />
                        </Pressable>

                        {loading && !modalVisible ? (
                            <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />
                        ) : (
                            addresses.map((item, index) => (
                                <Pressable key={index} style={styles.addressCard}>
                                    <View style={styles.addressHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="location" size={20} color="#E50914" style={{ marginRight: 8 }} />
                                            <Text style={styles.nameText}>{item.name}</Text>
                                        </View>
                                        <View style={styles.actionButtons}>
                                            <Pressable onPress={() => handleEdit(item)} style={styles.iconBtn}>
                                                <Ionicons name="pencil" size={18} color="#007AFF" />
                                            </Pressable>
                                            <Pressable onPress={() => handleDelete(item._id)} style={styles.iconBtn}>
                                                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.addressText}>
                                        {item.houseNo}, {item.street}
                                    </Text>
                                    <Text style={styles.addressText}>
                                        {item.landmark ? item.landmark + ", " : ""}
                                        {item.city}, {item.state}, {item.country}
                                    </Text>
                                    <Text style={styles.addressText}>{t('mobile')}: {item.mobileNo}</Text>
                                    <Text style={styles.addressText}>{t('pincode')}: {item.postalCode}</Text>

                                    {source === 'Cart' && (
                                        <Pressable
                                            onPress={() => navigation.navigate("Payment", {
                                                totalAmount: totalAmount,
                                                items: items,
                                                shippingAddress: item
                                            })}
                                            style={styles.deliverBtn}
                                        >
                                            <Text style={styles.deliverBtnText}>{t('deliverToThisAddress')}</Text>
                                        </Pressable>
                                    )}

                                    {source === 'OrderDetail' && (
                                        <Pressable
                                            onPress={async () => {
                                                const { orderId } = route.params;
                                                setLoading(true);
                                                try {
                                                    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/address`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ address: item }),
                                                    });
                                                    if (response.ok) {
                                                        Alert.alert(t('success'), t('orderAddressUpdated'));
                                                        navigation.navigate("OrderDetail", { order: { ...route.params.initialOrder, shippingAddress: item } });
                                                    } else {
                                                        Alert.alert(t('error'), t('failedUpdateAddress'));
                                                    }
                                                } catch (error) {
                                                    console.log("Error updating order address", error);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            style={[styles.deliverBtn, { backgroundColor: '#2196F3', borderColor: '#1976D2' }]}
                                        >
                                            <Text style={[styles.deliverBtnText, { color: '#fff' }]}>{t('deliverToThisAddress')}</Text>
                                        </Pressable>
                                    )}
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Add/Edit Modal */}
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(false);
                        resetForm();
                    }}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Text style={{ color: '#007AFF', fontSize: normalize(16) }}>{t('cancel')}</Text>
                            </Pressable>
                            <Text style={styles.modalTitle}>{editingAddress ? t('editAddress') : t('addNewAddress')}</Text>
                            <Pressable onPress={handleAddAddress}>
                                <Text style={{ color: '#E50914', fontSize: normalize(16), fontWeight: 'bold' }}>{t('save')}</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.formScroll}>
                            {/* Name */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('fullNameRequired')}</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t('fullName')}
                                    style={styles.input}
                                />
                            </View>

                            {/* Mobile */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('mobileRequired')}</Text>
                                <TextInput
                                    value={mobileNo}
                                    onChangeText={setMobileNo}
                                    placeholder={t('mobile')}
                                    keyboardType="phone-pad"
                                    style={styles.input}
                                />
                            </View>

                            {/* House */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('addressLine1Required')}</Text>
                                <TextInput
                                    value={houseNo}
                                    onChangeText={setHouseNo}
                                    placeholder=""
                                    style={styles.input}
                                />
                            </View>

                            {/* Street */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('addressLine2Required')}</Text>
                                <TextInput
                                    value={street}
                                    onChangeText={setStreet}
                                    placeholder=""
                                    style={styles.input}
                                />
                            </View>

                            {/* Landmark */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('landmarkOptional')}</Text>
                                <TextInput
                                    value={landmark}
                                    onChangeText={setLandmark}
                                    placeholder="E.g. near Apollo Hospital"
                                    style={styles.input}
                                />
                            </View>

                            {/* City & State */}
                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>{t('townCity')}</Text>
                                    <TextInput
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder=""
                                        style={styles.input}
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>{t('state')}</Text>
                                    <TextInput
                                        value={state}
                                        onChangeText={setState}
                                        placeholder=""
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* Zip & Country */}
                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>{t('pincode')}</Text>
                                    <TextInput
                                        value={postalCode}
                                        onChangeText={setPostalCode}
                                        placeholder=""
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />
                                </View>

                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>{t('countryRegion')}</Text>
                                    <Pressable
                                        style={[styles.input, { justifyContent: 'center', backgroundColor: '#fff' }]}
                                        onPress={() => setCountryModalVisible(true)}
                                    >
                                        <Text style={{ fontSize: normalize(16), color: '#333' }}>{country}</Text>
                                        <Ionicons name="caret-down" size={normalize(16)} color="#666" style={{ position: 'absolute', right: 10 }} />
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable onPress={handleAddAddress} style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>{editingAddress ? t('updateAddress') : t('addAddress')}</Text>
                            </Pressable>
                        </ScrollView>

                        {/* Country Selection Modal */}
                        <Modal
                            visible={countryModalVisible}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setCountryModalVisible(false)}
                        >
                            <View style={styles.countryModalOverlay}>
                                <View style={styles.countryModalContent}>
                                    <View style={styles.countryModalHeader}>
                                        <Text style={styles.countryModalTitle}>{t('selectCountry')}</Text>
                                        <Pressable onPress={() => setCountryModalVisible(false)}>
                                            <Ionicons name="close" size={24} color="#000" />
                                        </Pressable>
                                    </View>
                                    <ScrollView>
                                        {availableCountries.map((c, index) => (
                                            <Pressable
                                                key={index}
                                                style={styles.countryItem}
                                                onPress={() => {
                                                    setCountry(c);
                                                    setCountryModalVisible(false);
                                                }}
                                            >
                                                <Text style={[styles.countryText, country === c && styles.selectedCountryText]}>
                                                    {c}
                                                </Text>
                                                {country === c && <Ionicons name="checkmark" size={20} color="#E50914" />}
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default AddressScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.4)', // Glassmorphic
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.5)',
    },
    headerContent: {
        // Redundant with new header style
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: "bold",
        color: "#333", // Dark color for light gradient
    },
    scrollContent: {
        padding: wp(4),
        paddingBottom: hp(10),
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: wp(4),
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: 12,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.6)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        fontSize: normalize(16),
        color: "#333",
        fontWeight: '500',
    },
    addressCard: {
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: wp(4),
        borderRadius: 12,
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: hp(1),
    },
    nameText: {
        fontSize: normalize(16),
        fontWeight: "bold",
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: hp(1),
    },
    addressText: {
        fontSize: normalize(14),
        color: "#555",
        marginBottom: hp(0.5),
        lineHeight: normalize(24),
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconBtn: {
        padding: 5,
        marginLeft: wp(2),
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(4),
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    modalTitle: {
        fontSize: normalize(17),
        fontWeight: 'bold',
    },
    formScroll: {
        padding: wp(5),
    },
    formGroup: {
        marginBottom: hp(2),
    },
    label: {
        fontSize: normalize(14),
        fontWeight: '600',
        marginBottom: hp(1),
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: wp(3),
        fontSize: normalize(15),
        backgroundColor: '#f9f9f9',
        minHeight: hp(6),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    saveBtn: {
        backgroundColor: '#E50914',
        padding: hp(1.8),
        borderRadius: 8,
        alignItems: 'center',
        marginTop: hp(2),
    },
    saveBtnText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    deliverBtn: {
        backgroundColor: '#FFD814',
        padding: hp(1.5),
        borderRadius: 8,
        marginTop: hp(2),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCD200'
    },
    deliverBtnText: {
        fontSize: normalize(16),
        color: '#333',
        fontWeight: 'bold'
    },
    // Country Modal Styles
    countryModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    countryModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        maxHeight: '60%',
    },
    countryModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    countryModalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
    },
    countryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    countryText: {
        fontSize: normalize(16),
        color: '#333',
    },
    selectedCountryText: {
        color: '#E50914',
        fontWeight: 'bold',
    },
});
