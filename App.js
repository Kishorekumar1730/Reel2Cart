// Refresh
import { LanguageProvider } from "./src/context/LanguageContext.js";
import { CurrencyProvider } from "./src/context/CurrencyContext.js";
import { AlertProvider } from "./src/context/AlertContext.js";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import MainNavigator from "./src/navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NotificationProvider } from "./src/context/NotificationContext";
import UpdateManager from "./src/components/UpdateManager";

export default function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AlertProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <MainNavigator />
              <UpdateManager />
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
