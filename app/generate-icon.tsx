
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState } from 'react';
import { apiPost } from '@/utils/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const ICON_PROMPT = `Professional casino-themed app icon design:
- Solid black background (#000000 or #0A0A0A)
- Large bold metallic gold letter "S" in the center (color #FFD700)
- Modern bold font style (Montserrat ExtraBold or Bebas Neue aesthetic)
- Subtle golden glow or outline around the "S" for depth and dimension
- Clean minimalist design with high contrast
- Premium luxurious Vegas aesthetic
- No additional text, symbols, or clutter
- Optimized for small sizes (recognizable as app icon)
- Square format 1024x1024 pixels
- Suitable for iOS app icon with rounded corners applied by system`;

export default function GenerateIconScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);

  const showModal = (title: string, message: string, isError = false) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalIsError(isError);
    setModalVisible(true);
  };

  const handleGenerateIcon = async () => {
    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      console.log('[API] Generating SlotScout app icon via POST /api/generate-icon...');
      
      const response = await apiPost('/api/generate-icon', {
        prompt: ICON_PROMPT,
        size: 1024
      });

      if (response.imageUrl) {
        setGeneratedImageUrl(response.imageUrl);
        console.log('[API] Icon generated successfully:', response.imageUrl);
      } else {
        throw new Error('No image URL returned from API');
      }
    } catch (err: any) {
      console.error('[API] Error generating icon:', err);
      const errorMessage = err.message || 'Failed to generate icon. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIcon = async () => {
    if (!generatedImageUrl) return;

    try {
      console.log('[API] Downloading icon...');
      
      if (Platform.OS === 'web') {
        // Web: Open in new tab for download
        window.open(generatedImageUrl, '_blank');
      } else {
        // Mobile: Download and share
        const fileUri = FileSystem.documentDirectory + 'slotscout-icon.png';
        const downloadResult = await FileSystem.downloadAsync(generatedImageUrl, fileUri);
        
        if (downloadResult.status === 200) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(downloadResult.uri);
          } else {
            showModal('Success', `Icon saved to: ${downloadResult.uri}`, false);
          }
        }
      }
    } catch (err: any) {
      console.error('[API] Error downloading icon:', err);
      showModal('Download Error', 'Failed to download icon. Please try again.', true);
    }
  };

  const handleRegenerateIcon = () => {
    setGeneratedImageUrl(null);
    setError(null);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Generate App Icon',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: 'Back'
        }} 
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol
              ios_icon_name={modalIsError ? 'exclamationmark.triangle.fill' : 'checkmark.circle.fill'}
              android_material_icon_name={modalIsError ? 'error' : 'check-circle'}
              size={40}
              color={modalIsError ? colors.error : colors.success}
            />
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, modalIsError ? styles.modalButtonError : styles.modalButtonSuccess]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="photo.fill" 
            android_material_icon_name="image" 
            size={48} 
            color={colors.gold} 
          />
          <Text style={styles.title}>SlotScout App Icon</Text>
          <Text style={styles.subtitle}>
            Generate a professional casino-themed icon with a bold gold "S" on black background
          </Text>
        </View>

        {!generatedImageUrl && !loading && (
          <View style={styles.specSection}>
            <Text style={styles.specTitle}>Icon Specifications:</Text>
            <Text style={styles.specText}>• Size: 1024×1024 pixels</Text>
            <Text style={styles.specText}>• Background: Solid black (#000000)</Text>
            <Text style={styles.specText}>• Letter: Metallic gold "S" (#FFD700)</Text>
            <Text style={styles.specText}>• Style: Bold modern font with subtle glow</Text>
            <Text style={styles.specText}>• Format: PNG (iOS rounded corners applied by system)</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Generating your icon...</Text>
            <Text style={styles.loadingSubtext}>This may take 10-30 seconds</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="error" 
              size={48} 
              color={colors.error} 
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {generatedImageUrl && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Generated Icon:</Text>
            <View style={styles.iconPreview}>
              <Image 
                source={{ uri: generatedImageUrl }} 
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.instructionText}>
              Download this icon and replace assets/icon.png in your project
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {!generatedImageUrl && !loading && (
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateIcon}
            >
              <IconSymbol 
                ios_icon_name="sparkles" 
                android_material_icon_name="auto-awesome" 
                size={24} 
                color="#000" 
              />
              <Text style={styles.generateButtonText}>Generate Icon</Text>
            </TouchableOpacity>
          )}

          {generatedImageUrl && (
            <>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={handleDownloadIcon}
              >
                <IconSymbol 
                  ios_icon_name="arrow.down.circle.fill" 
                  android_material_icon_name="download" 
                  size={24} 
                  color="#000" 
                />
                <Text style={styles.downloadButtonText}>Download Icon</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={handleRegenerateIcon}
              >
                <IconSymbol 
                  ios_icon_name="arrow.clockwise" 
                  android_material_icon_name="refresh" 
                  size={24} 
                  color={colors.gold} 
                />
                <Text style={styles.regenerateButtonText}>Generate New Version</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  specSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  specTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 12,
  },
  specText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 20,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 20,
  },
  iconPreview: {
    width: 256,
    height: 256,
    backgroundColor: '#000',
    borderRadius: 56,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  generateButton: {
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  downloadButton: {
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  regenerateButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: colors.gold,
  },
  modalButtonError: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
