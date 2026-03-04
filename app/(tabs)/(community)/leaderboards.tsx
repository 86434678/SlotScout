
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

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  month: string;
  disclaimer: string;
}

type LeaderboardType = 'highest_win' | 'machines_reported' | 'casinos_scouted';

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('highest_win');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  console.log('LeaderboardsScreen: Rendering leaderboards screen');

  const loadLeaderboard = useCallback(async () => {
    console.log('[API] Loading leaderboard:', activeTab);
    setIsLoading(true);

    try {
      console.log(`[API] Requesting /api/gamification/leaderboards/${activeTab}`);
      const data = await apiGet<LeaderboardResponse>(`/api/gamification/leaderboards/${activeTab}`);
      setLeaderboard(data.leaderboard || []);
      setCurrentMonth(data.month || '');
      console.log('[API] Leaderboard loaded:', (data.leaderboard || []).length, 'entries for month:', data.month);
    } catch (error: any) {
      console.error('[API] Error loading leaderboard:', error);
      // Fallback to empty leaderboard
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getTabTitle = (type: LeaderboardType): string => {
    const titles = {
      highest_win: 'Highest Win',
      machines_reported: 'Most Machines',
      casinos_scouted: 'Most Casinos',
    };
    return titles[type];
  };

  const getScoreLabel = (type: LeaderboardType, score: number): string => {
    if (type === 'highest_win') {
      return `$${score.toLocaleString()}`;
    }
    const labels = {
      machines_reported: 'machines',
      casinos_scouted: 'casinos',
    };
    const label = labels[type] || '';
    const scoreText = score.toString();
    return `${scoreText} ${label}`;
  };

  const getRankIcon = (rank: number): string => {
    const icons = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    };
    return icons[rank as keyof typeof icons] || `#${rank}`;
  };

  const tabTitle1 = getTabTitle('highest_win');
  const tabTitle2 = getTabTitle('machines_reported');
  const tabTitle3 = getTabTitle('casinos_scouted');
  const monthDisplay = currentMonth ? ` — ${currentMonth}` : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: "Leaderboards",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'highest_win' && styles.tabActive]}
            onPress={() => setActiveTab('highest_win')}
          >
            <Text style={[styles.tabText, activeTab === 'highest_win' && styles.tabTextActive]}>
              {tabTitle1}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'machines_reported' && styles.tabActive]}
            onPress={() => setActiveTab('machines_reported')}
          >
            <Text style={[styles.tabText, activeTab === 'machines_reported' && styles.tabTextActive]}>
              {tabTitle2}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'casinos_scouted' && styles.tabActive]}
            onPress={() => setActiveTab('casinos_scouted')}
          >
            <Text style={[styles.tabText, activeTab === 'casinos_scouted' && styles.tabTextActive]}>
              {tabTitle3}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Responsible Gaming Notice */}
        <View style={styles.notice}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="warning" 
            size={20} 
            color={colors.warning} 
          />
          <Text style={styles.noticeText}>
            For entertainment & data sharing only. Play responsibly — this is not gambling advice.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading leaderboard...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              {leaderboard.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol 
                    ios_icon_name="trophy" 
                    android_material_icon_name="emoji-events" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>
                    No entries yet
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to climb the leaderboard!
                  </Text>
                </View>
              ) : (
                <View style={styles.leaderboardList}>
                  {leaderboard.map((entry) => {
                    const rankIcon = getRankIcon(entry.rank);
                    const scoreLabel = getScoreLabel(activeTab, entry.score);
                    
                    return (
                      <View key={entry.userId} style={styles.leaderboardCard}>
                        <View style={styles.rankContainer}>
                          <Text style={styles.rankText}>
                            {rankIcon}
                          </Text>
                        </View>
                        
                        {entry.photoUrl ? (
                          <Image source={{ uri: entry.photoUrl }} style={styles.userPhoto} />
                        ) : (
                          <View style={styles.userPhotoPlaceholder}>
                            <IconSymbol 
                              ios_icon_name="person.fill" 
                              android_material_icon_name="person" 
                              size={24} 
                              color={colors.textSecondary} 
                            />
                          </View>
                        )}
                        
                        <View style={styles.userInfo}>
                          <Text style={styles.username}>
                            {entry.username}
                          </Text>
                          <Text style={styles.score}>
                            {scoreLabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <Text style={styles.disclaimer}>
                Leaderboards reset on the 1st of each month{monthDisplay}. Keep reporting to stay on top!
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHighlight,
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardHighlight,
  },
  userPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  score: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
