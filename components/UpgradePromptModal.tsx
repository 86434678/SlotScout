
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  feature: 'report' | 'map' | 'export' | 'filters';
  reportsUsed?: number;
  reportsLimit?: number;
}

const FEATURE_MESSAGES = {
  report: {
    title: 'Daily Limit Reached',
    message: 'You have used all 5 free reports today. Upgrade to Trip Pass for unlimited scans and reports!',
    icon: 'camera' as const,
  },
  map: {
    title: 'Map Access Locked',
    message: 'Full map access with pins, heatmaps, and filters is available with Trip Pass!',
    icon: 'map' as const,
  },
  export: {
    title: 'Export Feature Locked',
    message: 'Save and export your scan history with Trip Pass!',
    icon: 'download' as const,
  },
  filters: {
    title: 'Advanced Filters Locked',
    message: 'Unlock advanced directory filters with Trip Pass!',
    icon: 'tune' as const,
  },
};

export function UpgradePromptModal({ 
  visible, 
  onClose, 
  feature,
  reportsUsed,
  reportsLimit,
}: UpgradePromptModalProps) {
  const router = useRouter();
  
  const handleUpgrade = () => {
    console.log('[UpgradePrompt] User tapped Upgrade button');
    onClose();
    router.push('/trip-pass');
  };

  const featureMessage = FEATURE_MESSAGES[feature];
  const titleText = featureMessage.title;
  const messageText = feature === 'report' && reportsUsed !== undefined && reportsLimit !== undefined
    ? `You have used ${reportsUsed} of ${reportsLimit} free reports today. Upgrade to Trip Pass for unlimited scans!`
    : featureMessage.message;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconSymbol 
              ios_icon_name="lock.fill" 
              android_material_icon_name="lock" 
              size={48} 
              color={colors.primary} 
            />
          </View>
          
          <Text style={styles.title}>
            {titleText}
          </Text>
          
          <Text style={styles.message}>
            {messageText}
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={20} 
                color={colors.success} 
              />
              <Text style={styles.benefitText}>
                Unlimited photo scans
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={20} 
                color={colors.success} 
              />
              <Text style={styles.benefitText}>
                Full map access
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={20} 
                color={colors.success} 
              />
              <Text style={styles.benefitText}>
                Personal history & export
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={20} 
                color={colors.success} 
              />
              <Text style={styles.benefitText}>
                One-time $6.99 – no subscription
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={20} 
                color={colors.background} 
              />
              <Text style={styles.upgradeButtonText}>
                Upgrade to Trip Pass
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 24,
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  upgradeButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
