import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';

// InputField Component
const InputField = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', multiline = false, autoCapitalize = 'sentences', maxLength }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
            <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                multiline={multiline}
                autoCapitalize={autoCapitalize}
                maxLength={maxLength}
            />
        </View>
    </View>
);

// Account Type Selector
const AccountTypeSelector = ({ selected, onSelect }) => (
    <View style={styles.typeContainer}>
        <TouchableOpacity
            style={[styles.typeOption, selected === 'licensed' && styles.typeOptionActive]}
            onPress={() => onSelect('licensed')}
        >
            <Ionicons name="business" size={24} color={selected === 'licensed' ? '#E50914' : '#666'} />
            <Text style={[styles.typeText, selected === 'licensed' && styles.typeTextActive]}>Licensed Business</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.typeOption, selected === 'local' && styles.typeOptionActive]}
            onPress={() => onSelect('local')}
        >
            <Ionicons name="storefront" size={24} color={selected === 'local' ? '#E50914' : '#666'} />
            <Text style={[styles.typeText, selected === 'local' && styles.typeTextActive]}>Local Business</Text>
        </TouchableOpacity>
    </View>
);

// Proof Type Selector for Licensed
const ProofTypeSelector = ({ selected, onSelect }) => {
    const proofs = ['GSTIN', 'Business PAN', 'Udyam Aadhar', 'FSSAI'];
    return (
        <View style={styles.proofOptionsContainer}>
            <Text style={styles.fieldLabel}>Select Valid Proof Document:</Text>
            <View style={styles.proofBadges}>
                {proofs.map((proof) => (
                    <TouchableOpacity
                        key={proof}
                        style={[styles.proofBadge, selected === proof && styles.proofBadgeActive]}
                        onPress={() => onSelect(proof)}
                    >
                        <Text style={[styles.proofText, selected === proof && styles.proofTextActive]}>{proof}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// StepIndicator Component
const StepIndicator = ({ step }) => (
    <View style={styles.stepContainer}>
        {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepWrapper}>
                <View style={[styles.stepCircle, step >= s ? styles.activeStep : styles.inactiveStep]}>
                    <Text style={[styles.stepText, step >= s ? styles.activeStepText : styles.inactiveStepText]}>{s}</Text>
                </View>
                <Text style={styles.stepLabel}>{s === 1 ? "Contact" : s === 2 ? "Business" : "Address"}</Text>
            </View>
        ))}
        <View style={styles.line} />
        <View style={[styles.lineActive, { width: step === 1 ? '15%' : step === 2 ? '50%' : '85%' }]} />
    </View>
);

const SellerRegistrationScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [step, setStep] = useState(1);

    // Form Stats
    const [accountType, setAccountType] = useState('licensed');
    const [proofType, setProofType] = useState('GSTIN'); // Default proof for licensed

    const [sellerName, setSellerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [businessName, setBusinessName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState(''); // Single dynamic field

    const [businessAddress, setBusinessAddress] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const storedUser = await AsyncStorage.getItem("userInfo");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUserId(parsed._id);
                setSellerName(parsed.name || '');
                setEmail(parsed.email || '');
                setPhone(parsed.mobileNo || '');
            }
        };
        fetchUser();
    }, []);

    // Validation Helpers
    const validateGSTIN = (input) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(input);
    const validatePAN = (input) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(input);

    const handleNext = async () => {
        if (step === 1) {
            if (!sellerName || !email || !phone) {
                Alert.alert("Missing Details", "Please fill in all contact details.");
                return;
            }
            if (!/^\d{10}$/.test(phone)) {
                Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!businessName) {
                Alert.alert("Missing Details", "Please enter your Business Name.");
                return;
            }

            if (accountType === 'licensed') {
                if (!licenseNumber) {
                    Alert.alert("Missing Proof", `Please enter your ${proofType} number.`);
                    return;
                }

                // Call Backend to Verify
                setLoading(true);
                try {
                    const res = await fetch(`${API_BASE_URL}/seller/validate-proof`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proofType, proofId: licenseNumber.toUpperCase() })
                    });
                    const data = await res.json();
                    setLoading(false);

                    if (!res.ok || !data.valid) {
                        Alert.alert("Verification Failed", data.message || "Invalid Proof Document.");
                        return;
                    }

                    // Success - Proceed
                    Alert.alert("Verified", "Your business proof has been verified successfully.", [
                        { text: "Continue", onPress: () => setStep(3) }
                    ]);

                } catch (error) {
                    setLoading(false);
                    Alert.alert("Error", "Unable to verify proof. Check network.");
                    return;
                }
            } else {
                setStep(3);
            }
        }
    };

    const handleRegister = async () => {
        if (!businessAddress) {
            Alert.alert("Missing Details", "Please enter your registered business address.");
            return;
        }

        setLoading(true);
        try {
            // Construct payload dynamically based on chosen proof
            const payload = {
                userId,
                accountType,
                businessName,
                sellerName,
                email,
                phone,
                businessAddress,
            };

            if (accountType === 'licensed') {
                if (proofType === 'GSTIN') payload.gstin = licenseNumber;
                else if (proofType === 'Business PAN') payload.businessPan = licenseNumber;
                else {
                    payload.additionalProofType = proofType;
                    payload.additionalProofId = licenseNumber;
                }
            }

            const response = await fetch(`${API_BASE_URL}/seller/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                const successMsg = accountType === 'licensed'
                    ? "Welcome to Reel2Cart Business! Your account is active."
                    : "Application Submitted! Our team will review your local business application and notify you via email.";

                Alert.alert("Success", successMsg, [
                    {
                        text: "Go to Dashboard",
                        onPress: () => navigation.reset({
                            index: 0,
                            routes: [
                                { name: 'Home' }, // Stack base
                                { name: 'SellerDashboard' } // Active screen
                            ],
                        })
                    }
                ]);
            } else {
                Alert.alert("Registration Failed", data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={["#E50914", "#B20710"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Seller Registration</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <StepIndicator step={step} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {step === 1 && (
                        <View>
                            <Text style={styles.sectionHeader}>Step 1: Contact Details</Text>
                            <Text style={styles.sectionSubHeader}>Let's start with your basic contact information.</Text>

                            <InputField
                                label="Full Name"
                                value={sellerName}
                                onChangeText={setSellerName}
                                placeholder="Your Name"
                                icon="person-outline"
                            />
                            <InputField
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="business@example.com"
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <InputField
                                label="Mobile Number"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="10-digit number"
                                icon="call-outline"
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View>
                            <Text style={styles.sectionHeader}>Step 2: Business & Tax</Text>
                            <Text style={styles.sectionSubHeader}>Select your business type and verify.</Text>

                            <AccountTypeSelector selected={accountType} onSelect={setAccountType} />

                            <InputField
                                label="Business Name"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="e.g. Reel2Cart Retail"
                                icon="briefcase-outline"
                            />

                            {accountType === 'licensed' ? (
                                <>
                                    <ProofTypeSelector selected={proofType} onSelect={(t) => { setProofType(t); setLicenseNumber(''); }} />

                                    <InputField
                                        label={`${proofType} Number`}
                                        value={licenseNumber}
                                        onChangeText={(text) => setLicenseNumber(text.toUpperCase())}
                                        placeholder={`Enter your ${proofType}`}
                                        icon="document-text-outline"
                                        autoCapitalize="characters"
                                    />

                                    <View style={styles.infoBox}>
                                        <Ionicons name="shield-checkmark" size={20} color="#1976D2" />
                                        <Text style={styles.infoText}>We verify your {proofType} to enable instant payouts and trust badges.</Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.warningBox}>
                                    <Ionicons name="alert-circle" size={24} color="#E65100" />
                                    <Text style={styles.warningText}>
                                        Local businesses without license certificates are subject to manual verification by Reel2Cart Admin.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {step === 3 && (
                        <View>
                            <Text style={styles.sectionHeader}>Step 3: Location</Text>
                            <Text style={styles.sectionSubHeader}>Where should we pick up your products?</Text>

                            <InputField
                                label="Registered Business Address"
                                value={businessAddress}
                                onChangeText={setBusinessAddress}
                                placeholder="Store No, Street, City, State, Pincode"
                                icon="location-outline"
                                multiline={true}
                            />

                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryTitle}>Summary</Text>
                                <Text style={styles.summaryText}>• Type: {accountType === 'licensed' ? 'Licensed' : 'Local Business'}</Text>
                                <Text style={styles.summaryText}>• Name: {businessName}</Text>
                                {accountType === 'licensed' && <Text style={styles.summaryText}>• {proofType}: {licenseNumber}</Text>}
                            </View>
                        </View>
                    )}

                    <View style={styles.footerButtons}>
                        {step < 3 ? (
                            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                                <Text style={styles.nextButtonText}>Next Step</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 5 }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{accountType === 'licensed' ? 'Complete Registration' : 'Submit for Approval'}</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    stepContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingTop: 20,
        marginBottom: 10,
        position: 'relative',
    },
    stepWrapper: {
        alignItems: 'center',
        zIndex: 2,
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#ddd',
    },
    activeStep: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    inactiveStep: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeStepText: {
        color: '#fff',
    },
    inactiveStepText: {
        color: '#777',
    },
    stepLabel: {
        fontSize: 12,
        color: '#555',
    },
    line: {
        position: 'absolute',
        top: 35,
        left: 40,
        right: 40,
        height: 2,
        backgroundColor: '#eee',
        zIndex: 1,
    },
    lineActive: {
        position: 'absolute',
        top: 35,
        left: 40,
        height: 2,
        backgroundColor: '#E50914',
        zIndex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    sectionSubHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fafafa',
        paddingHorizontal: 10,
        height: 50,
    },
    multilineWrapper: {
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    multilineInput: {
        textAlignVertical: 'top',
        height: '100%',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    infoText: {
        color: '#0D47A1',
        marginLeft: 10,
        fontSize: 12,
        flex: 1,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF3E0',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    warningText: {
        color: '#E65100',
        marginLeft: 10,
        fontSize: 13,
        flex: 1,
    },
    summaryBox: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
    summaryTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 14,
    },
    summaryText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 3,
    },
    footerButtons: {
        marginTop: 10,
    },
    nextButton: {
        backgroundColor: '#E50914',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 8,
        elevation: 2,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    typeOption: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginHorizontal: 5,
        backgroundColor: '#fff',
    },
    typeOptionActive: {
        borderColor: '#E50914',
        backgroundColor: '#FFF0F1',
    },
    typeText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    typeTextActive: {
        color: '#E50914',
    },
    proofOptionsContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
        fontWeight: '500',
    },
    proofBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    proofBadge: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    proofBadgeActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    proofText: {
        color: '#555',
        fontSize: 12,
        fontWeight: '500',
    },
    proofTextActive: {
        color: '#fff',
    },
});

export default SellerRegistrationScreen;
