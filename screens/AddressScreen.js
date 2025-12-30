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
    ActivityIndicator
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
    const [editingAddress, setEditingAddress] = useState(null);

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
            Alert.alert("Error", "Please fill in all required fields.");
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
                Alert.alert("Success", `Address ${editingAddress ? "Updated" : "Added"} Successfully`);
                fetchAddresses(userId);
                setModalVisible(false);
                resetForm();
            } else {
                Alert.alert("Error", "Failed to save address");
            }
        } catch (error) {
            console.log("Error saving address", error);
            Alert.alert("Error", "Network error");
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
        Alert.alert("Confirm Delete", "Are you sure you want to delete this address?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            fetchAddresses(userId);
                            Alert.alert("Success", "Address Deleted");
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
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={["#E50914", "#B20710"]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Your Addresses</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.container}>
                <Pressable
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                    style={styles.addButton}
                >
                    <Text style={styles.addButtonText}>Add a new address</Text>
                    <Ionicons name="add-circle-outline" size={24} color="#000" />
                </Pressable>

                {loading && !modalVisible ? (
                    <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />
                ) : (
                    addresses.map((item, index) => (
                        <Pressable key={index} style={styles.addressCard}>
                            <View style={styles.addressHeader}>
                                <Text style={styles.nameText}>{item.name}</Text>
                                <View style={styles.actionButtons}>
                                    <Pressable onPress={() => handleEdit(item)} style={styles.iconBtn}>
                                        <Ionicons name="create-outline" size={20} color="#007AFF" />
                                    </Pressable>
                                    <Pressable onPress={() => handleDelete(item._id)} style={styles.iconBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                                    </Pressable>
                                </View>
                            </View>

                            <Text style={styles.addressText}>
                                {item.houseNo}, {item.street}
                            </Text>
                            <Text style={styles.addressText}>
                                {item.landmark ? item.landmark + ", " : ""}
                                {item.city}, {item.state}, {item.country}
                            </Text>
                            <Text style={styles.addressText}>Phone: {item.mobileNo}</Text>
                            <Text style={styles.addressText}>Pin code: {item.postalCode}</Text>

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
                                                Alert.alert("Success", "Order address updated");
                                                // Navigate back to params, forcing a refresh if possible, or just go back
                                                // Ideally pass the updated order back or rely on focus effect
                                                navigation.navigate("OrderDetail", { order: { ...route.params.initialOrder, shippingAddress: item } }); // Simplistic update
                                            } else {
                                                Alert.alert("Error", "Failed to update address");
                                            }
                                        } catch (error) {
                                            console.log("Error updating order address", error);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    style={[styles.deliverBtn, { backgroundColor: '#2196F3', borderColor: '#1976D2' }]}
                                >
                                    <Text style={[styles.deliverBtnText, { color: '#fff' }]}>Deliver to this Address</Text>
                                </Pressable>
                            )}
                        </Pressable>
                    ))
                )}
            </ScrollView>


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
                            <Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.modalTitle}>{editingAddress ? "Edit Address" : "Add New Address"}</Text>
                        <Pressable onPress={handleAddAddress}>
                            <Text style={{ color: '#E50914', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.formScroll}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full Name (Required)</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mobile Number (Required)</Text>
                            <TextInput
                                value={mobileNo}
                                onChangeText={setMobileNo}
                                placeholder="10-digit mobile number"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Flat, House no., Building (Required)</Text>
                            <TextInput
                                value={houseNo}
                                onChangeText={setHouseNo}
                                placeholder=""
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Area, Street, Sector, Village (Required)</Text>
                            <TextInput
                                value={street}
                                onChangeText={setStreet}
                                placeholder=""
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Landmark (Optional)</Text>
                            <TextInput
                                value={landmark}
                                onChangeText={setLandmark}
                                placeholder="E.g. near Apollo Hospital"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Town/City</Text>
                                <TextInput
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder=""
                                    style={styles.input}
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>State</Text>
                                <TextInput
                                    value={state}
                                    onChangeText={setState}
                                    placeholder=""
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Pincode</Text>
                                <TextInput
                                    value={postalCode}
                                    onChangeText={setPostalCode}
                                    placeholder=""
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Country</Text>
                                <TextInput
                                    value={country}
                                    onChangeText={setCountry}
                                    placeholder="India"
                                    style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                                    editable={false}
                                />
                            </View>
                        </View>

                        <Pressable onPress={handleAddAddress} style={styles.saveBtn}>
                            <Text style={styles.saveBtnText}>{editingAddress ? "Update Address" : "Add Address"}</Text>
                        </Pressable>

                    </ScrollView>
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
};

export default AddressScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    container: {
        padding: 10,
        paddingBottom: 50,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    addButtonText: {
        fontSize: 16,
        color: "#333",
    },
    addressCard: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    addressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    nameText: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    addressText: {
        fontSize: 14,
        color: "#555",
        marginBottom: 3,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconBtn: {
        padding: 5,
        marginLeft: 10,
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
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    formScroll: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        height: 45,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    saveBtn: {
        backgroundColor: '#E50914',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deliverBtn: {
        backgroundColor: '#FFD814',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCD200'
    },
    deliverBtnText: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold'
    }

});
