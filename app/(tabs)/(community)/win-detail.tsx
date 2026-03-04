
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { apiDelete } from '@/utils/api';

const { width } = Dimensions.get('window');

export default function WinDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const reportId = params.id as string;
  const imageUrl = params.imageUrl as string;
  const manufacturer = params.manufacturer as string;
  const gameTitle = params.gameTitle as string;
  const casino = params.casino as string;
  const winAmountStr = params.winAmount as string;
  const jackpotType = params.jackpotType as string;
  const notes = params.notes as string;
  const createdAt = params.createdAt as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const winAmountNum = winAmountStr ? parseFloat(winAmountStr) : 0;
  const winAmountText = winAmountNum ? `$${winAmountNum.toLocaleString()}` : 'No amount specified';
  const gameInfo = [manufacturer, gameTitle].filter(Boolean).join(' - ') || 'Unknown Slot';
  
  const dateObj = createdAt ? new Date(createdAt) : null;
  const dateText = dateObj ? dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  // Check if user is admin
  const isAdmin = user?.email?.endsWith('@ngcb.nv.gov') || false;

  console.log('WinDetailScreen: Viewing win detail for casino:', casino);

  const handleDeletePress = () => {
    console.log('Admin tapped delete button for report:', reportId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportId || !isAdmin) return;

    console.log('[API] Admin deleting community report:', reportId);
    setIsDeleting(true);

    try {
      await apiDelete(`/api/community-reports/${reportId}`);
      console.log('[API] Report deleted successfully');
      setShowDeleteModal(false);
      // Navigate back after successful delete
      router.back();
    } catch (error: any) {
      console.error('[API] Error deleting report:', error);
      setErrorMessage(error.message || 'Failed to delete report. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('Admin cancelled delete');
    setShowDeleteModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Win Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerBackTitle: 'Back',
          headerBackTitleVisible: true,
          headerRight: isAdmin ? () => (
            <TouchableOpacity
              onPress={handleDeletePress}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={24}
                color={colors.secondary || '#FF4444'}
              />
            </TouchableOpacity>
          ) : undefined,
        }}
      />
      
      {/* Error Modal */}
      <Modal visible={!!errorMessage} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={36} color={colors.warning || '#FFA500'} />
            <Text style={styles.alertTitle}>Error</Text>
            <Text style={styles.alertMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setErrorMessage(null)}>
              <Text style={styles.alertButtonText}>OK</Text>
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
              color={colors.secondary || '#FF4444'}
            />
            <Text style={styles.alertTitle}>Remove this sighting?</Text>
            <Text style={styles.alertMessage}>
              This action cannot be undone. The report will be permanently deleted.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                onPress={handleCancelDelete}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.deleteModalButtonTextConfirm}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          </View>

          {/* Win Amount Card */}
          <View style={styles.winCard}>
            <View style={styles.winHeader}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={32} 
                color={colors.primary} 
              />
              <Text style={styles.winLabel}>
                Win Amount
              </Text>
            </View>
            <Text style={styles.winAmount}>
              {winAmountText}
            </Text>
            {jackpotType ? (
              <Text style={styles.jackpotType}>
                {jackpotType}
              </Text>
            ) : null}
          </View>

          {/* Game Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>
              Slot Machine Details
            </Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <IconSymbol 
                  ios_icon_name="gamecontroller.fill" 
                  android_material_icon_name="videogame-asset" 
                  size={20} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Game
                </Text>
                <Text style={styles.detailValue}>
                  {gameInfo}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <IconSymbol 
                  ios_icon_name="building.2.fill" 
                  android_material_icon_name="location-city" 
                  size={20} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Casino
                </Text>
                <Text style={styles.detailValue}>
                  {casino}
                </Text>
              </View>
            </View>

            {dateText ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <IconSymbol 
                    ios_icon_name="calendar" 
                    android_material_icon_name="calendar-today" 
                    size={20} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    Date Reported
                  </Text>
                  <Text style={styles.detailValue}>
                    {dateText}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Notes Card */}
          {notes ? (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <IconSymbol 
                  ios_icon_name="text.bubble.fill" 
                  android_material_icon_name="chat-bubble" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.sectionTitle}>
                  Player Notes
                </Text>
              </View>
              <Text style={styles.notesText}>
                {notes}
              </Text>
            </View>
          ) : null}

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <IconSymbol 
              ios_icon_name="info.circle" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.textSecondary} 
            />
            <Text style={styles.disclaimerText}>
              This is a user-submitted report. Results are not guaranteed and are for entertainment purposes only.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.secondary || '#FF4444',
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
  content: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: colors.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  winCard: {
    backgroundColor: colors.card,
    margin: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  winHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  winLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  winAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  jackpotType: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  notesCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardHighlight,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
