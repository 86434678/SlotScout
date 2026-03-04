
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";

type Status = "processing" | "success" | "error";

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<Status>("processing");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    if (Platform.OS !== "web") return;
    handleCallback();
  }, []);

  const handleCallback = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("better_auth_token");
      const error = urlParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authentication failed: ${error}`);
        window.opener?.postMessage({ type: "oauth-error", error }, "*");
        return;
      }

      if (token) {
        setStatus("success");
        setMessage("Authentication successful! Closing...");
        window.opener?.postMessage({ type: "oauth-success", token }, "*");
        setTimeout(() => window.close(), 1000);
      } else {
        setStatus("error");
        setMessage("No authentication token received");
        window.opener?.postMessage({ type: "oauth-error", error: "No token" }, "*");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Failed to process authentication");
      console.error("Auth callback error:", err);
    }
  };

  const statusIcon = status === "processing" ? null : status === "success" ? "✓" : "✗";
  const iconColor = status === "success" ? colors.success : colors.secondary;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Authentication",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerBackTitle: 'Back',
        }} 
      />
      <View style={styles.container}>
        {status === "processing" && <ActivityIndicator size="large" color={colors.primary} />}
        {statusIcon && <Text style={[styles.icon, { color: iconColor }]}>{statusIcon}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 64,
    fontWeight: "bold",
  },
  message: {
    fontSize: 18,
    marginTop: 24,
    textAlign: "center",
    color: colors.text,
  },
});
