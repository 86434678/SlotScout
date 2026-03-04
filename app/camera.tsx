
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, ActivityIndicator } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { apiUpload, apiPost } from '@/utils/api';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/contexts/AuthContext';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { requestLocationPermission, getCurrentLocation, getNearestCasinoName, detectNearestCasinos } from '@/utils/locationService';
import { useTripPass } from '@/contexts/TripPassContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  galleryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  permissionText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  locationModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  locationModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  locationModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  locationModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationModalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  locationModalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationModalButtonTextPrimary: {
    color: '#000',
  },
  locationModalButtonTextSecondary: {
    color: colors.text,
  },
});

async function compressImage(imageUri: string, aggressive = false) {
  console.log('[Camera] Compressing image smartly, aggressive:', aggressive);
  
  // Smart compression: resize to optimal dimensions for AI recognition
  // 1024px width is ideal for slot machine text/logo recognition
  // Higher quality (0.8) preserves text clarity for better AI results
  const manipResult = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: aggressive ? 800 : 1024 } }],
    { compress: aggressive ? 0.6 : 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  console.log('[Camera] Image compressed smartly');
  return manipResult.uri;
}

async function buildFormData(compressedUri: string) {
  console.log('[Camera] Building form data for platform:', Platform.OS);
  
  const formData = new FormData();
  const filename = compressedUri.split('/').pop() || 'photo.jpg';
  
  if (Platform.OS === 'web') {
    // On web, we need to fetch the blob and append it properly
    console.log('[Camera] Web platform - fetching blob from URI');
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    
    // Create a File object from the blob (web only)
    const file = new File([blob], filename, { type: 'image/jpeg' });
    formData.append('image', file);
    console.log('[Camera] Web - appended File object to FormData');
  } else {
    // On native, use the standard format
    console.log('[Camera] Native platform - using standard format');
    formData.append('image', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
  }
  
  return formData;
}

async function uploadAndIdentifySlot(imageUri: string) {
  console.log('[Camera] Starting upload and identification');
  
  try {
    const compressedUri = await compressImage(imageUri, false);
    const formData = await buildFormData(compressedUri);
    
    console.log('[Camera] Uploading image');
    const uploadResponse = await apiUpload('/api/upload/slot-image', formData);
    
    if (!uploadResponse.url) {
      throw new Error('Upload failed - no URL returned');
    }
    
    console.log('[Camera] Image uploaded, identifying slot');
    const identifyResponse = await apiPost('/api/identify-slot', {
      imageUrl: uploadResponse.url,
    });
    
    console.log('[Camera] Slot identified:', identifyResponse.id);
    return identifyResponse;
  } catch (error) {
    console.error('[Camera] Error in upload/identify:', error);
    throw error;
  }
}

export default function CameraScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const { user } = useAuth();
  const { incrementReportCount } = useTripPass();
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  console.log('[Camera] Screen mounted, camera permission:', cameraPermission?.granted);

  // Request location permission AFTER camera is ready
  useEffect(() => {
    if (cameraReady && !locationPermissionAsked) {
      console.log('[Camera] Camera ready, showing location permission modal');
      setShowLocationModal(true);
      setLocationPermissionAsked(true);
    }
  }, [cameraReady, locationPermissionAsked]);

  const handleLocationPermissionResponse = async (allow: boolean) => {
    console.log('[Camera] Location permission response:', allow);
    setShowLocationModal(false);
    
    if (allow) {
      const granted = await requestLocationPermission();
      console.log('[Camera] Location permission granted:', granted);
    } else {
      console.log('[Camera] Location permission denied by user');
    }
  };

  const toggleCameraFacing = () => {
    console.log('[Camera] Toggling camera facing');
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const processImage = async (imageUri: string) => {
    console.log('[Camera] Processing image:', imageUri);
    setIsProcessing(true);

    try {
      // Get location if permission granted
      let userLocation = null;
      let detectedCasinoName = null;
      let nearbyCasinos: { casino: string; distance: number }[] = [];

      const location = await getCurrentLocation();
      if (location) {
        console.log('[Camera] Got user location:', location.latitude, location.longitude);
        userLocation = location;
        detectedCasinoName = getNearestCasinoName(location.latitude, location.longitude);
        nearbyCasinos = detectNearestCasinos(location.latitude, location.longitude);
        console.log('[Camera] Detected casino:', detectedCasinoName);
        console.log('[Camera] Nearby casinos:', nearbyCasinos.length);
      }

      // Convert image to base64 for preview
      let photoBase64 = '';
      try {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const reader = new FileReader();
          
          photoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64 = base64data.includes(',') ? base64data.split(',')[1] : base64data;
              resolve(base64);
            };
            reader.readAsDataURL(blob);
          });
        } else {
          const FileSystem = require('expo-file-system/legacy');
          photoBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        console.log('[Camera] Image converted to base64');
      } catch (error) {
        console.error('[Camera] Failed to convert to base64:', error);
      }

      // Upload and identify
      const result = await uploadAndIdentifySlot(imageUri);
      
      // Increment report count after successful upload
      await incrementReportCount();
      console.log('[TripPass] Report count incremented');
      
      console.log('[Camera] Navigating to results with location data');
      router.push({
        pathname: '/results',
        params: {
          imageUri: result.imageUrl,
          photoBase64: photoBase64,
          identificationId: result.id,
          manufacturer: result.manufacturer || '',
          gameTitle: result.gameTitle || '',
          denomination: result.denomination || '',
          matches: result.matches ? JSON.stringify(result.matches) : '',
          ocr_text: result.ocr_text ? JSON.stringify(result.ocr_text) : '',
          has_strong_match: result.has_strong_match ? 'true' : 'false',
          suggestion: result.suggestion || '',
          userLatitude: userLocation?.latitude?.toString() || '',
          userLongitude: userLocation?.longitude?.toString() || '',
          detectedCasino: detectedCasinoName || '',
          nearbyCasinos: JSON.stringify(nearbyCasinos),
        },
      });
    } catch (error: any) {
      console.error('[Camera] Error processing image:', error);
      setErrorModalMessage(error?.message || 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log('[Camera] Camera ref not ready');
      return;
    }

    console.log('[Camera] Taking picture');
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      
      console.log('[Camera] Picture taken:', photo.uri);
      await processImage(photo.uri);
    } catch (error: any) {
      console.error('[Camera] Error taking picture:', error);
      setErrorModalMessage(error?.message || 'Failed to take picture. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    console.log('[Camera] Opening gallery');
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[Camera] Image selected from gallery');
        await processImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[Camera] Error picking from gallery:', error);
      setErrorModalMessage(error?.message || 'Failed to pick image. Please try again.');
    }
  };

  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Camera Permission',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
          }}
        />
        <View style={styles.permissionContainer}>
          <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={64} color={colors.textSecondary} />
          <Text style={styles.permissionText}>
            Camera permission is required to identify slot machines
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Snap a Slot',
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <CameraView 
          ref={cameraRef} 
          style={styles.camera} 
          facing={facing}
          onCameraReady={() => {
            console.log('[Camera] Camera ready');
            setCameraReady(true);
          }}
        >
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <IconSymbol ios_icon_name="arrow.triangle.2.circlepath.camera" android_material_icon_name="flip-camera-android" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={isProcessing}>
              <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={32} color="#000" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} disabled={isProcessing}>
              <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </CameraView>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Identifying slot machine...</Text>
          </View>
        )}

        {/* Location Permission Modal */}
        <Modal
          visible={showLocationModal}
          transparent
          animationType="fade"
          onRequestClose={() => handleLocationPermissionResponse(false)}
        >
          <View style={styles.locationModalOverlay}>
            <View style={styles.locationModalContent}>
              <Text style={styles.locationModalTitle}>Enable Location?</Text>
              <Text style={styles.locationModalText}>
                Allow SlotScout to access your location when taking photos? This auto-detects the casino to make reporting faster and improve community data.
              </Text>
              <View style={styles.locationModalButtons}>
                <TouchableOpacity
                  style={[styles.locationModalButton, styles.locationModalButtonSecondary]}
                  onPress={() => handleLocationPermissionResponse(false)}
                >
                  <Text style={[styles.locationModalButtonText, styles.locationModalButtonTextSecondary]}>
                    Not Now
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.locationModalButton, styles.locationModalButtonPrimary]}
                  onPress={() => handleLocationPermissionResponse(true)}
                >
                  <Text style={[styles.locationModalButtonText, styles.locationModalButtonTextPrimary]}>
                    Allow
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={!!errorModalMessage}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModalMessage(null)}
        >
          <View style={styles.locationModalOverlay}>
            <View style={styles.locationModalContent}>
              <Text style={styles.locationModalTitle}>Error</Text>
              <Text style={styles.locationModalText}>{errorModalMessage}</Text>
              <View style={styles.locationModalButtons}>
                <TouchableOpacity
                  style={[styles.locationModalButton, styles.locationModalButtonPrimary]}
                  onPress={() => setErrorModalMessage(null)}
                >
                  <Text style={[styles.locationModalButtonText, styles.locationModalButtonTextPrimary]}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
