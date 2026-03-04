
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Modal, Animated, Dimensions, RefreshControl } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost, apiDelete, authenticatedPost, apiUpload, BACKEND_URL } from '@/utils/api';
import { retryWithBackoff } from '@/utils/apiRetry';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface Casino {
  id: string;
  name: string;
  location: string;
}

interface ActivityStat {
  casinoName: string;
  totalWinAmount: number;
  reportCount: number;
}

interface CasinoEvent {
  id: string;
  casinoName: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  eventType: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [sortBy, setSortBy] = useState<'totalWins' | 'reportCount' | 'recentActivity'>('totalWins');
  const [events, setEvents] = useState<CasinoEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Form state - CRITICAL: Keep all form state even after image editing
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [manufacturer, setManufacturer] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [selectedCasino, setSelectedCasino] = useState('');
  const [winAmount, setWinAmount] = useState('');
  const [jackpotType, setJackpotType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<{ badgeName: string; points: number }[]>([]);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationScale = useState(new Animated.Value(0))[0];

  // Admin delete state
  const [reportToDelete, setReportToDelete] = useState<CommunityReport | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Flag report state
  const [reportToFlag, setReportToFlag] = useState<CommunityReport | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  console.log('CommunityScreen: Rendering community screen');

  // Check if user is admin
  const isAdmin = user?.email?.endsWith('@ngcb.nv.gov') || false;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadReports(), loadCasinos(), loadActivityStats(), loadEvents()]);
      setIsLoading(false);
    };
    init();
  }, []);

  // CRITICAL FIX: Listen for edited image from Edit Photo screen via params
  // Only update the image, preserve all other form data
  useEffect(() => {
    if (params.editedImageUri && typeof params.editedImageUri === 'string') {
      console.log('Received edited image from edit-photo screen:', params.editedImageUri);
      console.log('Preserving existing form data:', { manufacturer, gameTitle, selectedCasino, winAmount, jackpotType, notes });
      
      // Only update the image, keep all other form fields intact
      setSelectedImage(params.editedImageUri);
      
      // Reopen the modal if it was closed
      if (!showReportModal) {
        console.log('Reopening report modal with edited image');
        setShowReportModal(true);
      }
    }
  }, [params.editedImageUri]);

  const loadReports = async () => {
    console.log('[API] Loading community reports');

    try {
      console.log('[API] Requesting /api/community-reports?limit=20');
      const data = await retryWithBackoff(
        () => apiGet<any[]>('/api/community-reports?limit=20'),
        {
          maxRetries: 3,
          minDelay: 800,
          maxDelay: 1000,
          onRetry: (attempt, err) => {
            console.log(`[Community] Retry attempt ${attempt} after error:`, err.message);
            setRetryAttempt(attempt);
          },
        }
      );
      const reportsData: CommunityReport[] = data.map((r: any) => ({
        ...r,
        winAmount: r.winAmount ? parseFloat(r.winAmount) : 0,
      }));
      setReports(reportsData);
      setRetryAttempt(0);
      console.log('[API] Community reports loaded:', reportsData.length);
    } catch (error: any) {
      console.error('[API] Error loading reports after all retries:', error);
      setErrorMessage('Failed to load community reports. Please try again.');
      setRetryAttempt(0);
    }
  };

  const handleRefresh = async () => {
    console.log('[Community] User triggered pull-to-refresh');
    setIsRefreshing(true);
    await Promise.all([loadReports(), loadActivityStats()]);
    setIsRefreshing(false);
  };

  const loadCasinos = async () => {
    console.log('[API] Loading casinos list');
    
    try {
      console.log('[API] Requesting /api/casinos');
      const data = await apiGet<Casino[]>('/api/casinos');
      setCasinos(data);
      console.log('[API] Casinos loaded:', data.length);
    } catch (error: any) {
      console.error('[API] Error loading casinos:', error);
      // Fallback casinos
      setCasinos([
        { id: 'bellagio', name: 'Bellagio', location: 'Las Vegas Strip' },
        { id: 'mgm', name: 'MGM Grand', location: 'Las Vegas Strip' },
        { id: 'caesars', name: 'Caesars Palace', location: 'Las Vegas Strip' },
        { id: 'venetian', name: 'Venetian', location: 'Las Vegas Strip' },
        { id: 'wynn', name: 'Wynn', location: 'Las Vegas Strip' },
        { id: 'golden-nugget', name: 'Golden Nugget', location: 'Downtown' },
      ]);
    }
  };

  const loadActivityStats = async () => {
    console.log('[API] Loading community activity stats with sortBy:', sortBy);
    setIsLoadingStats(true);

    try {
      console.log('[API] Requesting /api/casino-directory/activity-stats?sortBy=' + sortBy);
      const data = await retryWithBackoff(
        () => apiGet<{ stats: ActivityStat[]; disclaimer: string }>(`/api/casino-directory/activity-stats?sortBy=${sortBy}`),
        {
          maxRetries: 3,
          minDelay: 800,
          maxDelay: 1000,
          onRetry: (attempt, err) => {
            console.log(`[Community] Activity stats retry attempt ${attempt}:`, err.message);
          },
        }
      );
      setActivityStats(data.stats);
      console.log('[API] Activity stats loaded:', data.stats.length);
    } catch (error: any) {
      console.error('[API] Error loading activity stats after all retries:', error);
      setActivityStats([]);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadEvents = async () => {
    console.log('[API] Loading casino events');
    setIsLoadingEvents(true);
    try {
      console.log('[API] Requesting /api/events?upcomingOnly=true&limit=5');
      const data = await apiGet<CasinoEvent[]>('/api/events?upcomingOnly=true&limit=5');
      setEvents(data || []);
      console.log('[API] Events loaded:', (data || []).length);
    } catch (error: any) {
      console.error('[API] Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Reload stats when sort changes
  useEffect(() => {
    if (!isLoading) {
      loadActivityStats();
    }
  }, [sortBy]);

  const handleAddReport = () => {
    console.log('User tapped Add Report button');
    setShowReportModal(true);
  };

  const handlePickImage = async () => {
    console.log('User tapped Pick Image button');
    console.log('Current form state before picking image:', { manufacturer, gameTitle, selectedCasino, winAmount, jackpotType, notes });
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setErrorMessage('Permission to access photos is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const pickedImageUri = result.assets[0].uri;
        console.log('Image selected:', pickedImageUri);
        
        // Navigate to Edit Photo screen
        // The modal will stay open in the background
        router.push({
          pathname: '/edit-photo',
          params: {
            imageUri: pickedImageUri,
            returnRoute: '/(tabs)/(community)',
          },
        });
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image. Please try again.');
    }
  };

 const handleSubmitReport = async () => {
  console.log('User tapped Submit Report button');
  console.log('Form data at submission:', {
    selectedImage,
    manufacturer,
    gameTitle,
    selectedCasino,
    winAmount,
    jackpotType,
    notes,
  });
  
  // Validation
  if (!selectedImage) {
    setErrorMessage('Please select an image');
    return;
  }
  if (!selectedCasino) {
    setErrorMessage('Please select a casino');
    return;
  }

  setIsSubmitting(true);
  setErrorMessage(null);

  try {
    // Step 1: Upload image
    console.log('[API] Uploading community report image...');
    const formData = new FormData();
    const filename = selectedImage.split('/').pop() || 'report.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: selectedImage,
      name: filename,
      type,
    } as any);

    const uploadData = await apiUpload<{ url: string; filename: string }>('/api/upload/slot-image', formData);
    console.log('[API] Image uploaded:', uploadData.url);

    // Step 2: Submit report
    console.log('[API] Submitting report...');
    const machine = [manufacturer.trim(), gameTitle.trim()].filter(Boolean).join(' - ') || 'Unknown Slot';
    const amount = winAmount.trim() ? parseFloat(winAmount) : 0;
    const reportType = jackpotType.trim() || 'Standard';
    
    const submitPayload: any = {
      machine,
      casino: selectedCasino,
      amount,
      type: reportType,
      imageUrl: uploadData.url,
    };
    if (notes.trim()) submitPayload.notes = notes.trim();
    if (user?.id) submitPayload.userId = user.id;

    const submitResponse = await apiPost<{ success: boolean; reportId: string; message: string }>('/api/reports/submit', submitPayload);
    console.log('[API] Report submitted successfully');

    // Success path
    setSuccessMessage(submitResponse.message || 'Your win report has been submitted! 🎰');

    // Award real points (will work once backend is live)
    if (user) {
      try {
        const hasPhoto = !!selectedImage;
        const isWinReport = winAmount && parseFloat(winAmount) > 0;
        const winAmountNum = isWinReport ? parseFloat(winAmount) : undefined;
        const action = isWinReport ? 'big_win' : 'machine_report';
        const metadata: any = { hasPhoto, casinoName: selectedCasino };
        if (winAmountNum !== undefined) metadata.winAmount = winAmountNum;

        const gamificationResult = await authenticatedPost<{
          pointsAwarded: number;
          newBadges: { badgeName: string; points: number }[];
        }>('/api/gamification/award-points', { action, metadata });

        if (gamificationResult.newBadges?.length > 0) {
          setNewBadges(gamificationResult.newBadges);
          setPointsAwarded(gamificationResult.pointsAwarded);
          setShowCelebration(true);
        } else {
          setSuccessMessage(`Your win report has been submitted! 🎰\n\n+${gamificationResult.pointsAwarded} points earned!`);
        }
      } catch (gamificationError) {
        console.error('[API] Points error (backend still syncing):', gamificationError);
      }
    }

    setShowReportModal(false);
    resetForm();
    loadReports();
    loadActivityStats();
  } catch (error: any) {
    console.error('[API] Submission error:', error);
    
    // Special handling for the exact problem we're having
    if (error.message?.includes('404') || error.response?.status === 404 || error.status === 404) {
      setErrorMessage('Backend routes are still deploying (Natively sync issue). Wait 60 seconds, reload the preview, and try again. This will fix itself shortly.');
    } else {
      setErrorMessage(error.message || 'Upload failed — try a smaller photo or check your connection');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    console.log('Resetting form');
    setSelectedImage('');
    setManufacturer('');
    setGameTitle('');
    setSelectedCasino('');
    setWinAmount('');
    setJackpotType('');
    setNotes('');
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    celebrationScale.setValue(0);
    setNewBadges([]);
    setPointsAwarded(0);
  };

  const handleCloseModal = () => {
    console.log('User closed report modal');
    setShowReportModal(false);
    resetForm();
  };

  const handleViewWinDetail = (report: CommunityReport) => {
    console.log('User tapped on win report:', report.id);
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

  const handleLongPress = (report: CommunityReport) => {
    if (!isAdmin) return;
    
    console.log('Admin long-pressed on report:', report.id);
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete || !isAdmin) return;

    console.log('Admin confirmed delete for report:', reportToDelete.id);
    setIsDeleting(true);

    try {
      console.log('[API] Deleting community report:', reportToDelete.id);
      await apiDelete(`/api/community-reports/${reportToDelete.id}`);
      console.log('[API] Report deleted successfully');
      
      setShowDeleteModal(false);
      setReportToDelete(null);
      setSuccessMessage('Report deleted successfully');
      
      // Refresh data
      loadReports();
      loadActivityStats();
    } catch (error: any) {
      console.error('[API] Error deleting report:', error);
      setErrorMessage(error.message || 'Failed to delete report. Please try again.');
      setShowDeleteModal(false);
      setReportToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('Admin cancelled delete');
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const handleFlagReport = (report: CommunityReport) => {
    console.log('User tapped Flag Report button for:', report.id);
    setReportToFlag(report);
    setShowFlagModal(true);
  };

  const handleConfirmFlag = async () => {
    if (!reportToFlag) return;

    console.log('User confirmed flag for report:', reportToFlag.id);
    setIsFlagging(true);

    try {
      console.log('[API] Flagging community report:', reportToFlag.id);
      await apiPost(`/api/community-reports/${reportToFlag.id}/flag`, {});
      console.log('[API] Report flagged successfully');
      
      setShowFlagModal(false);
      setReportToFlag(null);
      setSuccessMessage('Report flagged for review. Thank you for helping keep the community safe!');
    } catch (error: any) {
      console.error('[API] Error flagging report:', error);
      setErrorMessage(error.message || 'Failed to flag report. Please try again.');
      setShowFlagModal(false);
      setReportToFlag(null);
    } finally {
      setIsFlagging(false);
    }
  };

  const handleCancelFlag = () => {
    console.log('User cancelled flag');
    setShowFlagModal(false);
    setReportToFlag(null);
  };

  const submittingText = isSubmitting ? 'Submitting...' : '';
  const deletingText = isDeleting ? 'Deleting...' : '';
  const flaggingText = isFlagging ? 'Flagging...' : '';

  const handleBarPress = (data: any) => {
    console.log('User tapped bar chart data point:', data);
    if (data && data.index !== undefined && activityStats[data.index]) {
      const stat = activityStats[data.index];
      console.log('Navigating to casino sightings:', stat.casinoName);
      
      // Navigate to casino sightings detail screen
      router.push({
        pathname: '/(tabs)/(community)/casino-sightings',
        params: {
          casinoName: stat.casinoName,
          reportCount: stat.reportCount.toString(),
        },
      });
    }
  };

  const formatWinAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = (amount / 1000000).toFixed(1);
      return `$${millions}M`;
    } else if (amount >= 1000) {
      const thousands = (amount / 1000).toFixed(0);
      return `$${thousands}k`;
    } else {
      const dollars = amount.toFixed(0);
      return `$${dollars}`;
    }
  };

  const prepareChartData = () => {
    if (activityStats.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Show full casino names - use tooltips/list below for details
    const labels = activityStats.map((stat) => {
      const name = stat.casinoName;
      // Keep full names, chart will be horizontally scrollable
      return name;
    });

    // Use totalWinAmount instead of reportCount
    const data = activityStats.map((stat) => stat.totalWinAmount || 0);

    return {
      labels,
      datasets: [{ data }],
    };
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Community",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShown: true,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 }}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/(community)/leaderboards')}>
                <IconSymbol 
                  ios_icon_name="trophy.fill" 
                  android_material_icon_name="emoji-events" 
                  size={28} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddReport}>
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={28} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {retryAttempt > 0 ? `Loading community data... (Retry ${retryAttempt}/3)` : 'Loading community data...'}
            </Text>
            <Text style={styles.loadingHint}>First load may take a few seconds</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
          >
            <View style={styles.content}>
              {/* Motivational Banner */}
              <View style={styles.motivationalBanner}>
                <IconSymbol 
                  ios_icon_name="star.fill" 
                  android_material_icon_name="star" 
                  size={32} 
                  color={colors.primary} 
                />
                <Text style={styles.bannerText}>
                  Climb the leaderboards and earn badges by reporting real Vegas sightings! Help the community while having fun.
                </Text>
              </View>

              {/* Community Activity Section */}
              <View style={styles.activitySection}>
                <Text style={styles.activityHeader}>
                  Total Reported Wins by Casino
                </Text>
                
                {/* Sort Options */}
                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>Sort by:</Text>
                  <View style={styles.sortButtons}>
                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'totalWins' && styles.sortButtonActive]}
                      onPress={() => setSortBy('totalWins')}
                    >
                      <Text style={[styles.sortButtonText, sortBy === 'totalWins' && styles.sortButtonTextActive]}>
                        Total Wins
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'reportCount' && styles.sortButtonActive]}
                      onPress={() => setSortBy('reportCount')}
                    >
                      <Text style={[styles.sortButtonText, sortBy === 'reportCount' && styles.sortButtonTextActive]}>
                        # Reports
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'recentActivity' && styles.sortButtonActive]}
                      onPress={() => setSortBy('recentActivity')}
                    >
                      <Text style={[styles.sortButtonText, sortBy === 'recentActivity' && styles.sortButtonTextActive]}>
                        Recent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.disclaimerBox}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.triangle.fill" 
                    android_material_icon_name="warning" 
                    size={24} 
                    color={colors.warning} 
                  />
                  <Text style={styles.disclaimerText}>
                    This shows total reported win amounts from community submissions — NOT actual casino payouts or hot/cold status. Reports are anecdotal and biased toward big wins. Every slot spin is random. Play responsibly.
                  </Text>
                </View>

                {isLoadingStats ? (
                  <View style={styles.chartLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.chartLoadingText}>
                      Loading activity data...
                    </Text>
                  </View>
                ) : activityStats.length === 0 ? (
                  <View style={styles.chartEmptyState}>
                    <IconSymbol 
                      ios_icon_name="chart.bar" 
                      android_material_icon_name="bar-chart" 
                      size={48} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.chartEmptyText}>
                      No activity data yet
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chartContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <BarChart
                        data={prepareChartData()}
                        width={Math.max(SCREEN_WIDTH - 40, activityStats.length * 60)}
                        height={280}
                        yAxisLabel="$"
                        yAxisSuffix=""
                        chartConfig={{
                          backgroundColor: colors.card,
                          backgroundGradientFrom: colors.card,
                          backgroundGradientTo: colors.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => colors.gold || colors.primary,
                          labelColor: (opacity = 1) => colors.text,
                          style: {
                            borderRadius: 16,
                          },
                          propsForLabels: {
                            fontSize: 11,
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: '',
                            stroke: colors.border,
                            strokeWidth: 1,
                          },
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars={true}
                        fromZero={true}
                        onDataPointClick={handleBarPress}
                      />
                    </ScrollView>
                    {/* Casino list for easy navigation - tap to see sightings */}
                    <View style={styles.casinoListContainer}>
                      {activityStats.map((stat, index) => {
                        const winAmountFormatted = formatWinAmount(stat.totalWinAmount || 0);
                        const reportCountText = `${stat.reportCount} reports`;
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.casinoListItem}
                            onPress={() => {
                              console.log('User tapped casino list item:', stat.casinoName);
                              router.push({
                                pathname: '/(tabs)/(community)/casino-sightings',
                                params: {
                                  casinoName: stat.casinoName,
                                  reportCount: stat.reportCount.toString(),
                                },
                              });
                            }}
                          >
                            <View style={styles.casinoListItemLeft}>
                              <IconSymbol
                                ios_icon_name="building.2.fill"
                                android_material_icon_name="location-city"
                                size={16}
                                color={colors.primary}
                              />
                              <Text style={styles.casinoListItemName} numberOfLines={1}>
                                {stat.casinoName}
                              </Text>
                            </View>
                            <View style={styles.casinoListItemRight}>
                              <View style={styles.casinoListItemStats}>
                                <Text style={styles.casinoListItemWinAmount}>
                                  {winAmountFormatted}
                                </Text>
                                <Text style={styles.casinoListItemReportCount}>
                                  {reportCountText}
                                </Text>
                              </View>
                              <IconSymbol
                                ios_icon_name="chevron.right"
                                android_material_icon_name="chevron-right"
                                size={14}
                                color={colors.textSecondary}
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.reportSightingButton}
                  onPress={handleAddReport}
                >
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={24} 
                    color={colors.background} 
                  />
                  <Text style={styles.reportSightingButtonText}>
                    Report a sighting now
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Events & Promotions Section */}
              {(events.length > 0 || isLoadingEvents) && (
                <View style={styles.eventsSection}>
                  <Text style={styles.eventsHeader}>🎉 Events & Promotions</Text>
                  {isLoadingEvents ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                  ) : (
                    events.map((event) => {
                      const eventDate = (() => {
                        try {
                          return new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        } catch {
                          return event.eventDate;
                        }
                      })();
                      const eventTypeIcon = event.eventType === 'free_play' ? '🎁' : event.eventType === 'tournament' ? '🏆' : event.eventType === 'promotion' ? '💰' : '📅';
                      return (
                        <View key={event.id} style={styles.eventCard}>
                          <View style={styles.eventCardHeader}>
                            <Text style={styles.eventTypeIcon}>{eventTypeIcon}</Text>
                            <View style={styles.eventCardInfo}>
                              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                              <Text style={styles.eventCasino}>{event.casinoName}</Text>
                            </View>
                            <Text style={styles.eventDate}>{eventDate}</Text>
                          </View>
                          {event.description && (
                            <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              <Text style={styles.header}>
                Recent Wins & Reports
              </Text>
              <Text style={styles.subheader}>
                Share your jackpots and see what others are winning
              </Text>

              {reports.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol 
                    ios_icon_name="star" 
                    android_material_icon_name="star-border" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>
                    No reports yet
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to share a win!
                  </Text>
                </View>
              ) : (
                <View style={styles.reportsList}>
                  {reports.map((report) => {
                    const winAmountNum = typeof report.winAmount === 'string' ? parseFloat(report.winAmount) : report.winAmount;
                    const winAmountText = winAmountNum ? `$${winAmountNum.toLocaleString()}` : '';
                    const gameInfo = [report.manufacturer, report.gameTitle].filter(Boolean).join(' - ') || 'Unknown Slot';
                    
                    return (
                      <TouchableOpacity 
                        key={report.id} 
                        style={styles.reportCard}
                        onPress={() => handleViewWinDetail(report)}
                        onLongPress={() => handleLongPress(report)}
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
                          <Text style={styles.reportCasino}>
                            {report.casino}
                          </Text>
                          <View style={styles.reportWin}>
                            <Text style={styles.reportAmount}>
                              {winAmountText}
                            </Text>
                            <Text style={styles.reportType}>
                              {report.jackpotType}
                            </Text>
                          </View>
                          {report.notes && (
                            <Text style={styles.reportNotes} numberOfLines={2}>
                              {report.notes}
                            </Text>
                          )}
                          {/* Flag button for all users */}
                          <TouchableOpacity
                            style={styles.flagButton}
                            onPress={() => handleFlagReport(report)}
                          >
                            <IconSymbol
                              ios_icon_name="flag"
                              android_material_icon_name="flag"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.flagButtonText}>
                              Flag suspicious
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {isAdmin && (
                          <View style={styles.adminBadge}>
                            <IconSymbol
                              ios_icon_name="shield.fill"
                              android_material_icon_name="admin-panel-settings"
                              size={16}
                              color={colors.warning}
                            />
                            <Text style={styles.adminBadgeText}>
                              Long press to delete
                            </Text>
                          </View>
                        )}
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

        {/* Error Modal */}
        <Modal visible={!!errorMessage} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={36} color={colors.warning} />
              <Text style={styles.alertTitle}>Error</Text>
              <Text style={styles.alertMessage}>{errorMessage}</Text>
              <TouchableOpacity style={styles.alertButton} onPress={() => setErrorMessage(null)}>
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal visible={!!successMessage} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={36} color={colors.success} />
              <Text style={styles.alertTitle}>Success!</Text>
              <Text style={styles.alertMessage}>{successMessage}</Text>
              <TouchableOpacity style={[styles.alertButton, { backgroundColor: colors.success }]} onPress={() => setSuccessMessage(null)}>
                <Text style={styles.alertButtonText}>Great!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={36}
                color={colors.secondary}
              />
              <Text style={styles.alertTitle}>
                Remove this sighting?
              </Text>
              <Text style={styles.alertMessage}>
                This action cannot be undone. The report will be permanently deleted.
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                  onPress={handleCancelDelete}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalButtonTextCancel}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                  onPress={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalButtonTextConfirm}>
                    {deletingText || 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Flag Confirmation Modal */}
        <Modal visible={showFlagModal} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <IconSymbol
                ios_icon_name="flag.fill"
                android_material_icon_name="flag"
                size={36}
                color={colors.warning}
              />
              <Text style={styles.alertTitle}>
                Flag this report?
              </Text>
              <Text style={styles.alertMessage}>
                This will mark the report for admin review. Use this feature to report suspicious or inappropriate content.
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                  onPress={handleCancelFlag}
                  disabled={isFlagging}
                >
                  <Text style={styles.deleteModalButtonTextCancel}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                  onPress={handleConfirmFlag}
                  disabled={isFlagging}
                >
                  <Text style={styles.deleteModalButtonTextConfirm}>
                    {flaggingText || 'Flag Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Celebration Modal for New Badges */}
        <Modal visible={showCelebration} transparent animationType="fade">
          <View style={styles.celebrationOverlay}>
            <Animated.View style={[styles.celebrationCard, { transform: [{ scale: celebrationScale }] }]}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationTitle}>New Badge Unlocked!</Text>
              {newBadges.map((badge, index) => {
                const badgeName = badge.badgeName;
                const badgePoints = badge.points.toString();
                
                return (
                  <View key={index} style={styles.celebrationBadge}>
                    <Text style={styles.celebrationBadgeIcon}>🏆</Text>
                    <Text style={styles.celebrationBadgeName}>{badgeName}</Text>
                    <Text style={styles.celebrationBadgePoints}>+{badgePoints} points</Text>
                  </View>
                );
              })}
              <Text style={styles.celebrationPoints}>Total: +{pointsAwarded} points</Text>
              <TouchableOpacity style={styles.celebrationButton} onPress={handleCloseCelebration}>
                <Text style={styles.celebrationButtonText}>Awesome!</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Report Modal */}
        <Modal
          visible={showReportModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Report a Win
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImage }} 
                      style={styles.selectedImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <IconSymbol 
                      ios_icon_name="photo" 
                      android_material_icon_name="add-photo-alternate" 
                      size={48} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.imagePickerText}>
                      Tap to add photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Edit Photo Button */}
              {selectedImage && (
                <TouchableOpacity 
                  style={styles.editPhotoButton}
                  onPress={() => {
                    console.log('User tapped Edit Photo button, preserving form data');
                    router.push({
                      pathname: '/edit-photo',
                      params: {
                        imageUri: selectedImage,
                        returnRoute: '/(tabs)/(community)',
                      },
                    });
                  }}
                >
                  <IconSymbol
                    ios_icon_name="pencil.circle.fill"
                    android_material_icon_name="edit"
                    size={20}
                    color={colors.background}
                  />
                  <Text style={styles.editPhotoButtonText}>Edit Photo</Text>
                </TouchableOpacity>
              )}

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Manufacturer (Optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                  placeholder="e.g., IGT, Aristocrat"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Game Title (Optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={gameTitle}
                  onChangeText={setGameTitle}
                  placeholder="e.g., Buffalo Gold"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Casino *
                </Text>
                <View style={styles.casinoButtons}>
                  {casinos.map((casino) => (
                    <TouchableOpacity
                      key={casino.id}
                      style={[
                        styles.casinoButton,
                        selectedCasino === casino.name && styles.casinoButtonSelected
                      ]}
                      onPress={() => setSelectedCasino(casino.name)}
                    >
                      <Text style={[
                        styles.casinoButtonText,
                        selectedCasino === casino.name && styles.casinoButtonTextSelected
                      ]}>
                        {casino.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Win Amount (Optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={winAmount}
                  onChangeText={setWinAmount}
                  placeholder="e.g., 1250"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Jackpot Type (Optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={jackpotType}
                  onChangeText={setJackpotType}
                  placeholder="e.g., Minor, Major, Grand"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Notes (Optional)
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Share your experience..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleSubmitReport}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {submittingText || 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
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
  loadingHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  motivationalBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bannerText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: 32,
  },
  activityHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sortButtonTextActive: {
    color: colors.background,
  },
  disclaimerBox: {
    backgroundColor: colors.cardHighlight || colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  chartLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  chartLoadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  chartEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  chartEmptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    borderRadius: 16,
  },
  casinoListContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  casinoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  casinoListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  casinoListItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  casinoListItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  casinoListItemStats: {
    alignItems: 'flex-end',
  },
  casinoListItemWinAmount: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: 'bold',
  },
  casinoListItemReportCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  reportSightingButton: {
    backgroundColor: colors.gold || colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  reportSightingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  eventsSection: {
    marginBottom: 28,
  },
  eventsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  eventTypeIcon: {
    fontSize: 24,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  eventCasino: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
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
    position: 'relative',
  },
  reportImage: {
    width: '100%',
    height: 200,
  },
  reportDetails: {
    padding: 16,
  },
  reportGame: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  reportCasino: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  reportWin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reportAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reportType: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  reportNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.cardHighlight,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  adminBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 12,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  selectedImageContainer: {
    width: '100%',
    height: '100%',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  editPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  editPhotoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  casinoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  casinoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  casinoButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  casinoButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  casinoButtonTextSelected: {
    color: colors.background,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalButtonCancel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteModalButtonConfirm: {
    backgroundColor: colors.secondary,
  },
  deleteModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteModalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  celebrationBadge: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.cardHighlight,
    borderRadius: 16,
    width: '100%',
  },
  celebrationBadgeIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  celebrationBadgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  celebrationBadgePoints: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  celebrationPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 24,
  },
  celebrationButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  celebrationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
});
