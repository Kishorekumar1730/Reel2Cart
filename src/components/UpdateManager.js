import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/apiConfig';

const { width } = Dimensions.get('window');

// Simple SemVer compare
// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
const compareVersions = (v1, v2) => {
    if (!v1 || !v2) return 0;
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
    }
    return 0;
};

const UpdateManager = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    useEffect(() => {
        checkForUpdate();
    }, []);

    const checkForUpdate = async () => {
        try {
            const platform = Platform.OS;
            const res = await fetch(`${API_BASE_URL}/app-version?platform=${platform}`);
            const data = await res.json();

            if (data && data.version) {
                // Determine current version
                // Constants.expoConfig?.version is from app.json
                // For native builds, this is baked in.
                const currentVersion = Constants.expoConfig?.version || Constants.manifest?.version || "1.0.0";
                const serverVersion = data.version;

                console.log(`[UpdateManager] Current: ${currentVersion}, Server: ${serverVersion}`);

                // Check comparison
                if (compareVersions(serverVersion, currentVersion) > 0) {
                    setUpdateInfo(data);
                    setIsVisible(true);
                } else {
                    console.log("[UpdateManager] App is up to date.");
                }
            }
        } catch (error) {
            console.log("Update check failed", error);
        }
    };

    const handleUpdate = () => {
        if (updateInfo?.updateUrl) {
            Linking.openURL(updateInfo.updateUrl);
        }
    };

    const handleLater = () => {
        if (!updateInfo?.forceUpdate) {
            setIsVisible(false);
        }
    };

    if (!updateInfo) return null;

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleLater} // Handle back button on Android
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="rocket" size={40} color="#E50914" />
                    </View>

                    <Text style={styles.title}>Update Available! 🚀</Text>
                    <Text style={styles.versionText}>v{updateInfo.version} is now available</Text>

                    <Text style={styles.desc}>
                        {updateInfo.description || "A new version of Reel2Cart is available. Update now to get the latest features and bug fixes."}
                    </Text>

                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
                        <Text style={styles.updateBtnText}>Update Now</Text>
                    </TouchableOpacity>

                    {!updateInfo.forceUpdate && (
                        <TouchableOpacity style={styles.laterBtn} onPress={handleLater}>
                            <Text style={styles.laterBtnText}>Maybe Later</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FFF0F1',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8
    },
    versionText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        backgroundColor: '#F3F4F6',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        overflow: 'hidden'
    },
    desc: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22
    },
    updateBtn: {
        width: '100%',
        backgroundColor: '#E50914',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12
    },
    updateBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    laterBtn: {
        paddingVertical: 10,
    },
    laterBtnText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600'
    }
});

export default UpdateManager;
