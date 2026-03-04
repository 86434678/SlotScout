
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as ImageManipulator from 'expo-image-manipulator';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EditPhotoScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const imageUri = params.imageUri as string;
  const returnRoute = params.returnRoute as string || 'back';

  const [imageRotation, setImageRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gesture state for pinch-to-zoom and pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  console.log('EditPhotoScreen: Opening with imageUri:', imageUri);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${imageRotation}deg` },
      ],
    };
  });

  const handleRotateLeft = () => {
    console.log('User tapped Rotate Left');
    setImageRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    console.log('User tapped Rotate Right');
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    console.log('User tapped Reset');
    setImageRotation(0);
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleApply = async () => {
    console.log('User tapped Apply - processing image');
    setIsProcessing(true);

    try {
      const actions: ImageManipulator.Action[] = [];

      // Apply rotation if any
      if (imageRotation !== 0) {
        actions.push({ rotate: imageRotation });
      }

      // For now, we apply rotation only
      // In a more advanced implementation, you could calculate crop based on scale/translate
      // and add a crop action here

      let processedUri = imageUri;

      if (actions.length > 0) {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          actions,
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = result.uri;
      }

      console.log('Image processed successfully:', processedUri);

      // Return to the calling screen with the edited image
      if (returnRoute === 'back') {
        router.back();
      } else {
        router.replace({
          pathname: returnRoute as any,
          params: { editedImageUri: processedUri },
        });
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    console.log('User cancelled edit');
    router.back();
  };

  const overlayText = 'Drag & pinch to crop/resize photo';

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerCancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <TouchableOpacity
          onPress={handleApply}
          style={styles.headerButton}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.headerApplyText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageWrapper, animatedStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Crop frame overlay (visual guide) */}
        <View style={styles.cropFrameOverlay} pointerEvents="none">
          <View style={styles.cropFrame}>
            <View style={[styles.cropCorner, styles.cropCornerTopLeft]} />
            <View style={[styles.cropCorner, styles.cropCornerTopRight]} />
            <View style={[styles.cropCorner, styles.cropCornerBottomLeft]} />
            <View style={[styles.cropCorner, styles.cropCornerBottomRight]} />
          </View>
        </View>

        <View style={styles.overlayHint} pointerEvents="none">
          <Text style={styles.overlayText}>{overlayText}</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={handleRotateLeft}>
          <IconSymbol
            ios_icon_name="rotate.left"
            android_material_icon_name="rotate-left"
            size={28}
            color={colors.text}
          />
          <Text style={styles.toolButtonText}>Rotate Left</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={handleRotateRight}>
          <IconSymbol
            ios_icon_name="rotate.right"
            android_material_icon_name="rotate-right"
            size={28}
            color={colors.text}
          />
          <Text style={styles.toolButtonText}>Rotate Right</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={handleReset}>
          <IconSymbol
            ios_icon_name="arrow.counterclockwise"
            android_material_icon_name="refresh"
            size={28}
            color={colors.text}
          />
          <Text style={styles.toolButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    minWidth: 70,
  },
  headerCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerApplyText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropFrameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.5,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    position: 'relative',
  },
  cropCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cropCornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cropCornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cropCornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cropCornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayHint: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  toolButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
});
