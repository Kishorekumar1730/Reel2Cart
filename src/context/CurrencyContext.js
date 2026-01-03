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

    // Map Full Country Name to ISO Code for Currency Lookup
    const countryNameMap = {
        'India': 'IN',
        'United States': 'US',
        'United Kingdom': 'GB',
        'Canada': 'CA',
        'Australia': 'AU',
        'United Arab Emirates': 'AE',
        'Germany': 'DE',
        'France': 'FR',
        'Japan': 'JP',
        'China': 'CN',
        'Brazil': 'BR'
    };

    const changeRegion = async (newRegion) => {
        setRegion(newRegion);
        // If switching to Global, reset to USD unless overridden by address later
        // But for now, basic logic:
        updateCurrencyForRegion(newRegion.code);
        await AsyncStorage.setItem("userSelectedRegion", JSON.stringify(newRegion));
    };

    // New Function to override currency based on Address Country
    const setCurrencyByCountry = (countryName) => {
        // Only allow override if we are in 'Global' mode
        if (region.code === 'Global') {
            if (!countryName) {
                setCurrency('USD'); // Reset to default
                return;
            }
            const isoCode = countryNameMap[countryName] || null;
            if (isoCode) {
                const curr = countryToCurrency[isoCode];
                if (curr) setCurrency(curr);
            }
        }
    };

    const formatPrice = (price, overrideCurrency) => {
        if (price === undefined || price === null) return '';

        // If overrideCurrency is provided, we assume the price is ALREADY in that currency.
        // We just formatting it with the symbol.
        if (overrideCurrency) {
            const sym = getSymbolFromCurrency(overrideCurrency) || overrideCurrency;
            return `${sym}${parseFloat(price).toFixed(2)}`;
        }

        // Default Logic: Convert FROM INR (Base) TO Current Context Currency
        let finalPrice = price;
        let symbol = '₹';

        if (currency !== 'INR' && rates[currency]) {
            finalPrice = price * rates[currency];
            symbol = getSymbolFromCurrency(currency) || currency;
        } else if (currency === 'INR') {
            symbol = '₹';
        } else {
            symbol = getSymbolFromCurrency(currency) || currency;
        }

        return `${symbol}${finalPrice.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ region, changeRegion, currency, formatPrice, loading, setCurrencyByCountry }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
