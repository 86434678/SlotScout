
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';

interface NGCBStatEntry {
  id: string;
  reportMonth: string;
  locationArea: string;
  denomination: string;
  avgRtpPercent: string | number;
  holdPercent: string | number;
  numMachines: string | number;
  notes?: string;
}

export default function MonthlyReportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const month = params.month as string;

  const [stats, setStats] = useState<NGCBStatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMonthlyReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const loadMonthlyReport = async () => {
    if (!month) {
      setError('No month specified');
      setLoading(false);
      return;
    }

    console.log(`[API] Loading monthly report for ${month}`);
    setLoading(true);
    setError(null);

    try {
      console.log(`[API] Requesting GET /api/ngcb-stats/report/${month}`);
      const data = await apiGet<NGCBStatEntry[]>(`/api/ngcb-stats/report/${month}`);
      setStats(data);
      console.log(`[API] Loaded ${data.length} stats for ${month}`);
    } catch (err: any) {
      console.error('[API] Error loading monthly report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNames[monthIndex] || month;
    return `${monthName} ${year}`;
  };

  const monthDisplay = month ? formatMonth(month) : 'Monthly Report';

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'NGCB Monthly Report',
            headerShown: true,
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'NGCB Monthly Report',
            headerShown: true,
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.errorContainer}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle" 
            android_material_icon_name="warning" 
            size={48} 
            color={colors.warning} 
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMonthlyReport}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Group stats by location area
  const groupedStats: { [area: string]: NGCBStatEntry[] } = {};
  stats.forEach(stat => {
    if (!groupedStats[stat.locationArea]) {
      groupedStats[stat.locationArea] = [];
    }
    groupedStats[stat.locationArea].push(stat);
  });

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'NGCB Monthly Report',
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="chart.bar.fill" 
            android_material_icon_name="bar-chart" 
            size={32} 
            color={colors.primary} 
          />
          <Text style={styles.title}>{monthDisplay}</Text>
          <Text style={styles.subtitle}>Nevada Gaming Control Board Statistics</Text>
        </View>

        {Object.keys(groupedStats).map(area => {
          const areaStats = groupedStats[area];
          return (
            <View key={area} style={styles.areaCard}>
              <Text style={styles.areaTitle}>{area}</Text>
              
              {areaStats.map(stat => {
                const rtpText = `${parseFloat(String(stat.avgRtpPercent)).toFixed(2)}%`;
                const holdText = `${parseFloat(String(stat.holdPercent)).toFixed(2)}%`;
                const machinesText = parseInt(String(stat.numMachines), 10).toLocaleString();
                
                return (
                  <View key={stat.id} style={styles.statRow}>
                    <View style={styles.statHeader}>
                      <Text style={styles.denomination}>{stat.denomination}</Text>
                    </View>
                    
                    <View style={styles.statDetails}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Avg RTP</Text>
                        <Text style={styles.statValue}>{rtpText}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Hold %</Text>
                        <Text style={styles.statValue}>{holdText}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Machines</Text>
                        <Text style={styles.statValue}>{machinesText}</Text>
                      </View>
                    </View>
                    
                    {stat.notes && (
                      <Text style={styles.statNotes}>{stat.notes}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimer}>
            Official public aggregates from Nevada Gaming Control Board. Not a guarantee. For entertainment only.
          </Text>
        </View>
      </View>
    </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  areaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  statRow: {
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: {
    marginBottom: 12,
  },
  denomination: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
  },
  statNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  disclaimerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },
});
