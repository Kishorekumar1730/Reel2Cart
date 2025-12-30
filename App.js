import { LanguageProvider } from "./context/LanguageContext";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import MainNavigator from "./navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NotificationProvider } from "./context/NotificationContext";

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <MainNavigator />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </NotificationProvider>
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
