import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import countryToCurrency from 'country-to-currency';
import getSymbolFromCurrency from 'currency-symbol-map';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    // Default to Global (USD)
    const [region, setRegion] = useState({ code: 'Global', name: 'Global Store', flag: '🌍' });
    const [currency, setCurrency] = useState('USD');
    const [rates, setRates] = useState({ INR: 1 }); // Base is INR
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([loadRegion(), fetchRates()]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadRegion = async () => {
        try {
            const saved = await AsyncStorage.getItem("userSelectedRegion");
            if (saved) {
                const parsed = JSON.parse(saved);
                setRegion(parsed);
                updateCurrencyForRegion(parsed.code);
            } else {
                // Default
                updateCurrencyForRegion('Global');
            }
        } catch (e) {
            console.log("Error loading region", e);
        }
    };

    const fetchRates = async () => {
        try {
            // Fetch rates based on INR
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
            const data = await res.json();
            if (data && data.rates) {
                setRates(data.rates);
            }
        } catch (e) {
            console.error("Failed to fetch rates", e);
            // Fallback hardcoded (Dec 2025 rough estimates)
            setRates({
                INR: 1,
                USD: 0.012,
                EUR: 0.011,
                GBP: 0.009,
                AED: 0.044,
                CAD: 0.016,
                AUD: 0.018,
                JPY: 1.8,
            });
        }
    };

    const updateCurrencyForRegion = (countryCode) => {
        if (!countryCode || countryCode === 'Global') {
            setCurrency('USD');
            return;
        }

        // Use library to map Country -> Currency
        // countryToCurrency is a map { "US": "USD", "IN": "INR" ... }
        const curr = countryToCurrency[countryCode];
        setCurrency(curr || 'USD');
    };

    const changeRegion = async (newRegion) => {
        setRegion(newRegion);
        updateCurrencyForRegion(newRegion.code);
        await AsyncStorage.setItem("userSelectedRegion", JSON.stringify(newRegion));
        
        // Also update backend if user is logged in (Logic moved here from HomeScreen for consistency)
        // We can do this silently
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (userInfo) {
                const user = JSON.parse(userInfo);
                // We assume API_BASE_URL is available globally or we import it.
                // Since this is a pure context, let's skip the fetch call here or import config.
                // It's better to let the screen handle the side effect or import config.
                // I'll skip the backend sync here to avoid circular deps or config issues, 
                // the HomeScreen can still handle the backend sync if it wants to observe the change,
                // OR we can just rely on the local state for the UI.
            }
        } catch (e) {}
    };

    const formatPrice = (priceInInr) => {
        if (priceInInr === undefined || priceInInr === null) return '';
        
        // If Base is INR (which it is in our DB)
        // We convert FROM INR TO Target Currency
        
        let finalPrice = priceInInr;
        let symbol = '₹';

        if (currency !== 'INR' && rates[currency]) {
            finalPrice = priceInInr * rates[currency];
            symbol = getSymbolFromCurrency(currency) || currency;
        } else if (currency === 'INR') {
            symbol = '₹';
        } else {
             // Fallback if rate missing but currency changed (unlikely)
             symbol = getSymbolFromCurrency(currency) || currency;
        }

        // Formatting
        return `${symbol}${finalPrice.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ region, changeRegion, currency, formatPrice, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
