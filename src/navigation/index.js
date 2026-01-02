import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { wp, isTablet } from "../utils/responsive";
import {
  SplashScreen,
  LanguageScreen,
  OpenScreen,
  LoginScreen,
  RegisterScreen,
  VerifyScreenSignup,
  VerifyScreenSignin,
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
  AdminDashboardScreen,
  HelpScreen,
  SellerProfileScreen,
  FollowListScreen,
  ProductDetailsScreen,
  LoginSecurityScreen,
  NotificationSettingsScreen,
  NotificationListScreen,
  DeliveryDashboardScreen,
  SellerNotificationScreen,
} from "../screens";

import ChatScreen from "../screens/ChatScreen";
import ChatListScreen from "../screens/ChatListScreen";
import AIChatScreen from "../screens/AIChatScreen";

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
        tabBarInactiveTintColor: "#AAA",
        tabBarStyle: {
          position: 'absolute',
          bottom: isTablet() ? 30 : 25,
          left: isTablet() ? wp(25) : 20,
          right: isTablet() ? wp(25) : 20,
          backgroundColor: '#ffffff',
          borderRadius: 35,
          height: isTablet() ? 80 : 75,
          paddingBottom: isTablet() ? 15 : 12,
          paddingTop: 12,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 5,
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
                top: -30,
                width: 65,
                height: 65,
                borderRadius: 32.5,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 10,
                shadowColor: '#E50914',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              }}>
                <Image
                  source={require('../../assets/app-logo.png')}
                  style={{ width: 55, height: 55, resizeMode: 'contain' }}
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
          if (route.name === 'HomeTab') label = t('homeTab') || 'Home';
          else if (route.name === 'Cart') label = t('cartTab') || 'Cart';
          else if (route.name === 'Favourite') label = t('favouriteTab') || 'Wishlist';
          else if (route.name === 'Profile') label = t('profileTab') || 'Profile';

          return <Text style={{ color, fontSize: 10, fontWeight: focused ? '600' : '400', marginBottom: 5 }}>{label}</Text>;
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="Reels" component={ReelsScreen} options={{ tabBarStyle: { display: 'none' } }} />
      <Tab.Screen name="Favourite" component={FavouriteScreen} options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const RootStack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Splash">
        <RootStack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="ReelsScreen" component={ReelsScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Open" component={OpenScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="VerifySignup" component={VerifyScreenSignup} options={{ headerShown: false }} />
        <RootStack.Screen name="VerifyScreenSignin" component={VerifyScreenSignin} options={{ headerShown: false }} />
        <RootStack.Screen
          name="LoginSignup"
          component={LoginScreen}
          options={{
            headerTitle: 'Login or Sign Up',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#f4511e' },
            headerTintColor: '#fff',
          }}
        />
        <RootStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Home" component={BottomTabNavigator} options={{ headerShown: false }} />
        <RootStack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />

        {/* Seller Screens */}
        <RootStack.Screen name="SellerOnboarding" component={SellerOnboardingScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerRegistration" component={SellerRegistrationScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="EditSellerProfile" component={EditSellerProfileScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerSupport" component={SellerSupportScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerPromote" component={SellerPromoteScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />

        <RootStack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />

        <RootStack.Screen name="LoginSecurity" component={LoginSecurityScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="NotificationList" component={NotificationListScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="SellerNotification" component={SellerNotificationScreen} options={{ headerShown: false }} />

        <RootStack.Screen name="DeliveryDashboard" component={DeliveryDashboardScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});

