
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TripPassProvider } from "@/contexts/TripPassContext";
import { colors } from "@/styles/commonStyles";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const DISCLAIMER_KEY = 'slotscout_disclaimer_accepted';

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    'SpaceMono-Bold': require("../assets/fonts/SpaceMono-Bold.ttf"),
    ...Ionicons.font,
    ...MaterialIcons.font,
  });
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      checkDisclaimer();
    }
  }, [loaded]);

  const checkDisclaimer = async () => {
    console.log('[App] Checking disclaimer acceptance status');
    try {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      console.log('[App] Disclaimer status from AsyncStorage:', accepted);
      if (!accepted) {
        console.log('[App] Disclaimer not accepted, showing modal');
        setShowDisclaimer(true);
      } else {
        console.log('[App] Disclaimer already accepted');
      }
    } catch (error) {
      console.error('[App] Error checking disclaimer from AsyncStorage:', error);
      setShowDisclaimer(true);
    }
  };

  const handleAcceptDisclaimer = async () => {
    console.log('[App] User accepted disclaimer, saving to AsyncStorage');
    try {
      await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
      console.log('[App] Disclaimer acceptance saved successfully');
      setShowDisclaimer(false);
    } catch (error) {
      console.error('[App] Error saving disclaimer to AsyncStorage:', error);
      // Still close the modal even if save fails
      setShowDisclaimer(false);
    }
  };

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      setShowOfflineModal(true);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: colors.primary, // Gold
      background: colors.background, // Casino black
      card: colors.card, // Dark card
      text: colors.text, // White text
      border: colors.border, // Dark border
      notification: colors.secondary, // Crimson red
    },
  };

  return (
    <>
      <StatusBar style="light" animated />
      <ThemeProvider value={CustomDarkTheme}>
        <AuthProvider>
          <TripPassProvider>
            <WidgetProvider>
              <GestureHandlerRootView>
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.primary,
                    headerBackTitle: 'Back',
                    headerBackTitleVisible: true,
                    headerTitleStyle: { fontFamily: 'SpaceMono-Bold', color: colors.primary },
                    gestureEnabled: true,
                    animation: 'slide_from_right',
                  }}
                >
                  {/* Main app with tabs */}
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  {/* Auth screens - with back navigation */}
                  <Stack.Screen 
                    name="auth" 
                    options={{ 
                      headerShown: false,
                      presentation: 'card',
                    }} 
                  />
                  <Stack.Screen 
                    name="auth-popup" 
                    options={{ 
                      headerShown: false,
                      presentation: 'card',
                    }} 
                  />
                  <Stack.Screen 
                    name="auth-callback" 
                    options={{ 
                      headerShown: false,
                      presentation: 'card',
                    }} 
                  />
                  {/* Camera screen - NO TABS */}
                  <Stack.Screen 
                    name="camera" 
                    options={{ 
                      headerShown: true, 
                      title: "Snap a Slot",
                    }} 
                  />
                  {/* Results screen */}
                  <Stack.Screen 
                    name="results" 
                    options={{ 
                      headerShown: true, 
                      title: "Slot Identified",
                    }} 
                  />
                  {/* Privacy policy */}
                  <Stack.Screen 
                    name="privacy" 
                    options={{ 
                      headerShown: true, 
                      title: "Privacy Policy",
                    }} 
                  />
                  {/* Admin screen */}
                  <Stack.Screen 
                    name="admin" 
                    options={{ 
                      headerShown: true, 
                      title: "NGCB Stats Admin",
                    }} 
                  />
                  {/* Monthly report screen */}
                  <Stack.Screen 
                    name="monthly-report" 
                    options={{ 
                      headerShown: true, 
                      title: "NGCB Monthly Report",
                    }} 
                  />
                  {/* Casino detail screen */}
                  <Stack.Screen 
                    name="casino-detail" 
                    options={{ 
                      headerShown: true, 
                      title: "Casino Details",
                    }} 
                  />
                  {/* Casino machines screen */}
                  <Stack.Screen 
                    name="casino-machines" 
                    options={{ 
                      headerShown: true, 
                      title: "Casino Machines",
                    }} 
                  />
                  {/* Edit photo screen */}
                  <Stack.Screen 
                    name="edit-photo" 
                    options={{ 
                      headerShown: true, 
                      title: "Edit Photo",
                    }} 
                  />
                  {/* Trip Pass screen */}
                  <Stack.Screen 
                    name="trip-pass" 
                    options={{ 
                      headerShown: true, 
                      title: "Trip Pass",
                    }} 
                  />
                  {/* Casino Intel screen */}
                  <Stack.Screen 
                    name="casino-intel" 
                    options={{ 
                      headerShown: true, 
                      title: "Casino Intel",
                    }} 
                  />
                  {/* Icon Generator screen */}
                  <Stack.Screen 
                    name="generate-icon" 
                    options={{ 
                      headerShown: true, 
                      title: "Generate Icon",
                    }} 
                  />
                </Stack>
                <SystemBars style={"light"} />
              </GestureHandlerRootView>

              {/* Disclaimer Modal */}
              <Modal visible={showDisclaimer} transparent animationType="fade">
                <View style={layoutStyles.disclaimerOverlay}>
                  <View style={layoutStyles.disclaimerCard}>
                    <Text style={layoutStyles.disclaimerTitle}>⚠️ Important Notice</Text>
                    <ScrollView style={layoutStyles.disclaimerScroll}>
                      <Text style={layoutStyles.disclaimerText}>
                        This app is for entertainment and research only.
                      </Text>
                      <Text style={layoutStyles.disclaimerText}>
                        Always follow each casino's phone and photography rules.
                      </Text>
                      <Text style={layoutStyles.disclaimerText}>
                        SlotScout is not affiliated with any casino and does not guarantee results.
                      </Text>
                      <Text style={layoutStyles.disclaimerText}>
                        Play responsibly.
                      </Text>
                    </ScrollView>
                    <TouchableOpacity 
                      style={layoutStyles.disclaimerButton} 
                      onPress={handleAcceptDisclaimer}
                    >
                      <Text style={layoutStyles.disclaimerButtonText}>I Understand</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Offline Modal */}
              <Modal visible={showOfflineModal} transparent animationType="fade">
                <View style={layoutStyles.modalOverlay}>
                  <View style={layoutStyles.modalCard}>
                    <Text style={layoutStyles.modalTitle}>🔌 You are offline</Text>
                    <Text style={layoutStyles.modalMessage}>
                      You can keep using the app! Your changes will be saved locally and synced when you are back online.
                    </Text>
                    <TouchableOpacity style={layoutStyles.modalButton} onPress={() => setShowOfflineModal(false)}>
                      <Text style={layoutStyles.modalButtonText}>Got it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </WidgetProvider>
          </TripPassProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

const layoutStyles = StyleSheet.create({
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  disclaimerCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  disclaimerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 20,
    textAlign: 'center',
  },
  disclaimerScroll: {
    maxHeight: 300,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  disclaimerButton: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  disclaimerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
});
