
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, signInWithGitHub, user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AUTO-REDIRECT WHEN SIGNED IN
  useEffect(() => {
    if (user) {
      console.log("[AuthScreen] User logged in — redirecting to Community");
      router.replace("/(tabs)/(community)");
    }
  }, [user, router]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter email and password");
      return;
    }
    setLoadingEmail(true);
    setErrorMessage(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (error: any) {
      console.error("[Auth] Email error:", error);
      setErrorMessage(error.message || "Sign in failed — check your details");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleApple = async () => {
    setLoadingApple(true);
    setErrorMessage(null);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error("[Auth] Apple error:", error);
      setErrorMessage(error.message || "Apple sign in failed — try again");
    } finally {
      setLoadingApple(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setErrorMessage(error.message || "Google sign in failed");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sign In", headerShown: true }} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome to SlotScout</Text>

            {mode === "signup" && (
              <TextInput style={styles.input} placeholder="Name (optional)" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
            )}

            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={[styles.primaryButton, loadingEmail && styles.buttonDisabled]} onPress={handleEmailAuth} disabled={loadingEmail}>
              {loadingEmail ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>{mode === "signin" ? "Sign In" : "Sign Up"}</Text>}
            </TouchableOpacity>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.switchModeButton} onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
              <Text style={styles.switchModeText}>{mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialButton} onPress={handleGoogle}>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={handleApple} disabled={loadingApple}>
                {loadingApple ? <ActivityIndicator color="#fff" /> : <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.primary },
  subtitle: { fontSize: 16, marginBottom: 32, textAlign: "center", color: colors.textSecondary },
  input: { height: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, backgroundColor: colors.card, color: colors.text },
  primaryButton: { height: 56, backgroundColor: colors.primary, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#000", fontSize: 18, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.6 },
  errorText: { color: "red", textAlign: "center", marginTop: 12, fontSize: 15 },
  switchModeButton: { marginTop: 20, alignItems: "center" },
  switchModeText: { color: colors.primary, fontSize: 15, fontWeight: "500" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 16, color: colors.textSecondary, fontSize: 14 },
  socialButton: { height: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12, backgroundColor: colors.card },
  socialButtonText: { fontSize: 16, color: colors.text, fontWeight: "600" },
  appleButton: { backgroundColor: "#000", borderColor: "#fff" },
  appleButtonText: { color: "#fff" },
});
