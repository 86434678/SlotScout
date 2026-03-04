import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';

interface LeaderboardEntry {
  userId: string;
  username: string;
  photoUrl: string | null;
  score: number;
  rank: number;
}

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<'highest_win' | 'machines_reported' | 'casinos_scouted'>('highest_win');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ leaderboard: LeaderboardEntry[] }>(`/api/gamification/leaderboard?type=${activeTab}`);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('[Leaderboards] Error:', error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getTabTitle = (type: string) => {
    const titles: any = { highest_win: 'Biggest Wins', machines_reported: 'Most Machines', casinos_scouted: 'Most Casinos' };
    return titles[type] || type;
  };

  return (
    <>
      <Stack.Screen options={{ title: "Leaderboards" }} />
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {(['highest_win', 'machines_reported', 'casinos_scouted'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{getTabTitle(tab)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>No leaderboard data yet. Be the first!</Text>
        ) : (
          <ScrollView>
            {leaderboard.map((entry, index) => (
              <View key={entry.userId} style={styles.entry}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Text style={styles.username}>{entry.username}</Text>
                <Text style={styles.score}>${entry.score.toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.card },
  tab: { flex: 1, padding: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 100, color: colors.textSecondary, fontSize: 16 },
  entry: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rank: { fontSize: 18, fontWeight: 'bold', width: 40 },
  username: { flex: 1, fontSize: 18 },
  score: { fontSize: 18, fontWeight: 'bold', color: colors.gold },
});
