import { LanguageProvider } from "./src/context/LanguageContext";
import { CurrencyProvider } from "./src/context/CurrencyContext";
import { AlertProvider } from "./src/context/AlertContext";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import MainNavigator from "./src/navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NotificationProvider } from "./src/context/NotificationContext";

export default function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AlertProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <MainNavigator />
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </NotificationProvider>
        </AlertProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: 'center',
  },
});
