import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

// InputField Component
const InputField = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', multiline = false, autoCapitalize = 'sentences', maxLength }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
            <Ionicons name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
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
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={selected === 'licensed' ? ['#FEE2E2', '#FECACA'] : ['#F9FAFB', '#F9FAFB']}
                style={styles.typeOptionGradient}
            >
                <MaterialCommunityIcons name="briefcase-check" size={28} color={selected === 'licensed' ? '#DC2626' : '#9CA3AF'} />
                <Text style={[styles.typeText, selected === 'licensed' && styles.typeTextActive]}>Licensed</Text>
            </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.typeOption, selected === 'local' && styles.typeOptionActive]}
            onPress={() => onSelect('local')}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={selected === 'local' ? ['#FEE2E2', '#FECACA'] : ['#F9FAFB', '#F9FAFB']}
                style={styles.typeOptionGradient}
            >
                <MaterialCommunityIcons name="storefront" size={28} color={selected === 'local' ? '#DC2626' : '#9CA3AF'} />
                <Text style={[styles.typeText, selected === 'local' && styles.typeTextActive]}>Local</Text>
            </LinearGradient>
        </TouchableOpacity>
    </View>
);

// Proof Type Selector for Licensed
const ProofTypeSelector = ({ selected, onSelect }) => {
    const proofs = ['GSTIN', 'Business PAN', 'Udyam Aadhar', 'FSSAI'];
    return (
        <View style={styles.proofOptionsContainer}>
            <Text style={styles.fieldLabel}>Select Verified Proof:</Text>
            <View style={styles.proofBadges}>
                {proofs.map((proof) => (
                    <TouchableOpacity
                        key={proof}
                        style={[styles.proofBadge, selected === proof && styles.proofBadgeActive]}
                        onPress={() => onSelect(proof)}
                        activeOpacity={0.7}
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
        <View style={styles.line} />
        <View style={[styles.lineActive, { width: step === 1 ? '5%' : step === 2 ? '50%' : '95%' }]} />
        {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepWrapper}>
                <View style={[styles.stepCircle, step >= s ? styles.activeStep : styles.inactiveStep]}>
                    {step > s ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                        <Text style={[styles.stepText, step >= s ? styles.activeStepText : styles.inactiveStepText]}>{s}</Text>
                    )}
                </View>
                <Text style={[styles.stepLabel, step >= s && styles.activeStepLabel]}>
                    {s === 1 ? "Contact" : s === 2 ? "Business" : "Address"}
                </Text>
            </View>
        ))}
    </View>
);

const SellerRegistrationScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { showAlert, showSuccess } = useAlert();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [step, setStep] = useState(1);

    // Form Stats
    const [accountType, setAccountType] = useState('licensed');
    const [proofType, setProofType] = useState('GSTIN');

    const [sellerName, setSellerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [businessName, setBusinessName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
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

    const handleNext = async () => {
        if (step === 1) {
            if (!sellerName || !email || !phone) {
                showAlert("Missing Details", "Please fill in all contact details.");
                return;
            }
            if (!/^\d{10}$/.test(phone)) {
                showAlert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!businessName) {
                showAlert("Missing Details", "Please enter your Business Name.");
                return;
            }

            if (accountType === 'licensed') {
                if (!licenseNumber) {
                    showAlert("Missing Proof", `Please enter your ${proofType} number.`);
                    return;
                }

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
                        showAlert("Verification Failed", data.message || "Invalid Proof Document.");
                        return;
                    }

                    showSuccess("Business Verified Successfully!", () => setStep(3));

                } catch (error) {
                    setLoading(false);
                    showAlert("Error", "Unable to verify proof. Check network.");
                    return;
                }
            } else {
                setStep(3);
            }
        }
    };

    const handleRegister = async () => {
        if (!businessAddress) {
            showAlert("Missing Details", "Please enter your registered business address.");
            return;
        }

        setLoading(true);
        try {
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
                    : "Application Submitted! Our team will review your application.";

                showSuccess(successMsg, () => {
                    navigation.reset({
                        index: 0,
                        routes: [
                            { name: 'Home' },
                            { name: 'SellerDashboard' }
                        ],
                    });
                });
            } else {
                showAlert("Registration Failed", data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            showAlert("Error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.masterContainer}>
            <LinearGradient
                colors={['#F9F9FF', '#E8DFF5', '#CBF1F5']}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Join as Seller</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <StepIndicator step={step} />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.formCard}>
                                {step === 1 && (
                                    <View>
                                        <Text style={styles.sectionHeader}>Personal Info</Text>
                                        <Text style={styles.sectionSubHeader}>Identity details for owner/manager.</Text>

                                        <InputField
                                            label="Full Name"
                                            value={sellerName}
                                            onChangeText={setSellerName}
                                            placeholder="Your Name"
                                            icon="person-outline"
                                        />
                                        <InputField
                                            label="Work Email"
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="business@example.com"
                                            icon="mail-outline"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                        <InputField
                                            label="Mobile"
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
                                        <Text style={styles.sectionHeader}>Business Details</Text>
                                        <Text style={styles.sectionSubHeader}>Select your business type and verify documents.</Text>

                                        <AccountTypeSelector selected={accountType} onSelect={setAccountType} />

                                        <InputField
                                            label="Business Name"
                                            value={businessName}
                                            onChangeText={setBusinessName}
                                            placeholder="e.g. Acme Retail"
                                            icon="business-outline"
                                        />

                                        {accountType === 'licensed' ? (
                                            <View style={{ marginTop: 10 }}>
                                                <ProofTypeSelector
                                                    selected={proofType}
                                                    onSelect={(t) => { setProofType(t); setLicenseNumber(''); }}
                                                />

                                                <InputField
                                                    label={`${proofType} ID`}
                                                    value={licenseNumber}
                                                    onChangeText={(text) => setLicenseNumber(text.toUpperCase())}
                                                    placeholder={`Enter ${proofType}`}
                                                    icon="document-text-outline"
                                                    autoCapitalize="characters"
                                                />

                                                <View style={styles.infoBox}>
                                                    <LinearGradient
                                                        colors={['#EFF6FF', '#DBEAFE']}
                                                        style={styles.infoBoxGradient}
                                                    >
                                                        <MaterialCommunityIcons name="shield-check" size={20} color="#2563EB" />
                                                        <Text style={styles.infoText}>Document is verified instantly for licensed sellers.</Text>
                                                    </LinearGradient>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.warningBox}>
                                                <MaterialCommunityIcons name="alert-circle" size={24} color="#D97706" />
                                                <Text style={styles.warningText}>
                                                    Manual verification required for local shops. Reviews take 24-48 hours.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {step === 3 && (
                                    <View>
                                        <Text style={styles.sectionHeader}>Store Location</Text>
                                        <Text style={styles.sectionSubHeader}>Pickup and shipping origin address.</Text>

                                        <InputField
                                            label="Full Address"
                                            value={businessAddress}
                                            onChangeText={setBusinessAddress}
                                            placeholder="Street, City, Pincode"
                                            icon="location-outline"
                                            multiline={true}
                                        />

                                        <View style={styles.summaryCard}>
                                            <Text style={styles.summaryLabel}>Registration Summary</Text>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryKey}>Type</Text>
                                                <Text style={styles.summaryVal}>{accountType === 'licensed' ? 'Licensed' : 'Local Business'}</Text>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryKey}>Store</Text>
                                                <Text style={styles.summaryVal}>{businessName}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.footer}>
                                {step < 3 ? (
                                    <TouchableOpacity activeOpacity={0.9} onPress={handleNext}>
                                        <LinearGradient
                                            colors={['#FF512F', '#DD2476']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.actionButton}
                                        >
                                            <Text style={styles.actionButtonText}>Continue</Text>
                                            <Ionicons name="chevron-forward" size={18} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity activeOpacity={0.9} onPress={handleRegister} disabled={loading}>
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.actionButton}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <>
                                                    <Text style={styles.actionButtonText}>
                                                        {accountType === 'licensed' ? 'Start Business' : 'Submit Review'}
                                                    </Text>
                                                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    masterContainer: { flex: 1 },
    container: { flex: 1 },
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
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#111827',
    },
    stepContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingTop: 10,
        marginBottom: 20,
        position: 'relative',
    },
    stepWrapper: {
        alignItems: 'center',
        zIndex: 2,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 6,
    },
    activeStep: {
        backgroundColor: '#DD2476',
        borderColor: '#DD2476',
    },
    inactiveStep: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    stepText: { fontSize: 13, fontWeight: '700' },
    activeStepText: { color: '#fff' },
    inactiveStepText: { color: '#9CA3AF' },
    stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    activeStepLabel: { color: '#111827', fontWeight: '700' },
    line: {
        position: 'absolute',
        top: 26,
        left: 60,
        right: 60,
        height: 2,
        backgroundColor: '#E5E7EB',
        zIndex: 1,
    },
    lineActive: {
        position: 'absolute',
        top: 26,
        left: 60,
        height: 2,
        backgroundColor: '#DD2476',
        zIndex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    sectionSubHeader: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 24,
    },
    inputContainer: { marginBottom: 18 },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        height: 54,
    },
    multilineWrapper: {
        height: 100,
        paddingTop: 14,
        alignItems: 'flex-start',
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    multilineInput: { textAlignVertical: 'top' },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeOption: {
        flex: 1,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeOptionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeOptionActive: { borderColor: '#FECACA' },
    typeText: { fontSize: 13, fontWeight: '700', marginTop: 8, color: '#9CA3AF' },
    typeTextActive: { color: '#DC2626' },
    proofOptionsContainer: { marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
    proofBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    proofBadge: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    proofBadgeActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    proofText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    proofTextActive: { color: '#fff' },
    infoBox: { marginTop: 16 },
    infoBoxGradient: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    infoText: { color: '#1E40AF', fontSize: 12, fontWeight: '600', marginLeft: 10, flex: 1 },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        alignItems: 'flex-start',
        marginTop: 10,
    },
    warningText: { color: '#92400E', fontSize: 12, fontWeight: '600', marginLeft: 10, flex: 1, lineHeight: 18 },
    summaryCard: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
    },
    summaryLabel: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    summaryKey: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    summaryVal: { fontSize: 13, color: '#111827', fontWeight: '700' },
    footer: { marginTop: 10 },
    actionButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 4 },
});

export default SellerRegistrationScreen;

