
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useNetworkState } from "expo-network";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TripPassProvider } from "@/contexts/TripPassContext";
import { colors } from "@/styles/commonStyles";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const DISCLAIMER_KEY = 'slotscout_disclaimer_accepted';

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      checkDisclaimer();
    }
  }, [loaded]);

  const checkDisclaimer = async () => {
    try {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (!accepted) setShowDisclaimer(true);
    } catch (error) {
      setShowDisclaimer(true);
    }
  };

  const handleAcceptDisclaimer = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    } catch (error) {}
    setShowDisclaimer(false);
  };

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <TripPassProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                  <Stack
                    screenOptions={{
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.primary,
                      headerBackTitle: 'Back',
                      headerTitleStyle: { fontFamily: 'SpaceMono-Bold' },
                      contentStyle: { backgroundColor: colors.background },
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="camera" options={{ title: "Snap a Slot" }} />
                    <Stack.Screen name="results" options={{ title: "Slot Identified" }} />
                    <Stack.Screen name="edit-photo" options={{ title: "Edit Photo" }} />
                    {/* Add any other screens you use */}
                  </Stack>
                </SafeAreaView>

                {/* Disclaimer Modal - now properly using modern AsyncStorage */}
                <Modal visible={showDisclaimer} transparent animationType="fade">
                  <View style={styles.disclaimerOverlay}>
                    <View style={styles.disclaimerCard}>
                      <Text style={styles.disclaimerTitle}>⚠️ Important Notice</Text>
                      <ScrollView style={styles.disclaimerScroll}>
                        <Text style={styles.disclaimerText}>
                          This app is for entertainment and research only. Always follow casino rules.
                        </Text>
                      </ScrollView>
                      <TouchableOpacity style={styles.disclaimerButton} onPress={handleAcceptDisclaimer}>
                        <Text style={styles.disclaimerButtonText}>I Understand</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </GestureHandlerRootView>
            </WidgetProvider>
          </TripPassProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

const styles = StyleSheet.create({
  disclaimerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  disclaimerCard: { backgroundColor: colors.card, borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, borderWidth: 2, borderColor: colors.gold },
  disclaimerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.gold, marginBottom: 20, textAlign: 'center' },
  disclaimerScroll: { maxHeight: 300, marginBottom: 24 },
  disclaimerText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  disclaimerButton: { backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 12, width: '100%' },
  disclaimerButtonText: { fontSize: 18, fontWeight: 'bold', color: '#000', textAlign: 'center' },
});
