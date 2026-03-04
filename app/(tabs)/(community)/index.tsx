import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Modal, Animated, Dimensions, RefreshControl } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost, apiDelete, authenticatedPost, apiUpload } from '@/utils/api';
import { retryWithBackoff } from '@/utils/apiRetry';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Form state
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

  // Admin states
  const [reportToDelete, setReportToDelete] = useState<CommunityReport | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportToFlag, setReportToFlag] = useState<CommunityReport | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  const isAdmin = user?.email?.endsWith('@ngcb.nv.gov') || false;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadReports(), loadCasinos(), loadActivityStats(), loadEvents()]);
      setIsLoading(false);
    };
    init();
  }, []);

  // Handle edited image from edit-photo screen
  useEffect(() => {
    if (params.editedImageUri && typeof params.editedImageUri === 'string') {
      setSelectedImage(params.editedImageUri);
      if (!showReportModal) setShowReportModal(true);
    }
  }, [params.editedImageUri]);

  // ====================== YOUR ORIGINAL FUNCTIONS (unchanged) ======================
  const loadReports = async () => { /* your existing loadReports */ };
  const handleRefresh = async () => { /* your existing */ };
  const loadCasinos = async () => { /* your existing */ };
  const loadActivityStats = async () => { /* your existing */ };
  const loadEvents = async () => { /* your existing */ };
  const handleBarPress = () => { /* your existing */ };
  const formatWinAmount = () => { /* your existing */ };
  const prepareChartData = () => { /* your existing */ };
  const resetForm = () => { /* your existing */ };
  const handleCloseCelebration = () => { /* your existing */ };
  const handleCloseModal = () => { /* your existing */ };
  const handleViewWinDetail = () => { /* your existing */ };
  const handleLongPress = () => { /* your existing */ };
  const handleConfirmDelete = () => { /* your existing */ };
  const handleFlagReport = () => { /* your existing */ };
  // ==============================================================================

  const handleAddReport = () => {
    setShowReportModal(true);
  };

  // FIXED PHOTO FLOW
  const handlePickImage = async () => {
    const currentFormState = { manufacturer, gameTitle, selectedCasino, winAmount, jackpotType, notes };
    console.log('Current form state before picking image:', currentFormState);

    setShowReportModal(false);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setErrorMessage('Permission to access photos is required!');
        setShowReportModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const pickedImageUri = result.assets[0].uri;
        router.push({
          pathname: '/edit-photo',
          params: { imageUri: pickedImageUri, returnRoute: '/(tabs)/(community)' },
        });
      } else {
        setShowReportModal(true);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image. Please try again.');
      setShowReportModal(true);
    }
  };

  // FIXED & ROBUST SUBMIT
  const handleSubmitReport = async () => {
    console.log('Submit clicked with data:', { selectedImage, selectedCasino });

    if (!selectedImage) { setErrorMessage('Please select an image'); return; }
    if (!selectedCasino) { setErrorMessage('Please select a casino'); return; }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'report.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri: selectedImage, name: filename, type } as any);

      const uploadData = await apiUpload<{ url: string }>('/api/upload/slot-image', formData);

      const machine = [manufacturer.trim(), gameTitle.trim()].filter(Boolean).join(' - ') || 'Unknown Slot';
      const amount = winAmount.trim() ? parseFloat(winAmount) : 0;

      const submitPayload: any = {
        machine,
        casino: selectedCasino,
        amount,
        type: jackpotType.trim() || 'Standard',
        imageUrl: uploadData.url,
        notes: notes.trim() || undefined,
        userId: user?.id,
      };

      const submitResponse = await apiPost<{ success: boolean; reportId: string; message: string }>('/api/reports/submit', submitPayload);

      setSuccessMessage(submitResponse.message || 'Your win report has been submitted! 🎰');

      if (user) {
        try {
          const gamificationResult = await authenticatedPost('/api/gamification/award-points', {
            action: amount > 0 ? 'big_win' : 'machine_report',
            metadata: { hasPhoto: true, casinoName: selectedCasino, winAmount: amount },
          });
          if (gamificationResult.newBadges?.length > 0) {
            setNewBadges(gamificationResult.newBadges);
            setPointsAwarded(gamificationResult.pointsAwarded);
            setShowCelebration(true);
          }
        } catch (e) { console.error('Points error (non-blocking):', e); }
      }

      setShowReportModal(false);
      resetForm();
      loadReports();
      loadActivityStats();
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error.message?.includes('404') || error.status === 404) {
        setErrorMessage('Backend still syncing — wait 60 seconds and reload preview.');
      } else {
        setErrorMessage(error.message || 'Upload failed — try a smaller photo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================== RETURN STATEMENT (with signed-out fix) ======================
  return (
    <>
      <Stack.Screen options={{ title: "Community", headerShown: true }} />

      {/* SIGNED-OUT STATE – fixes the black screen */}
      {!user ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <IconSymbol name="person.2.fill" size={80} color={colors.primary} />
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 24, textAlign: 'center' }}>
            Join the SlotScout Community
          </Text>
          <Text style={{ fontSize: 17, color: colors.text, textAlign: 'center', marginTop: 16, lineHeight: 24 }}>
            Sign in to report big wins, earn points, climb the leaderboard, and see what other players are hitting.
          </Text>
          <TouchableOpacity 
            onPress={() => router.push('/auth')}
            style={{ backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12, marginTop: 40 }}
          >
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>Sign In with Apple</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* YOUR ORIGINAL SCROLLVIEW + MODALS + CHART + EVERYTHING ELSE GOES HERE */
        <ScrollView 
          style={{ flex: 1, backgroundColor: colors.background }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          {/* All your existing JSX: activity stats chart, events, reports list, + button, modals, celebration, etc. */}
          {/* (Copy your original return JSX from here down – it stays 100% unchanged) */}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Your existing styles here – unchanged
});
