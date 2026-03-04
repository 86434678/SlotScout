
import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal } from 'react-native';
import { apiGet, apiPost } from '@/utils/api';

interface CasinoMachine {
  id: string;
  casinoName: string;
  brand: string;
  gameTitle: string;
  denom: string;
  lastSeen: string;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
}

const DISCLAIMER = "Crowdsourced from players — floors change daily. Not official casino data.";

function resolveImageSource(source: string | number | undefined) {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.red,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  machineCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  machineHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  machineImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: 12,
  },
  machineInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: colors.gold,
    marginBottom: 4,
  },
  denom: {
    fontSize: 16,
    color: colors.red,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sawThisButton: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sawThisButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default function CasinoMachinesScreen() {
  const params = useLocalSearchParams();
  const casinoName = params.casinoName as string;
  const [machines, setMachines] = useState<CasinoMachine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<CasinoMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (casinoName) {
      loadMachines();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casinoName]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMachines(machines);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = machines.filter(
        (machine) =>
          machine.gameTitle.toLowerCase().includes(query) ||
          machine.brand.toLowerCase().includes(query) ||
          machine.denom.toLowerCase().includes(query)
      );
      setFilteredMachines(filtered);
    }
  }, [searchQuery, machines]);

  async function loadMachines() {
    try {
      setLoading(true);
      console.log('[API] Loading machines for casino:', casinoName);
      const response = await apiGet<{ machines: CasinoMachine[]; disclaimer: string }>(`/api/casino-directory/casinos/${encodeURIComponent(casinoName)}/machines`);
      console.log('[API] Loaded machines:', response);
      const machineList = response.machines || [];
      // Sort by lastSeen DESC (newest first) - backend should do this, but ensure it here too
      const sortedMachines = machineList.sort((a, b) => {
        const dateA = new Date(a.lastSeen).getTime();
        const dateB = new Date(b.lastSeen).getTime();
        return dateB - dateA; // Newest first
      });
      setMachines(sortedMachines);
      setFilteredMachines(sortedMachines);
    } catch (error) {
      console.error('[API] Error loading machines:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSawThis(machineId: string) {
    try {
      console.log('[API] User reported seeing machine:', machineId);
      const result = await apiPost<{ success: boolean; machine: CasinoMachine }>(`/api/casino-directory/machines/${machineId}/saw-this`, {});
      console.log('[API] Saw-this result:', result);
      setSuccessMessage('Thanks for reporting! Last seen date updated.');
      setShowSuccessModal(true);
      await loadMachines();
    } catch (error) {
      console.error('[API] Error reporting machine sighting:', error);
      setSuccessMessage('Failed to update. Please try again.');
      setShowSuccessModal(true);
    }
  }

  function formatLastSeen(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Last seen: Today';
    }
    if (diffDays === 1) {
      return 'Last seen: Yesterday';
    }
    if (diffDays < 7) {
      const daysText = `${diffDays} days ago`;
      return `Last seen: ${daysText}`;
    }
    const formattedDate = date.toLocaleDateString();
    return `Last seen: ${formattedDate}`;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: casinoName || 'Casino Machines',
          headerStyle: { backgroundColor: colors.cardBackground },
          headerTintColor: colors.gold,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View style={styles.header}>
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.gold}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search machines..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading machines...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredMachines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No machines found matching your search' : 'No machines reported at this casino yet'}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {filteredMachines.map((machine, index) => {
                const lastSeenText = formatLastSeen(machine.lastSeen);
                return (
                  <View key={index} style={styles.machineCard}>
                    <View style={styles.machineHeader}>
                      {machine.photoUrl && (
                        <Image
                          source={resolveImageSource(machine.photoUrl)}
                          style={styles.machineImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.machineInfo}>
                        <Text style={styles.gameTitle}>{machine.gameTitle}</Text>
                        <Text style={styles.brand}>{machine.brand}</Text>
                        <Text style={styles.denom}>{machine.denom}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.lastSeen}>{lastSeenText}</Text>
                    
                    {machine.notes && (
                      <Text style={styles.notes}>{machine.notes}</Text>
                    )}
                    
                    <TouchableOpacity
                      style={styles.sawThisButton}
                      onPress={() => handleSawThis(machine.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sawThisButtonText}>I Saw This Too</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thank You!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
