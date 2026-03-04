
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { apiGet } from "@/utils/api";

interface UserPoints {
  totalPoints: number;
  loginStreak: number;
  machinesReported: number;
  casinosScouted: number;
  lastLoginDate: string;
}

interface JackpotAlert {
  id: string;
  jackpotName: string;
  currentAmount: string;
  location: string;
  lastUpdated: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  goldText: {
    color: colors.gold,
  },
  pointsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scanButtonGradient: {
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 12,
  },
  motivationalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  jackpotCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jackpotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jackpotName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  jackpotAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },
  jackpotLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  signInPrompt: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [jackpotAlerts, setJackpotAlerts] = useState<JackpotAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    console.log('[Scan] Loading data');
    setLoading(true);
    
    try {
      // Load user points if signed in
      if (user) {
        try {
          const points = await apiGet<UserPoints>('/api/gamification/points');
          setUserPoints(points);
          console.log('[Scan] User points loaded:', points);
        } catch (error) {
          console.error('[Scan] Error loading points:', error);
        }
      }

      // Load jackpot alerts with safe fallback
      try {
        const jackpots = await apiGet<JackpotAlert[]>('/api/jackpot-feed');
        // SAFE FALLBACK: Ensure jackpots is always an array
        const safeJackpots = Array.isArray(jackpots) ? jackpots : [];
        const topJackpots = safeJackpots.slice(0, 3);
        setJackpotAlerts(topJackpots);
        console.log('[Scan] Jackpot alerts loaded:', topJackpots.length);
      } catch (error) {
        console.error('[Scan] Error loading jackpots:', error);
        // SAFE FALLBACK: Set empty array on error
        setJackpotAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    console.log('[Scan] Opening camera');
    router.push('/camera');
  };

  const handleSignIn = () => {
    console.log('[Scan] Opening auth screen');
    router.push('/auth');
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    
    if (num >= 1000000) {
      const millions = num / 1000000;
      return `$${millions.toFixed(1)}M`;
    }
    if (num >= 1000) {
      const thousands = num / 1000;
      return `$${thousands.toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'SlotScout',
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.titleText}>
              Slot<Text style={styles.goldText}>Scout</Text>
            </Text>
          </View>

          {/* User Points Card */}
          {user && userPoints && (
            <View style={styles.pointsCard}>
              <View style={styles.pointsHeader}>
                <Text style={styles.pointsTitle}>Your Progress</Text>
                <Text style={styles.pointsValue}>{userPoints.totalPoints} pts</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userPoints.loginStreak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userPoints.machinesReported}</Text>
                  <Text style={styles.statLabel}>Machines</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userPoints.casinosScouted}</Text>
                  <Text style={styles.statLabel}>Casinos</Text>
                </View>
              </View>
            </View>
          )}

          {/* Sign In Prompt */}
          {!user && (
            <View style={styles.signInPrompt}>
              <Text style={styles.signInText}>
                Sign in to track your progress, earn points, and compete on leaderboards!
              </Text>
              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scan Button */}
          <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.gold, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanButtonGradient}
            >
              <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={32} color="#000" />
              <Text style={styles.scanButtonText}>Snap a Slot</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Motivational Text */}
          <Text style={styles.motivationalText}>
            Scan to earn points & climb leaderboards
          </Text>

          {/* Jackpot Alerts */}
          <Text style={styles.sectionTitle}>🔥 Hot Jackpots</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : jackpotAlerts.length > 0 ? (
            jackpotAlerts.map((jackpot) => (
              <View key={jackpot.id} style={styles.jackpotCard}>
                <View style={styles.jackpotHeader}>
                  <Text style={styles.jackpotName}>{jackpot.jackpotName}</Text>
                  <Text style={styles.jackpotAmount}>{formatAmount(jackpot.currentAmount)}</Text>
                </View>
                <Text style={styles.jackpotLocation}>{jackpot.location}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No jackpot alerts available</Text>
          )}
        </ScrollView>
      </View>
    </>
  );
}
