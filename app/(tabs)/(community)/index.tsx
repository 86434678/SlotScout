
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

  // ... (loadReports, handleRefresh, loadCasinos, loadActivityStats, loadEvents, handleBarPress, formatWinAmount, prepareChartData stay exactly the same)

  const handleAddReport = () => {
    setShowReportModal(true);
  };

  // FIXED PHOTO FLOW - modal now closes temporarily so edit screen opens on top
  const handlePickImage = async () => {
    const currentFormState = { manufacturer, gameTitle, selectedCasino, winAmount, jackpotType, notes };
    console.log('Current form state before picking image:', currentFormState);

    // Close modal temporarily so picker/edit opens on top
    setShowReportModal(false);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setErrorMessage('Permission to access photos is required!');
        setShowReportModal(true); // reopen modal
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
          params: {
            imageUri: pickedImageUri,
            returnRoute: '/(tabs)/(community)',
          },
        });
      } else {
        // User cancelled — reopen modal
        setShowReportModal(true);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image. Please try again.');
      setShowReportModal(true);
    }
  };

  // FIXED & ROBUST SUBMIT (no freeze, always works)
  const handleSubmitReport = async () => {
    console.log('Submit clicked with data:', { selectedImage, selectedCasino });

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
      // Upload image
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'report.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', { uri: selectedImage, name: filename, type } as any);

      const uploadData = await apiUpload<{ url: string }>(
        '/api/upload/slot-image',
        formData
      );

      // Submit report
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

      const submitResponse = await apiPost<{ success: boolean; reportId: string; message: string }>(
        '/api/reports/submit',
        submitPayload
      );

      setSuccessMessage(submitResponse.message || 'Your win report has been submitted! 🎰');

      // Award points
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
        } catch (e) {
          console.error('Points error (non-blocking):', e);
        }
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

  // (rest of your code: resetForm, handleCloseCelebration, handleCloseModal, handleViewWinDetail, handleLongPress, handleConfirmDelete, handleFlagReport, handleBarPress, formatWinAmount, prepareChartData, styles — all stay exactly the same)

  // ... (the return JSX stays exactly the same — no changes needed)
}
