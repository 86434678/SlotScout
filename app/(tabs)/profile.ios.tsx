
import { apiGet } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';

interface UserPoints {
  totalPoints: number;
  loginStreak: number;
  machinesReported: number;
  casinosScouted: number;
  lastLoginDate: string;
}

interface UserAchievement {
  id: string;
  badgeName: string;
  dateUnlocked: string;
  points: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },
  achievementsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  achievementPoints: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  signOutButton: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  signOutButtonText: {
    color: '#fff',
  },
  signInPrompt: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  confirmModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButtonConfirm: {
    backgroundColor: colors.red,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextCancel: {
    color: colors.text,
  },
  confirmButtonTextConfirm: {
    color: '#fff',
  },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    console.log('[Profile] Loading user data');
    setLoading(true);

    try {
      const points = await apiGet<UserPoints>('/api/gamification/points');
      setUserPoints(points);
      console.log('[Profile] User points loaded:', points);

      const achievementsData = await apiGet<UserAchievement[]>('/api/gamification/achievements');
      setAchievements(achievementsData);
      console.log('[Profile] Achievements loaded:', achievementsData.length);
    } catch (error) {
      console.error('[Profile] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    console.log('[Profile] Opening auth screen');
    router.push('/auth');
  };

  const handleSignOut = async () => {
    console.log('[Profile] Signing out');
    setShowSignOutConfirm(false);
    try {
      await signOut();
      router.replace('/(tabs)/scan');
    } catch (error) {
      console.error('[Profile] Error signing out:', error);
    }
  };

  const handlePrivacyPolicy = () => {
    console.log('[Profile] Opening privacy policy');
    router.push('/privacy');
  };

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
        <View style={styles.container}>
          <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Sign in to track your progress</Text>
            </View>

            <View style={styles.signInPrompt}>
              <IconSymbol ios_icon_name="person.circle" android_material_icon_name="account-circle" size={64} color={colors.gold} />
              <Text style={styles.signInText}>
                Sign in to unlock points, streaks, leaderboards, and more!
              </Text>
              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePrivacyPolicy}>
              <Text style={styles.buttonText}>Privacy Policy</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your SlotScout journey</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={40} color={colors.gold} />
            </View>
            <Text style={styles.userName}>{user.name || 'Scout'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : userPoints ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Stats</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Points</Text>
                <Text style={styles.statValue}>{userPoints.totalPoints}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Login Streak</Text>
                <Text style={styles.statValue}>{userPoints.loginStreak} days</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Machines Reported</Text>
                <Text style={styles.statValue}>{userPoints.machinesReported}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Casinos Scouted</Text>
                <Text style={styles.statValue}>{userPoints.casinosScouted}</Text>
              </View>
            </View>
          ) : null}

          {achievements.length > 0 && (
            <View style={styles.achievementsCard}>
              <Text style={styles.statsTitle}>Recent Achievements</Text>
              {achievements.slice(0, 5).map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={20} color="#000" />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{achievement.badgeName}</Text>
                    <Text style={styles.achievementPoints}>{achievement.points} points</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handlePrivacyPolicy}>
            <Text style={styles.buttonText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={() => setShowSignOutConfirm(true)}>
            <Text style={[styles.buttonText, styles.signOutButtonText]}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showSignOutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSignOutConfirm(false)}
        >
          <View style={styles.confirmModal}>
            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>Sign Out?</Text>
              <Text style={styles.confirmText}>
                Are you sure you want to sign out? You'll need to sign in again to track your progress.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonCancel]}
                  onPress={() => setShowSignOutConfirm(false)}
                >
                  <Text style={[styles.confirmButtonText, styles.confirmButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonConfirm]}
                  onPress={handleSignOut}
                >
                  <Text style={[styles.confirmButtonText, styles.confirmButtonTextConfirm]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
