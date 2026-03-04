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

  // AUTO-REDIRECT TO FULL SIGN IN PAGE (email + Google + Apple + Sign Up)
  useEffect(() => {
    if (!user) {
      router.replace('/auth');   // <-- THIS IS THE KEY LINE
    }
  }, [user, router]);

  // Rest of your useEffects (keep exactly as you had them)
  useEffect(() => {
    if (user) {
      const init = async () => {
        setIsLoading(true);
        await Promise.all([loadReports(), loadCasinos(), loadActivityStats(), loadEvents()]);
        setIsLoading(false);
      };
      init();
    }
  }, [user]);

  // Handle edited image
  useEffect(() => {
    if (params.editedImageUri && typeof params.editedImageUri === 'string') {
      setSelectedImage(params.editedImageUri);
      if (!showReportModal) setShowReportModal(true);
    }
  }, [params.editedImageUri]);

  // ====================== YOUR ORIGINAL FUNCTIONS (paste yours here) ======================
  const loadReports = async () => { /* paste your exact loadReports */ };
  const handleRefresh = async () => { /* paste your exact */ };
  const loadCasinos = async () => { /* paste your exact */ };
  const loadActivityStats = async () => { /* paste your exact */ };
  const loadEvents = async () => { /* paste your exact */ };
  const handleBarPress = () => { /* paste your exact */ };
  const formatWinAmount = () => { /* paste your exact */ };
  const prepareChartData = () => { /* paste your exact */ };
  const resetForm = () => { /* paste your exact */ };
  const handleCloseCelebration = () => { /* paste your exact */ };
  const handleCloseModal = () => { /* paste your exact */ };
  const handleViewWinDetail = () => { /* paste your exact */ };
  const handleLongPress = () => { /* paste your exact */ };
  const handleConfirmDelete = () => { /* paste your exact */ };
  const handleFlagReport = () => { /* paste your exact */ };

  const handleAddReport = () => setShowReportModal(true);

  // FIXED PHOTO FLOW (unchanged)
  const handlePickImage = async () => { /* paste your exact handlePickImage */ };

  // FIXED SUBMIT (unchanged)
  const handleSubmitReport = async () => { /* paste your exact handleSubmitReport */ };

  // ====================== RETURN (now auto-redirects) ======================
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Community" }} />

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* PASTE ALL YOUR ORIGINAL JSX HERE (chart, events, reports list, + button, modals, celebration, etc.) */}
        {/* Everything from your old file stays exactly the same */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // Your existing styles go here
});
