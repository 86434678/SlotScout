
import { Map, MapMarker } from '@/components/Map';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, Platform } from 'react-native';
import { apiGet } from '@/utils/api';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';

interface MachineLocation {
  id: string;
  casinoName: string;
  brand: string;
  gameTitle: string;
  denom: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  photoUrl: string | null;
  notes: string | null;
}

interface CasinoLocation {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  area: string | null;
  reportedCount: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  controlButtonTextActive: {
    color: '#000',
  },
  detailModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  detailContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  detailNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default function MapScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<MachineLocation[]>([]);
  const [casinos, setCasinos] = useState<CasinoLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMachines, setShowMachines] = useState(true);
  const [showCasinos, setShowCasinos] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MachineLocation | CasinoLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadData();
    requestUserLocation();
  }, []);

  const requestUserLocation = async () => {
    console.log('[Map] Requesting user location');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('[Map] User location obtained:', location.coords);
      }
    } catch (error) {
      console.error('[Map] Error getting location:', error);
    }
  };

  const loadData = async () => {
    console.log('[Map] Loading map data');
    setLoading(true);

    try {
      // Load machine locations with safe fallback
      try {
        const machineData = await apiGet<MachineLocation[]>('/api/map/machines');
        // SAFE FALLBACK: Ensure machines is always an array
        const safeMachines = Array.isArray(machineData) ? machineData : [];
        setMachines(safeMachines);
        console.log('[Map] Loaded machines:', safeMachines.length);
      } catch (error) {
        console.error('[Map] Error loading machines:', error);
        // SAFE FALLBACK: Set empty array on error
        setMachines([]);
      }

      // Load casino locations with safe fallback
      try {
        const casinoData = await apiGet<CasinoLocation[]>('/api/map/casinos');
        // SAFE FALLBACK: Ensure casinos is always an array
        const safeCasinos = Array.isArray(casinoData) ? casinoData : [];
        setCasinos(safeCasinos);
        console.log('[Map] Loaded casinos:', safeCasinos.length);
      } catch (error) {
        console.error('[Map] Error loading casinos:', error);
        // SAFE FALLBACK: Set empty array on error
        setCasinos([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    console.log('[Map] Refreshing');
    setRefreshing(true);
    loadData();
  }, []);

  const handleMarkerPress = (markerId: string) => {
    console.log('[Map] Marker pressed:', markerId);
    
    // Find in machines
    const machine = machines.find((m) => m.id === markerId);
    if (machine) {
      setSelectedMarker(machine);
      return;
    }

    // Find in casinos
    const casino = casinos.find((c) => c.id === markerId);
    if (casino) {
      setSelectedMarker(casino);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const minutesText = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        return `${minutesText} ago`;
      }
      const hoursText = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      return `${hoursText} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      const daysText = `${diffDays} days`;
      return `${daysText} ago`;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    return `${monthName} ${dayNum}`;
  };

  const isMachineLocation = (marker: any): marker is MachineLocation => {
    return 'brand' in marker && 'gameTitle' in marker;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Map', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </>
    );
  }

  const markers: MapMarker[] = [
    ...(showMachines
      ? machines.map((m) => ({
          id: m.id,
          latitude: m.latitude,
          longitude: m.longitude,
          title: m.gameTitle,
          description: m.casinoName,
          color: colors.gold,
        }))
      : []),
    ...(showCasinos
      ? casinos
          .filter((c) => c.latitude && c.longitude)
          .map((c) => ({
            id: c.id,
            latitude: typeof c.latitude === 'string' ? parseFloat(c.latitude) : c.latitude!,
            longitude: typeof c.longitude === 'string' ? parseFloat(c.longitude) : c.longitude!,
            title: c.name,
            description: c.area || 'Casino',
            color: colors.red,
          }))
      : []),
  ];

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : {
        latitude: 36.1699,
        longitude: -115.1398,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

  return (
    <>
      <Stack.Screen options={{ title: 'Map', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <Map
            markers={markers}
            initialRegion={initialRegion}
            onMarkerPress={handleMarkerPress}
          />
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, showMachines && styles.controlButtonActive]}
            onPress={() => setShowMachines(!showMachines)}
          >
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={16}
              color={showMachines ? '#000' : colors.text}
            />
            <Text style={[styles.controlButtonText, showMachines && styles.controlButtonTextActive]}>
              Machines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, showCasinos && styles.controlButtonActive]}
            onPress={() => setShowCasinos(!showCasinos)}
          >
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="location-on"
              size={16}
              color={showCasinos ? '#000' : colors.text}
            />
            <Text style={[styles.controlButtonText, showCasinos && styles.controlButtonTextActive]}>
              Casinos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detail Modal */}
        <Modal
          visible={!!selectedMarker}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedMarker(null)}
        >
          <View style={styles.detailModal}>
            <View style={styles.detailContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {selectedMarker && isMachineLocation(selectedMarker)
                    ? selectedMarker.gameTitle
                    : selectedMarker?.name}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMarker(null)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {selectedMarker && isMachineLocation(selectedMarker) ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Casino</Text>
                    <Text style={styles.detailValue}>{selectedMarker.casinoName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand</Text>
                    <Text style={styles.detailValue}>{selectedMarker.brand}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Denomination</Text>
                    <Text style={styles.detailValue}>{selectedMarker.denom}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Seen</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedMarker.lastSeen)}</Text>
                  </View>
                  {selectedMarker.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailNotes}>{selectedMarker.notes}</Text>
                    </View>
                  )}
                </>
              ) : selectedMarker ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Area</Text>
                    <Text style={styles.detailValue}>{selectedMarker.area || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Machines Reported</Text>
                    <Text style={styles.detailValue}>{selectedMarker.reportedCount || 0}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
