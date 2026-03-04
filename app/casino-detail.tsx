
import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';

interface SlotMachine {
  id: string;
  slotMachineId: string;
  brand: string;
  gameTitle: string;
  commonDenoms: string[];
  description: string | null;
  imageUrl: string | null;
  quantity: number | null;
  floorLocation: string | null;
  notes: string | null;
}

interface AllSlotMachine {
  id: string;
  brand: string;
  gameTitle: string;
  commonDenoms: string[];
  casinoExamples: string | null;
  description: string | null;
  imageUrl: string | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  addMachineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addMachineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 16,
  },
  machineCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  machineHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  machineImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  machineInfo: {
    flex: 1,
  },
  machineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  machineBrand: {
    fontSize: 14,
    color: colors.gold,
    marginBottom: 4,
  },
  denomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  denomBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  denomText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  machineDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  detailValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
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
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  machineActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  machineEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  machineEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  machineDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.error,
  },
  machineDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
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
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  alertCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  alertDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  alertDeleteText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.background,
  },
  editModalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addModalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  editModalSubtitle: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '600',
    marginBottom: 16,
  },
  editModalContent: {
    padding: 20,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  editSaveButtonDisabled: {
    opacity: 0.5,
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.background,
  },
  addSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addSearchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  addLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  addLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  addMachineList: {
    maxHeight: 220,
    marginHorizontal: 16,
  },
  addMachineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addMachineItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  addMachineItemInfo: {
    flex: 1,
  },
  addMachineBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addMachineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addDetailsSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default function CasinoDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const casinoId = params.casinoId as string;
  const casinoName = params.casinoName as string;

  const [machines, setMachines] = useState<SlotMachine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<SlotMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add machine modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [allSlotMachines, setAllSlotMachines] = useState<AllSlotMachine[]>([]);
  const [loadingAllMachines, setLoadingAllMachines] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [addFloorLocation, setAddFloorLocation] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [selectedSlotMachineId, setSelectedSlotMachineId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit machine modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<SlotMachine | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editFloorLocation, setEditFloorLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMachine, setDeletingMachine] = useState<SlotMachine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (casinoId) {
      loadMachines();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casinoId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMachines(machines);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = machines.filter(
        (machine) =>
          machine.gameTitle.toLowerCase().includes(query) ||
          machine.brand.toLowerCase().includes(query)
      );
      setFilteredMachines(filtered);
    }
  }, [searchQuery, machines]);

  async function loadMachines() {
    try {
      setLoading(true);
      console.log('[API] Loading machines for casino:', casinoId);
      const data = await apiGet<SlotMachine[]>(`/api/casinos/${casinoId}/slot-machines`);
      console.log('[API] Loaded machines:', data.length);
      setMachines(data);
      setFilteredMachines(data);
    } catch (error) {
      console.error('[API] Error loading machines:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllSlotMachines() {
    if (allSlotMachines.length > 0) return;
    try {
      setLoadingAllMachines(true);
      console.log('[API] Loading all slot machines for add modal');
      const data = await apiGet<AllSlotMachine[]>('/api/slot-machines');
      console.log('[API] Loaded all slot machines:', data.length);
      setAllSlotMachines(data);
    } catch (error) {
      console.error('[API] Error loading all slot machines:', error);
    } finally {
      setLoadingAllMachines(false);
    }
  }

  function handleOpenAddModal() {
    setShowAddModal(true);
    setAddSearchQuery('');
    setAddQuantity('');
    setAddFloorLocation('');
    setAddNotes('');
    setSelectedSlotMachineId(null);
    loadAllSlotMachines();
  }

  async function handleAddMachine() {
    if (!selectedSlotMachineId) {
      setAlertModal({ visible: true, title: 'Select Machine', message: 'Please select a slot machine to add.' });
      return;
    }
    setIsAdding(true);
    console.log(`[API] Adding slot machine ${selectedSlotMachineId} to casino ${casinoId}`);
    try {
      await apiPost(`/api/casinos/${casinoId}/slot-machines`, {
        slotMachineId: selectedSlotMachineId,
        quantity: addQuantity ? parseInt(addQuantity, 10) : null,
        floorLocation: addFloorLocation || null,
        notes: addNotes || null,
      });
      console.log('[API] Successfully added slot machine to casino');
      setShowAddModal(false);
      loadMachines();
    } catch (error: any) {
      console.error('[API] Error adding slot machine to casino:', error);
      setAlertModal({ visible: true, title: 'Error', message: error.message || 'Failed to add machine. It may already be listed.' });
    } finally {
      setIsAdding(false);
    }
  }

  function handleOpenEditModal(machine: SlotMachine) {
    setEditingMachine(machine);
    setEditQuantity(machine.quantity ? String(machine.quantity) : '');
    setEditFloorLocation(machine.floorLocation || '');
    setEditNotes(machine.notes || '');
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editingMachine) return;
    setIsSaving(true);
    console.log(`[API] Updating casino-slot relationship ${editingMachine.id}`);
    try {
      await apiPut(`/api/casinos/${casinoId}/slot-machines/${editingMachine.id}`, {
        quantity: editQuantity ? parseInt(editQuantity, 10) : null,
        floorLocation: editFloorLocation || null,
        notes: editNotes || null,
      });
      console.log('[API] Successfully updated casino-slot relationship');
      setShowEditModal(false);
      setEditingMachine(null);
      loadMachines();
    } catch (error: any) {
      console.error('[API] Error updating casino-slot relationship:', error);
      setAlertModal({ visible: true, title: 'Error', message: error.message || 'Failed to update machine details.' });
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenDeleteModal(machine: SlotMachine) {
    setDeletingMachine(machine);
    setShowDeleteModal(true);
  }

  async function handleDeleteMachine() {
    if (!deletingMachine) return;
    setIsDeleting(true);
    console.log(`[API] Removing slot machine ${deletingMachine.id} from casino ${casinoId}`);
    try {
      await apiDelete(`/api/casinos/${casinoId}/slot-machines/${deletingMachine.id}`);
      console.log('[API] Successfully removed slot machine from casino');
      setShowDeleteModal(false);
      setDeletingMachine(null);
      loadMachines();
    } catch (error: any) {
      console.error('[API] Error removing slot machine from casino:', error);
      setAlertModal({ visible: true, title: 'Error', message: error.message || 'Failed to remove machine.' });
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredAddMachines = addSearchQuery.trim()
    ? allSlotMachines.filter(
        (m) =>
          m.gameTitle.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
          m.brand.toLowerCase().includes(addSearchQuery.toLowerCase())
      )
    : allSlotMachines;

  const machineCount = machines.length;
  const machineCountText = `${machineCount} ${machineCount === 1 ? 'machine' : 'machines'}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: casinoName || 'Casino Details',
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTintColor: colors.gold,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleOpenAddModal}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertModal({ visible: false, title: '', message: '' })}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <IconSymbol
              ios_icon_name="trash.circle.fill"
              android_material_icon_name="delete"
              size={40}
              color={colors.error}
            />
            <Text style={styles.alertTitle}>Remove Machine</Text>
            <Text style={styles.alertMessage}>
              Remove {deletingMachine?.gameTitle} from {casinoName}? This won't delete the machine from the database.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={() => { setShowDeleteModal(false); setDeletingMachine(null); }}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertDeleteButton}
                onPress={handleDeleteMachine}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.alertDeleteText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Machine Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Machine Details</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditingMachine(null); }}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {editingMachine && (
              <ScrollView style={styles.editModalContent}>
                <Text style={styles.editModalSubtitle}>{editingMachine.brand} — {editingMachine.gameTitle}</Text>

                <Text style={styles.editLabel}>Quantity (Optional)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="e.g., 5"
                  placeholderTextColor={colors.textSecondary}
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  keyboardType="number-pad"
                />

                <Text style={styles.editLabel}>Floor Location (Optional)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="e.g., Main Floor, High Limit"
                  placeholderTextColor={colors.textSecondary}
                  value={editFloorLocation}
                  onChangeText={setEditFloorLocation}
                />

                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>
            )}
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => { setShowEditModal(false); setEditingMachine(null); }}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveButton, isSaving && styles.editSaveButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.editSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Machine Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalCard}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Add Slot Machine</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Search within add modal */}
            <View style={styles.addSearchContainer}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={18}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.addSearchInput}
                placeholder="Search slot machines..."
                placeholderTextColor={colors.textSecondary}
                value={addSearchQuery}
                onChangeText={setAddSearchQuery}
              />
            </View>

            {loadingAllMachines ? (
              <View style={styles.addLoadingContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={styles.addLoadingText}>Loading machines...</Text>
              </View>
            ) : (
              <ScrollView style={styles.addMachineList}>
                {filteredAddMachines.map((machine) => (
                  <TouchableOpacity
                    key={machine.id}
                    style={[
                      styles.addMachineItem,
                      selectedSlotMachineId === machine.id && styles.addMachineItemSelected,
                    ]}
                    onPress={() => setSelectedSlotMachineId(machine.id)}
                  >
                    <View style={styles.addMachineItemInfo}>
                      <Text style={styles.addMachineBrand}>{machine.brand}</Text>
                      <Text style={styles.addMachineTitle}>{machine.gameTitle}</Text>
                    </View>
                    {selectedSlotMachineId === machine.id && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={22}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedSlotMachineId && (
              <View style={styles.addDetailsSection}>
                <Text style={styles.editLabel}>Quantity (Optional)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="e.g., 5"
                  placeholderTextColor={colors.textSecondary}
                  value={addQuantity}
                  onChangeText={setAddQuantity}
                  keyboardType="number-pad"
                />
                <Text style={styles.editLabel}>Floor Location (Optional)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="e.g., Main Floor, High Limit"
                  placeholderTextColor={colors.textSecondary}
                  value={addFloorLocation}
                  onChangeText={setAddFloorLocation}
                />
                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={addNotes}
                  onChangeText={setAddNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editSaveButton,
                  (!selectedSlotMachineId || isAdding) && styles.editSaveButtonDisabled,
                ]}
                onPress={handleAddMachine}
                disabled={!selectedSlotMachineId || isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.editSaveText}>Add Machine</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading slot machines...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardRow}>
              <View>
                <Text style={styles.infoTitle}>Total Machines</Text>
                <Text style={styles.infoText}>{machineCountText}</Text>
              </View>
              <TouchableOpacity style={styles.addMachineButton} onPress={handleOpenAddModal}>
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={20}
                  color={colors.background}
                />
                <Text style={styles.addMachineButtonText}>Add Machine</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.textSecondary}
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

          <Text style={styles.sectionTitle}>Slot Machines</Text>

          {filteredMachines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No machines found matching your search' : 'No machines listed yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {!searchQuery && 'Tap the + button to add machines, or they will appear automatically when identified through photo recognition'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.emptyAddButton} onPress={handleOpenAddModal}>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={20}
                    color={colors.background}
                  />
                  <Text style={styles.emptyAddButtonText}>Add First Machine</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <React.Fragment>
              {filteredMachines.map((machine, index) => {
                const denoms = Array.isArray(machine.commonDenoms) 
                  ? machine.commonDenoms 
                  : typeof machine.commonDenoms === 'string' 
                    ? JSON.parse(machine.commonDenoms) 
                    : [];

                return (
                  <View key={index} style={styles.machineCard}>
                    <View style={styles.machineHeader}>
                      {machine.imageUrl && (
                        <Image
                          source={{ uri: machine.imageUrl }}
                          style={styles.machineImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.machineInfo}>
                        <Text style={styles.machineTitle}>{machine.gameTitle}</Text>
                        <Text style={styles.machineBrand}>{machine.brand}</Text>
                        <View style={styles.denomsContainer}>
                          {denoms.map((denom: string, denomIndex: number) => (
                            <View key={denomIndex} style={styles.denomBadge}>
                              <Text style={styles.denomText}>{denom}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>

                    {(machine.quantity || machine.floorLocation || machine.notes) && (
                      <View style={styles.machineDetails}>
                        {machine.quantity && (
                          <View style={styles.detailRow}>
                            <IconSymbol
                              ios_icon_name="number"
                              android_material_icon_name="tag"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.detailLabel}>Quantity:</Text>
                            <Text style={styles.detailValue}>{machine.quantity}</Text>
                          </View>
                        )}
                        {machine.floorLocation && (
                          <View style={styles.detailRow}>
                            <IconSymbol
                              ios_icon_name="location.fill"
                              android_material_icon_name="location-on"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{machine.floorLocation}</Text>
                          </View>
                        )}
                        {machine.notes && (
                          <View style={styles.detailRow}>
                            <IconSymbol
                              ios_icon_name="note.text"
                              android_material_icon_name="description"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.detailLabel}>Notes:</Text>
                            <Text style={styles.detailValue}>{machine.notes}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {machine.description && (
                      <Text style={styles.description}>{machine.description}</Text>
                    )}

                    {/* Machine action buttons */}
                    <View style={styles.machineActions}>
                      <TouchableOpacity
                        style={styles.machineEditButton}
                        onPress={() => handleOpenEditModal(machine)}
                      >
                        <IconSymbol
                          ios_icon_name="pencil.circle"
                          android_material_icon_name="edit"
                          size={16}
                          color={colors.gold}
                        />
                        <Text style={styles.machineEditText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.machineDeleteButton}
                        onPress={() => handleOpenDeleteModal(machine)}
                      >
                        <IconSymbol
                          ios_icon_name="trash.circle"
                          android_material_icon_name="delete"
                          size={16}
                          color={colors.error}
                        />
                        <Text style={styles.machineDeleteText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>
      )}
    </View>
  );
}
