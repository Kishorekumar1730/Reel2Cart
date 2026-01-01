import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';
import OrderSuccessModal from '../components/OrderSuccessModal';

const AlertContext = createContext({});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });

    const [successState, setSuccessState] = useState({
        visible: false,
        message: '',
        onClose: null
    });

    const showAlert = useCallback((title, message, buttons = []) => {
        // Wrap button onPress handlers to close alert automatically if not handled
        const wrappedButtons = buttons.map(btn => ({
            ...btn,
            originalOnPress: btn.onPress,
            onPress: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                if (btn.onPress) btn.onPress();
            }
        }));

        setAlertState({
            visible: true,
            title,
            message,
            buttons: wrappedButtons.length > 0 ? wrappedButtons : []
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, visible: false }));
    }, []);

    const showSuccess = useCallback((message, onClose) => {
        setSuccessState({
            visible: true,
            message,
            onClose
        });
    }, []);

    const hideSuccess = useCallback(() => {
        const callback = successState.onClose;
        setSuccessState({ visible: false, message: '', onClose: null });
        if (callback) callback();
    }, [successState.onClose]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, showSuccess, hideSuccess }}>
            {children}
            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                buttons={alertState.buttons}
                onClose={hideAlert}
            />
            <OrderSuccessModal
                visible={successState.visible}
                message={successState.message}
                onClose={hideSuccess}
            />
        </AlertContext.Provider>
    );
};
