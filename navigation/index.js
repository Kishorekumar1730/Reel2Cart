import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import {
  SplashScreen,
  LanguageScreen,
  OpenScreen,
  LoginScreen,
  RegisterScreen,
  VerifyScreenSignup,
  WelcomeScreen,
  HomeScreen,
  AddressScreen,
  CartScreen,
  ReelsScreen,
  FavouriteScreen,
  ProfileScreen,
  EditProfileScreen,
  PaymentScreen,
  PaymentMethodScreen,
  OrdersScreen,
  OrderDetailScreen,
  SellerOnboardingScreen,
  SellerRegistrationScreen,
  SellerDashboardScreen,
  AddProductScreen,
  EditSellerProfileScreen,
  SellerOrdersScreen,
  SellerAnalyticsScreen,
  SellerSupportScreen,
  SellerPromoteScreen,
  AdminDashboardScreen, // Add this
  HelpScreen,
  SellerProfileScreen,
  FollowListScreen,
  ProductDetailsScreen,
  LoginSecurityScreen,
  NotificationSettingsScreen,
  NotificationListScreen,
} from "../screens";

import { useLanguage } from "../context/LanguageContext";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#E50914",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Cart") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Reels") {
            // Special case for Reels - Center Icon
            return (
              <View style={{
                top: -20, // Float up
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}>
                <Image
                  source={require('../assets/app-logo.png')}
                  style={{ width: 40, height: 40, resizeMode: 'contain' }}
                />
              </View>
            );
          } else if (route.name === "Favourite") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          // Hide label for Reels
          if (route.name === 'Reels') return null;

          let label = route.name;
          if (route.name === 'HomeTab') label = t('homeTab');
          else if (route.name === 'Cart') label = t('cartTab');
          else if (route.name === 'Favourite') label = t('favouriteTab');
          else if (route.name === 'Profile') label = t('profileTab');

          return <Text style={{ color, fontSize: 10, paddingBottom: 5 }}>{label}</Text>;
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('homeTab') }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: t('cartTab') }} />
      <Tab.Screen name="Reels" component={ReelsScreen} options={{ title: t('reelsTab') }} />
      <Tab.Screen name="Favourite" component={FavouriteScreen} options={{ title: t('favouriteTab') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profileTab') }} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const RootStack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Splash">
        <RootStack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }} // Hide header for splash screen
        />
        <RootStack.Screen
          name="Language"
          component={LanguageScreen}
          options={{ headerShown: false }} // Hide header for language selection screen
        />
        <RootStack.Screen
          name="Open"
          component={OpenScreen}
          options={{ headerShown: false }} // Hide header for open screen
        />
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }} // Hide header for login screen
        />
        <RootStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }} // Hide header for register screen
        />
        <RootStack.Screen
          name="VerifySignup"
          component={VerifyScreenSignup}
          options={{ headerShown: false }} // Hide header for verify signup screen
        />
        <RootStack.Screen
          name="LoginSignup"
          component={LoginScreen}
          options={{
            headerTitle: 'Login or Sign Up',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#f4511e' },
            headerTintColor: '#fff',
            headerLeft: () => (
              <Ionicons name="arrow-back" size={24} color="white" style={{ marginLeft: 10 }} />
            ),
          }}
        />
        <RootStack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }} // Hide header for welcome screen
        />
        <RootStack.Screen
          name="Home"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Address"
          component={AddressScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="PaymentMethod"
          component={PaymentMethodScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerOnboarding"
          component={SellerOnboardingScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerRegistration"
          component={SellerRegistrationScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerDashboard"
          component={SellerDashboardScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="EditSellerProfile"
          component={EditSellerProfileScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerOrders"
          component={SellerOrdersScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerAnalytics"
          component={SellerAnalyticsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerSupport"
          component={SellerSupportScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerPromote"
          component={SellerPromoteScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Help"
          component={HelpScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SellerProfile"
          component={SellerProfileScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="FollowList"
          component={FollowListScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="LoginSecurity"
          component={LoginSecurityScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="NotificationList"
          component={NotificationListScreen}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
