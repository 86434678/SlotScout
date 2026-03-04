
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  photoUrl: string | null;
  highestWin: number | null;
  machinesReported: number | null;
  casinosScouted: number | null;
  month: string;
  rank?: number;
}

interface UserPoints {
  totalPoints: number;
  loginStreak: number;
  machinesReported: number;
  casinosScouted: number;
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#000',
  },
  userStatsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  leaderboardCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topThreeCard: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topThreeBadge: {
    backgroundColor: colors.gold,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  topThreeRankText: {
    color: '#000',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  signInPrompt: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});

type LeaderboardType = 'wins' | 'machines' | 'casinos';

export default function LeaderboardsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('wins');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    console.log('[Leaderboards] Loading data for tab:', activeTab);
    setLoading(true);

    try {
      // Load leaderboard with safe fallback
      try {
        const data = await apiGet<LeaderboardEntry[]>('/api/gamification/leaderboard');
        // SAFE FALLBACK: Ensure data is always an array
        const safeData = Array.isArray(data) ? data : [];
        
        // Sort based on active tab
        let sorted = [...safeData];
        if (activeTab === 'wins') {
          sorted.sort((a, b) => (b.highestWin || 0) - (a.highestWin || 0));
        } else if (activeTab === 'machines') {
          sorted.sort((a, b) => (b.machinesReported || 0) - (a.machinesReported || 0));
        } else {
          sorted.sort((a, b) => (b.casinosScouted || 0) - (a.casinosScouted || 0));
        }

        // Add rank
        const withRank = sorted.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        setLeaderboard(withRank);
        console.log('[Leaderboards] Loaded entries:', withRank.length);
      } catch (error) {
        console.error('[Leaderboards] Error loading leaderboard:', error);
        // SAFE FALLBACK: Set empty array on error
        setLeaderboard([]);
      }

      // Load user points if signed in
      if (user) {
        try {
          const points = await apiGet<UserPoints>('/api/gamification/points');
          setUserPoints(points);
          console.log('[Leaderboards] User points loaded:', points);
        } catch (error) {
          console.error('[Leaderboards] Error loading user points:', error);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log('[Leaderboards] Refreshing');
    setRefreshing(true);
    loadData();
  };

  const getScoreValue = (entry: LeaderboardEntry): string => {
    if (activeTab === 'wins') {
      const amount = entry.highestWin || 0;
      if (amount >= 1000) {
        const thousands = amount / 1000;
        return `$${thousands.toFixed(1)}K`;
      }
      return `$${amount}`;
    }
    if (activeTab === 'machines') {
      return `${entry.machinesReported || 0}`;
    }
    return `${entry.casinosScouted || 0}`;
  };

  const getScoreLabel = (): string => {
    if (activeTab === 'wins') return 'Highest Win';
    if (activeTab === 'machines') return 'Machines Reported';
    return 'Casinos Scouted';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Leaderboards',
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Leaderboards</Text>
            <Text style={styles.subtitle}>Compete with the best scouts</Text>
          </View>

          {/* User Stats */}
          {user && userPoints && (
            <View style={styles.userStatsCard}>
              <Text style={styles.userStatsTitle}>Your Stats</Text>
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

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'wins' && styles.tabActive]}
              onPress={() => setActiveTab('wins')}
            >
              <Text style={[styles.tabText, activeTab === 'wins' && styles.tabTextActive]}>
                Biggest Wins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'machines' && styles.tabActive]}
              onPress={() => setActiveTab('machines')}
            >
              <Text style={[styles.tabText, activeTab === 'machines' && styles.tabTextActive]}>
                Machines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'casinos' && styles.tabActive]}
              onPress={() => setActiveTab('casinos')}
            >
              <Text style={[styles.tabText, activeTab === 'casinos' && styles.tabTextActive]}>
                Casinos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Leaderboard */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((entry) => {
              const isTopThree = entry.rank && entry.rank <= 3;
              const displayName = entry.username || 'Anonymous Scout';
              
              return (
                <View
                  key={entry.id}
                  style={[styles.leaderboardCard, isTopThree && styles.topThreeCard]}
                >
                  <View style={[styles.rankBadge, isTopThree && styles.topThreeBadge]}>
                    <Text style={[styles.rankText, isTopThree && styles.topThreeRankText]}>
                      {entry.rank}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{displayName}</Text>
                    <Text style={styles.userStats}>{getScoreLabel()}</Text>
                  </View>
                  <Text style={styles.scoreValue}>{getScoreValue(entry)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No leaderboard data yet. Be the first!</Text>
          )}

          {/* Sign In Prompt */}
          {!user && (
            <View style={styles.signInPrompt}>
              <Text style={styles.signInText}>
                Sign in to see your rank and compete with other scouts!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
