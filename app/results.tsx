
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, apiPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect, useCallback } from 'react';

interface SlotMatch {
  slot_machine_id: string;
  brand: string;
  game_title: string;
  confidence: number;
  casino_examples: string;
  description: string;
}

interface ParSheet {
  id: string;
  gameTitle: string;
  brand: string;
  rtpRangeLow: number;
  rtpRangeHigh: number;
  volatility: string;
  typicalDenoms: string;
  notes: string;
}

interface NGCBStats {
  reportMonth: string;
  locationArea: string;
  denomination: string;
  avgRtpPercent: string | number;
  holdPercent: string | number;
  numMachines: string | number;
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
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: colors.card,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  hotTipCard: {
    backgroundColor: colors.cardHighlight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  hotTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hotTipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
    marginLeft: 8,
  },
  hotTipText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  rtpBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  rtpBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  actionButton: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const [parSheet, setParSheet] = useState<ParSheet | null>(null);
  const [ngcbStats, setNgcbStats] = useState<NGCBStats | null>(null);
  const [loading, setLoading] = useState(true);

  const manufacturer = params.manufacturer as string || '';
  const gameTitle = params.gameTitle as string || '';
  const denomination = params.denomination as string || '';
  const imageUri = params.imageUri as string || '';
  const hasStrongMatch = params.has_strong_match === 'true';

  useEffect(() => {
    loadData();
  }, [gameTitle, manufacturer]);

  const loadData = async () => {
    console.log('[Results] Loading par sheet and NGCB stats');
    setLoading(true);

    try {
      // Load par sheet if we have a game title
      if (gameTitle) {
        try {
          const parSheets = await apiGet<ParSheet[]>('/api/par-sheets');
          const matchingSheet = parSheets.find(
            (sheet) =>
              sheet.gameTitle.toLowerCase().includes(gameTitle.toLowerCase()) ||
              gameTitle.toLowerCase().includes(sheet.gameTitle.toLowerCase())
          );
          if (matchingSheet) {
            setParSheet(matchingSheet);
            console.log('[Results] Par sheet found:', matchingSheet);
          }
        } catch (error) {
          console.error('[Results] Error loading par sheet:', error);
        }
      }

      // Load NGCB stats
      try {
        const stats = await apiGet<NGCBStats[]>('/api/ngcb-stats');
        if (stats.length > 0) {
          // Get the most recent stats
          setNgcbStats(stats[0]);
          console.log('[Results] NGCB stats loaded');
        }
      } catch (error) {
        console.error('[Results] Error loading NGCB stats:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportWin = () => {
    console.log('[Results] Opening community report');
    router.push({
      pathname: '/(tabs)/(community)',
      params: {
        prefilledImage: imageUri,
        prefilledManufacturer: manufacturer,
        prefilledGameTitle: gameTitle,
      },
    });
  };

  const handleTakeAnother = () => {
    console.log('[Results] Taking another photo');
    router.back();
  };

  const renderHotTip = () => {
    if (!parSheet) return null;

    const avgRtp = (parSheet.rtpRangeLow + parSheet.rtpRangeHigh) / 2;
    const rtpText = `${avgRtp.toFixed(1)}%`;
    
    let tipText = '';
    if (avgRtp >= 96) {
      tipText = `This machine has an excellent RTP range of ${parSheet.rtpRangeLow}%-${parSheet.rtpRangeHigh}%, which is above average for Vegas slots. `;
    } else if (avgRtp >= 94) {
      tipText = `This machine has a solid RTP range of ${parSheet.rtpRangeLow}%-${parSheet.rtpRangeHigh}%, which is competitive for Vegas. `;
    } else {
      tipText = `This machine has an RTP range of ${parSheet.rtpRangeLow}%-${parSheet.rtpRangeHigh}%. `;
    }

    if (parSheet.volatility === 'High') {
      tipText += 'High volatility means bigger wins but less frequent. Best for players with larger bankrolls.';
    } else if (parSheet.volatility === 'Medium') {
      tipText += 'Medium volatility offers a balanced mix of win frequency and size.';
    } else {
      tipText += 'Low volatility means more frequent but smaller wins. Great for extended play sessions.';
    }

    return (
      <View style={styles.hotTipCard}>
        <View style={styles.hotTipHeader}>
          <IconSymbol ios_icon_name="flame.fill" android_material_icon_name="whatshot" size={24} color={colors.gold} />
          <Text style={styles.hotTipTitle}>Why This Machine is Hot</Text>
        </View>
        <Text style={styles.hotTipText}>{tipText}</Text>
        <View style={styles.rtpBadge}>
          <Text style={styles.rtpBadgeText}>RTP: {rtpText}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Slot Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.slotImage} resizeMode="cover" />
          </View>

          {/* Identification Results */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Identified Slot</Text>
            {manufacturer && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Manufacturer</Text>
                <Text style={styles.infoValue}>{manufacturer}</Text>
              </View>
            )}
            {gameTitle && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Game Title</Text>
                <Text style={styles.infoValue}>{gameTitle}</Text>
              </View>
            )}
            {denomination && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Denomination</Text>
                <Text style={styles.infoValue}>{denomination}</Text>
              </View>
            )}
            {!hasStrongMatch && (
              <Text style={[styles.infoLabel, { marginTop: 12, fontStyle: 'italic' }]}>
                Confidence: Low - Please verify the details
              </Text>
            )}
          </View>

          {/* Hot Tip */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : (
            renderHotTip()
          )}

          {/* NGCB Stats */}
          {ngcbStats && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vegas Stats</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Area Average RTP</Text>
                <Text style={styles.infoValue}>{ngcbStats.avgRtpPercent}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Report Month</Text>
                <Text style={styles.infoValue}>{ngcbStats.reportMonth}</Text>
              </View>
              <Text style={styles.disclaimer}>
                Data from Nevada Gaming Control Board public reports
              </Text>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity style={styles.actionButton} onPress={handleReportWin}>
            <Text style={styles.actionButtonText}>Report a Win</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleTakeAnother}>
            <Text style={styles.secondaryButtonText}>Scan Another Slot</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            All stats are public aggregates from NGCB reports or user-reported. Not a guarantee of future results. For entertainment only.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
