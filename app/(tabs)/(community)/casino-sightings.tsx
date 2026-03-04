
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';

interface CommunityReport {
  id: string;
  imageUrl: string;
  manufacturer: string;
  gameTitle: string;
  casino: string;
  winAmount: number;
  jackpotType: string;
  notes: string;
  createdAt: string;
}

interface CasinoReview {
  casinoName: string;
  averageRating: number;
  totalReviews: number;
  slotsRating: number;
  cleanliness: number;
  atmosphere: number;
  sourceUrl: string | null;
  lastUpdated: string;
  disclaimer: string;
}

export default function CasinoSightingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const casinoName = params.casinoName as string;
  const reportCount = params.reportCount as string;

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalWinAmount, setTotalWinAmount] = useState(0);
  const [casinoReview, setCasinoReview] = useState<CasinoReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  console.log('CasinoSightingsScreen: Rendering for casino:', casinoName);

  useEffect(() => {
    if (casinoName) {
      loadReports();
      loadCasinoReview();
    }
  }, [casinoName]);

  const loadReports = async () => {
    if (!casinoName) {
      console.log('[API] No casino name provided, skipping load');
      setIsLoading(false);
      return;
    }

    console.log('[API] Loading sightings for casino:', casinoName);
    setIsLoading(true);

    try {
      const encodedCasinoName = encodeURIComponent(casinoName);
      console.log('[API] Requesting /api/community-reports/by-casino/' + encodedCasinoName);
      const data = await apiGet<{ reports: any[]; count: number }>(`/api/community-reports/by-casino/${encodedCasinoName}?limit=50`);
      
      const reportsData: CommunityReport[] = (data.reports || []).map((r: any) => ({
        ...r,
        winAmount: r.winAmount ? parseFloat(r.winAmount) : 0,
      }));
      
      // Calculate total win amount
      const total = reportsData.reduce((sum, report) => sum + (report.winAmount || 0), 0);
      setTotalWinAmount(total);
      
      setReports(reportsData);
      console.log('[API] Casino sightings loaded:', reportsData.length, 'Total wins:', total);
    } catch (error: any) {
      console.error('[API] Error loading casino sightings:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCasinoReview = async () => {
    if (!casinoName) return;
    console.log('[API] Loading casino review for:', casinoName);
    setIsLoadingReview(true);
    try {
      const encodedName = encodeURIComponent(casinoName);
      console.log('[API] Requesting /api/casinos/' + encodedName + '/reviews');
      const data = await apiGet<CasinoReview>(`/api/casinos/${encodedName}/reviews`);
      setCasinoReview(data);
      console.log('[API] Casino review loaded:', data.averageRating);
    } catch (error: any) {
      console.error('[API] Error loading casino review:', error);
      setCasinoReview(null);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleRefresh = async () => {
    if (!casinoName) return;
    setIsRefreshing(true);
    await Promise.all([loadReports(), loadCasinoReview()]);
    setIsRefreshing(false);
  };

  const handleViewDetail = (report: CommunityReport) => {
    console.log('User tapped on sighting:', report.id);
    router.push({
      pathname: '/(tabs)/(community)/win-detail',
      params: {
        id: report.id,
        imageUrl: report.imageUrl,
        manufacturer: report.manufacturer || '',
        gameTitle: report.gameTitle || '',
        casino: report.casino,
        winAmount: report.winAmount.toString(),
        jackpotType: report.jackpotType || '',
        notes: report.notes || '',
        createdAt: report.createdAt,
      },
    });
  };

  const handleReportSighting = () => {
    console.log('User tapped Report a sighting button');
    router.push('/(tabs)/(community)');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      const daysText = diffDays.toString();
      return `${daysText} days ago`;
    }
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const countText = reportCount || reports.length.toString();
  
  const formatWinAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    } else if (amount > 0) {
      return `$${amount.toFixed(0)}`;
    } else {
      return '$0';
    }
  };
  
  const totalWinText = formatWinAmount(totalWinAmount);

  return (
    <>
      <Stack.Screen
        options={{
          title: casinoName,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShown: true,
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading sightings...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.content}>
              {/* Header Stats */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <IconSymbol
                      ios_icon_name="dollarsign.circle.fill"
                      android_material_icon_name="attach-money"
                      size={32}
                      color={colors.primary}
                    />
                    <Text style={styles.statValue}>
                      {totalWinText}
                    </Text>
                    <Text style={styles.statLabel}>
                      Total Reported Wins
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol
                      ios_icon_name="chart.bar.fill"
                      android_material_icon_name="bar-chart"
                      size={32}
                      color={colors.secondary}
                    />
                    <Text style={styles.statValue}>
                      {countText}
                    </Text>
                    <Text style={styles.statLabel}>
                      Total Reports
                    </Text>
                  </View>
                </View>
              </View>

              {/* Casino Reviews Section */}
              {isLoadingReview ? (
                <View style={styles.reviewLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.reviewLoadingText}>Loading ratings...</Text>
                </View>
              ) : casinoReview ? (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewCardTitle}>⭐ Slot Player Ratings</Text>
                  <View style={styles.reviewStarsRow}>
                    <Text style={styles.reviewMainRating}>{casinoReview.averageRating.toFixed(1)}</Text>
                    <View style={styles.reviewStarsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={star} style={[styles.reviewStar, { opacity: star <= Math.round(casinoReview.averageRating) ? 1 : 0.3 }]}>⭐</Text>
                      ))}
                      <Text style={styles.reviewCount}>({casinoReview.totalReviews} reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.reviewBreakdown}>
                    <View style={styles.reviewBreakdownItem}>
                      <Text style={styles.reviewBreakdownLabel}>Slots</Text>
                      <Text style={styles.reviewBreakdownValue}>{casinoReview.slotsRating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.reviewBreakdownItem}>
                      <Text style={styles.reviewBreakdownLabel}>Cleanliness</Text>
                      <Text style={styles.reviewBreakdownValue}>{casinoReview.cleanliness.toFixed(1)}</Text>
                    </View>
                    <View style={styles.reviewBreakdownItem}>
                      <Text style={styles.reviewBreakdownLabel}>Atmosphere</Text>
                      <Text style={styles.reviewBreakdownValue}>{casinoReview.atmosphere.toFixed(1)}</Text>
                    </View>
                  </View>
                  {casinoReview.sourceUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(casinoReview.sourceUrl!)}>
                      <Text style={styles.reviewSourceLink}>View full reviews →</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.reviewDisclaimer}>{casinoReview.disclaimer}</Text>
                </View>
              ) : null}

              {/* Report Button */}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleReportSighting}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={24}
                  color={colors.background}
                />
                <Text style={styles.reportButtonText}>
                  Report a sighting now
                </Text>
              </TouchableOpacity>

              {/* Sightings List */}
              <Text style={styles.sectionTitle}>
                Recent Sightings
              </Text>

              {reports.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="photo"
                    android_material_icon_name="photo-library"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No sightings yet
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to report!
                  </Text>
                </View>
              ) : (
                <View style={styles.reportsList}>
                  {reports.map((report) => {
                    const winAmountNum = typeof report.winAmount === 'string' ? parseFloat(report.winAmount) : report.winAmount;
                    const winAmountText = winAmountNum ? `$${winAmountNum.toLocaleString()}` : '';
                    const gameInfo = [report.manufacturer, report.gameTitle].filter(Boolean).join(' - ') || 'Unknown Slot';
                    const dateText = formatDate(report.createdAt);
                    
                    return (
                      <TouchableOpacity
                        key={report.id}
                        style={styles.reportCard}
                        onPress={() => handleViewDetail(report)}
                      >
                        <Image
                          source={{ uri: report.imageUrl }}
                          style={styles.reportImage}
                          resizeMode="cover"
                        />
                        <View style={styles.reportDetails}>
                          <Text style={styles.reportGame}>
                            {gameInfo}
                          </Text>
                          <View style={styles.reportMeta}>
                            <IconSymbol
                              ios_icon_name="clock.fill"
                              android_material_icon_name="access-time"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.reportDate}>
                              {dateText}
                            </Text>
                          </View>
                          {winAmountText && (
                            <View style={styles.reportWin}>
                              <Text style={styles.reportAmount}>
                                {winAmountText}
                              </Text>
                              {report.jackpotType && (
                                <Text style={styles.reportType}>
                                  {report.jackpotType}
                                </Text>
                              )}
                            </View>
                          )}
                          {report.notes && (
                            <Text style={styles.reportNotes} numberOfLines={2}>
                              {report.notes}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.disclaimer}>
                All reports are user-submitted. Not a guarantee of future results. For entertainment only.
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
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  reviewLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reviewMainRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reviewStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexWrap: 'wrap',
  },
  reviewStar: {
    fontSize: 16,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reviewBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  reviewBreakdownItem: {
    alignItems: 'center',
  },
  reviewBreakdownLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reviewBreakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  reviewSourceLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewDisclaimer: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  reportButton: {
    backgroundColor: colors.gold || colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  reportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
  reportsList: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportImage: {
    width: '100%',
    height: 180,
  },
  reportDetails: {
    padding: 16,
  },
  reportGame: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportWin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reportAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reportType: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  reportNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});
