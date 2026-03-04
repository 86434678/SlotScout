import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    const subscription = Linking.addEventListener("url", () => {
      setTimeout(fetchUser, 800); // give callback time to settle
    });

    const interval = setInterval(fetchUser, 4 * 60 * 1000); // keep token fresh

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const session = await authClient.getSession();
      
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] fetchUser error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocial = async (provider: "apple" | "google" | "github") => {
    try {
      console.log(`[Auth] Starting ${provider} sign-in on ${Platform.OS}`);
      const callbackURL = Linking.createURL("/");

      await authClient.signIn.social({
        provider,
        callbackURL,
      });

      // Give the deep link / Apple sheet time to finish
      await new Promise(resolve => setTimeout(resolve, 1200));
      await fetchUser();
    } catch (error: any) {
      console.error(`[Auth] ${provider} failed:`, error);
      throw error;
    }
  };

  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithGitHub = () => signInWithSocial("github");

  const signInWithEmail = async (email: string, password: string) => {
    await authClient.signIn.email({ email, password });
    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    await authClient.signUp.email({ email, password, name });
    await fetchUser();
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (e) {}
    setUser(null);
    await clearAuthTokens();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
