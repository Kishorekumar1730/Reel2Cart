import { LanguageProvider } from "./context/LanguageContext";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import MainNavigator from "./navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <MainNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
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
