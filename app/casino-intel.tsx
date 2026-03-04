
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';

interface TableMinimum {
  id: string;
  casinoName: string;
  gameType: string;
  area: string;
  minBet: number;
  maxBet: number | null;
  timeOfDay: string | null;
  dayOfWeek: string | null;
  notes: string | null;
  source: string | null;
  lastUpdated: string;
}

interface SummaryStats {
  stripAverage: { blackjack: number; craps: number; roulette: number };
  downtownAverage: { blackjack: number; craps: number; roulette: number };
  localsAverage: { blackjack: number; craps: number; roulette: number };
  lastUpdated: string;
}

const GAME_ICONS: Record<string, string> = {
  blackjack: '🃏',
  craps: '🎲',
  roulette: '🎡',
  baccarat: '💎',
};

export default function CasinoIntelScreen() {
  const router = useRouter();
  const [minimums, setMinimums] = useState<TableMinimum[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  console.log('[CasinoIntel] Rendering Casino Intel screen');

  const loadData = React.useCallback(async () => {
    console.log('[CasinoIntel] Loading table minimums data');
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedGame) params.append('gameType', selectedGame);
      if (selectedArea) params.append('area', selectedArea);
      if (selectedTime) params.append('timeOfDay', selectedTime);
      if (selectedDay) params.append('dayOfWeek', selectedDay);

      const queryString = params.toString();
      const endpoint = `/api/casino-intel/table-minimums${queryString ? `?${queryString}` : ''}`;
      
      console.log('[CasinoIntel] Requesting:', endpoint);
      const data = await apiGet<TableMinimum[]>(endpoint);
      setMinimums(data);
      console.log('[CasinoIntel] Table minimums loaded:', data.length);

      // Load summary stats
      console.log('[CasinoIntel] Requesting: /api/casino-intel/table-minimums/summary');
      const summaryData = await apiGet<SummaryStats>('/api/casino-intel/table-minimums/summary');
      setSummary(summaryData);
      console.log('[CasinoIntel] Summary stats loaded');
    } catch (error: any) {
      console.error('[CasinoIntel] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedArea, selectedTime, selectedDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    console.log('[CasinoIntel] User triggered pull-to-refresh');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatLastUpdated = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const gameTypes = ['blackjack', 'craps', 'roulette', 'baccarat'];
  const areas = ['Strip', 'Downtown', 'Locals'];
  const timesOfDay = ['morning', 'afternoon', 'evening', 'late_night'];
  const daysOfWeek = ['weekday', 'weekend'];

  const timeLabels: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    late_night: 'Late Night',
  };

  const dayLabels: Record<string, string> = {
    weekday: 'Weekday',
    weekend: 'Weekend',
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Table Minimums',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Loading table minimums...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>🎰 Las Vegas Table Minimums</Text>
              <Text style={styles.headerSubtitle}>
                Find the best table game minimums across Las Vegas casinos
              </Text>
              {summary && (
                <View style={styles.lastUpdatedBadge}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="access-time"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.lastUpdatedText}>
                    Last Updated: {formatLastUpdated(summary.lastUpdated)}
                  </Text>
                </View>
              )}
            </View>

            {/* Summary Stats */}
            {summary && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Average Minimums by Area</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryAreaLabel}>🎰 Strip</Text>
                  <View style={styles.summaryGames}>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>BJ</Text>
                      <Text style={styles.summaryGameValue}>${summary.stripAverage.blackjack}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Craps</Text>
                      <Text style={styles.summaryGameValue}>${summary.stripAverage.craps}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Roulette</Text>
                      <Text style={styles.summaryGameValue}>${summary.stripAverage.roulette}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryAreaLabel}>🏛️ Downtown</Text>
                  <View style={styles.summaryGames}>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>BJ</Text>
                      <Text style={styles.summaryGameValue}>${summary.downtownAverage.blackjack}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Craps</Text>
                      <Text style={styles.summaryGameValue}>${summary.downtownAverage.craps}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Roulette</Text>
                      <Text style={styles.summaryGameValue}>${summary.downtownAverage.roulette}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryAreaLabel}>🏘️ Locals</Text>
                  <View style={styles.summaryGames}>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>BJ</Text>
                      <Text style={styles.summaryGameValue}>${summary.localsAverage.blackjack}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Craps</Text>
                      <Text style={styles.summaryGameValue}>${summary.localsAverage.craps}</Text>
                    </View>
                    <View style={styles.summaryGameItem}>
                      <Text style={styles.summaryGameLabel}>Roulette</Text>
                      <Text style={styles.summaryGameValue}>${summary.localsAverage.roulette}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Filters */}
            <View style={styles.filtersSection}>
              <Text style={styles.filtersTitle}>Filters</Text>

              {/* Game Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Game Type</Text>
                <View style={styles.filterChips}>
                  {gameTypes.map((game) => (
                    <TouchableOpacity
                      key={game}
                      style={[
                        styles.filterChip,
                        selectedGame === game && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedGame(selectedGame === game ? null : game)}
                    >
                      <Text style={styles.filterChipIcon}>{GAME_ICONS[game]}</Text>
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedGame === game && styles.filterChipTextActive,
                        ]}
                      >
                        {game.charAt(0).toUpperCase() + game.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Area Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Area</Text>
                <View style={styles.filterChips}>
                  {areas.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={[
                        styles.filterChip,
                        selectedArea === area && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedArea(selectedArea === area ? null : area)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedArea === area && styles.filterChipTextActive,
                        ]}
                      >
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time of Day Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Time of Day</Text>
                <View style={styles.filterChips}>
                  {timesOfDay.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.filterChip,
                        selectedTime === time && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedTime(selectedTime === time ? null : time)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedTime === time && styles.filterChipTextActive,
                        ]}
                      >
                        {timeLabels[time]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day of Week Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Day</Text>
                <View style={styles.filterChips}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.filterChip,
                        selectedDay === day && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedDay(selectedDay === day ? null : day)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedDay === day && styles.filterChipTextActive,
                        ]}
                      >
                        {dayLabels[day]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Filters Button */}
              {(selectedGame || selectedArea || selectedTime || selectedDay) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSelectedGame(null);
                    setSelectedArea(null);
                    setSelectedTime(null);
                    setSelectedDay(null);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {minimums.length} {minimums.length === 1 ? 'Result' : 'Results'}
              </Text>

              {minimums.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="magnifyingglass"
                    android_material_icon_name="search-off"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                </View>
              ) : (
                minimums.map((minimum) => {
                  const gameIcon = GAME_ICONS[minimum.gameType] || '🎲';
                  const minBetText = `$${minimum.minBet}`;
                  const maxBetText = minimum.maxBet ? ` - $${minimum.maxBet}` : '';
                  const timeText = minimum.timeOfDay ? timeLabels[minimum.timeOfDay] : '';
                  const dayText = minimum.dayOfWeek ? dayLabels[minimum.dayOfWeek] : '';
                  const contextText = [timeText, dayText].filter(Boolean).join(' • ');
                  
                  return (
                    <View key={minimum.id} style={styles.resultCard}>
                      <View style={styles.resultHeader}>
                        <Text style={styles.resultGameIcon}>{gameIcon}</Text>
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultCasino}>{minimum.casinoName}</Text>
                          <Text style={styles.resultGame}>
                            {minimum.gameType.charAt(0).toUpperCase() + minimum.gameType.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.resultBetBadge}>
                          <Text style={styles.resultBetText}>{minBetText}{maxBetText}</Text>
                        </View>
                      </View>
                      <View style={styles.resultDetails}>
                        <View style={styles.resultDetailRow}>
                          <IconSymbol
                            ios_icon_name="location.fill"
                            android_material_icon_name="place"
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={styles.resultDetailText}>{minimum.area}</Text>
                        </View>
                        {contextText && (
                          <View style={styles.resultDetailRow}>
                            <IconSymbol
                              ios_icon_name="clock.fill"
                              android_material_icon_name="access-time"
                              size={14}
                              color={colors.primary}
                            />
                            <Text style={styles.resultDetailText}>{contextText}</Text>
                          </View>
                        )}
                        {minimum.notes && (
                          <Text style={styles.resultNotes}>{minimum.notes}</Text>
                        )}
                        {minimum.source && (
                          <Text style={styles.resultSource}>Source: {minimum.source}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.disclaimerText}>
                Approximate minimums based on public sources. Always confirm on-site before playing. 
                Sources: VegasAdvantage.com, casino websites. Updated monthly.
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    marginBottom: 12,
  },
  summaryAreaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  summaryGames: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryGameItem: {
    flex: 1,
    backgroundColor: colors.cardHighlight,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  summaryGameLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryGameValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gold,
  },
  filtersSection: {
    margin: 16,
    marginBottom: 0,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterChipIcon: {
    fontSize: 16,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.cardHighlight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resultsSection: {
    margin: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  resultGameIcon: {
    fontSize: 32,
  },
  resultInfo: {
    flex: 1,
  },
  resultCasino: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  resultGame: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultBetBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resultBetText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.background,
  },
  resultDetails: {
    gap: 6,
  },
  resultDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultDetailText: {
    fontSize: 13,
    color: colors.text,
  },
  resultNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  resultSource: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
