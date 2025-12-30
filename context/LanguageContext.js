import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('English');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const storedLang = await AsyncStorage.getItem('userLanguage');
            if (storedLang) {
                setLanguageState(storedLang);
            }
        } catch (e) {
            console.log("Failed to load language", e);
        } finally {
            setIsLoading(false);
        }
    };

    const setLanguage = async (lang) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem('userLanguage', lang);
        } catch (e) {
            console.log("Failed to save language", e);
        }
    };

    // Translation helper
    const t = (key) => {
        const langData = translations[language] || translations['English'];
        return langData[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
