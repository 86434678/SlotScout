
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTripPass } from '@/contexts/TripPassContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function TripPassScreen() {
  const router = useRouter();
  const { isTripPassActive, isAnnualActive, purchaseTripPass, purchaseAnnualSubscription, restorePurchases } = useTripPass();
  const [isPurchasingTripPass, setIsPurchasingTripPass] = useState(false);
  const [isPurchasingAnnual, setIsPurchasingAnnual] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasPremium = isTripPassActive || isAnnualActive;

  console.log('[TripPass] Rendering purchase screen, tripPass:', isTripPassActive, 'annual:', isAnnualActive);

  const handlePurchaseTripPass = async () => {
    console.log('[TripPass] User tapped Buy Trip Pass button');
    setIsPurchasingTripPass(true);
    
    try {
      await purchaseTripPass();
      console.log('[TripPass] Trip Pass purchase successful');
      setSuccessMessage('Trip Pass Activated! You now have unlimited access to all premium features. Enjoy your Vegas trip! 🎉');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[TripPass] Purchase failed:', error);
      setErrorMessage(error.message || 'Purchase failed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsPurchasingTripPass(false);
    }
  };

  const handlePurchaseAnnual = async () => {
    console.log('[TripPass] User tapped Buy Annual Subscription button');
    setIsPurchasingAnnual(true);
    
    try {
      await purchaseAnnualSubscription();
      console.log('[TripPass] Annual subscription purchase successful');
      setSuccessMessage('Annual Subscription Activated! You now have unlimited access for the next year. Welcome to premium! 🎉');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[TripPass] Annual purchase failed:', error);
      setErrorMessage(error.message || 'Purchase failed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsPurchasingAnnual(false);
    }
  };

  const handleRestore = async () => {
    console.log('[TripPass] User tapped Restore Purchases button');
    setIsRestoring(true);
    
    try {
      await restorePurchases();
      console.log('[TripPass] Restore successful');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[TripPass] Restore failed:', error);
      setErrorMessage(error.message || 'Restore failed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    router.back();
  };

  const tripPassButtonText = isPurchasingTripPass ? 'Processing...' : 'Buy Trip Pass - $6.99';
  const annualButtonText = isPurchasingAnnual ? 'Processing...' : 'Subscribe - $29.99/year';
  const restoreButtonText = isRestoring ? 'Restoring...' : 'Restore Purchases';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trip Pass',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="star.circle.fill" 
                android_material_icon_name="stars" 
                size={80} 
                color={colors.primary} 
              />
            </View>
            <Text style={styles.heroTitle}>
              Unlock Unlimited Access
            </Text>
            <Text style={styles.heroSubtitle}>
              Choose Your Plan
            </Text>
          </View>

          {/* Already Active Badge */}
          {hasPremium && (
            <View style={styles.activeBadge}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.success} 
              />
              <Text style={styles.activeBadgeText}>
                {isTripPassActive ? 'Trip Pass Active' : 'Annual Subscription Active'}
              </Text>
            </View>
          )}

          {/* Benefits List */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>
              What You Get
            </Text>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="infinity" 
                android_material_icon_name="all-inclusive" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Unlimited Photo Scans
                </Text>
                <Text style={styles.benefitDescription}>
                  Scan as many slot machines as you want. No daily limits.
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="chart.bar.fill" 
                android_material_icon_name="bar-chart" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Unlimited Machine Reports
                </Text>
                <Text style={styles.benefitDescription}>
                  Get detailed reports with NGCB stats for every machine.
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="map.fill" 
                android_material_icon_name="map" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Full Map Access
                </Text>
                <Text style={styles.benefitDescription}>
                  View all casino pins, heatmaps, and nearby machine filters.
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Priority Badges
                </Text>
                <Text style={styles.benefitDescription}>
                  Special icon on your profile and top placement in leaderboards.
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="clock.arrow.circlepath" 
                android_material_icon_name="history" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Personal History & Export
                </Text>
                <Text style={styles.benefitDescription}>
                  Save and view all past scans, reports, and wins in "My Trips".
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <IconSymbol 
                ios_icon_name="slider.horizontal.3" 
                android_material_icon_name="tune" 
                size={32} 
                color={colors.primary} 
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  Advanced Directory Filters
                </Text>
                <Text style={styles.benefitDescription}>
                  Filter by "Nearby only", "Recent reports", "Aristocrat/IGT only".
                </Text>
              </View>
            </View>
          </View>

          {/* Purchase Options */}
          {!hasPremium && (
            <>
              {/* Trip Pass Option */}
              <View style={styles.purchaseOption}>
                <View style={styles.purchaseOptionHeader}>
                  <Text style={styles.purchaseOptionTitle}>
                    Trip Pass
                  </Text>
                  <Text style={styles.purchaseOptionPrice}>
                    $6.99
                  </Text>
                </View>
                <Text style={styles.purchaseOptionSubtitle}>
                  One-time purchase • Unlimited for all your future Vegas trips
                </Text>
                <TouchableOpacity 
                  style={styles.purchaseButton} 
                  onPress={handlePurchaseTripPass}
                  disabled={isPurchasingTripPass}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPurchasingTripPass ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <>
                        <IconSymbol 
                          ios_icon_name="cart.fill" 
                          android_material_icon_name="shopping-cart" 
                          size={24} 
                          color={colors.background} 
                        />
                        <Text style={styles.purchaseButtonText}>
                          {tripPassButtonText}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Annual Subscription Option */}
              <View style={styles.purchaseOption}>
                <View style={styles.purchaseOptionHeader}>
                  <Text style={styles.purchaseOptionTitle}>
                    Annual Subscription
                  </Text>
                  <Text style={styles.purchaseOptionPrice}>
                    $29.99/year
                  </Text>
                </View>
                <Text style={styles.purchaseOptionSubtitle}>
                  Auto-renewing • Best value for frequent visitors
                </Text>
                <TouchableOpacity 
                  style={styles.purchaseButton} 
                  onPress={handlePurchaseAnnual}
                  disabled={isPurchasingAnnual}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.secondary, '#8B0000']}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPurchasingAnnual ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <>
                        <IconSymbol 
                          ios_icon_name="calendar.circle.fill" 
                          android_material_icon_name="event" 
                          size={24} 
                          color={colors.background} 
                        />
                        <Text style={styles.purchaseButtonText}>
                          {annualButtonText}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Restore Button */}
          <TouchableOpacity 
            style={styles.restoreButton} 
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.8}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.restoreButtonText}>
                {restoreButtonText}
              </Text>
            )}
          </TouchableOpacity>

          {/* Disclaimers */}
          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimer}>
              ✓ One-time purchase – no recurring charges
            </Text>
            <Text style={styles.disclaimer}>
              ✓ Lifetime access for the current user
            </Text>
            <Text style={styles.disclaimer}>
              ✓ For entertainment only
            </Text>
            <Text style={styles.disclaimerSmall}>
              All stats are public aggregates from NGCB reports or user-reported. Not a guarantee of future results. For entertainment only.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check-circle" 
              size={64} 
              color={colors.success} 
            />
            <Text style={styles.modalTitle}>
              Success!
            </Text>
            <Text style={styles.modalMessage}>
              {successMessage}
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>
                Start Exploring
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={64} 
              color={colors.warning} 
            />
            <Text style={styles.modalTitle}>
              Purchase Failed
            </Text>
            <Text style={styles.modalMessage}>
              {errorMessage}
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroPrice: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.success,
    gap: 12,
  },
  activeBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  purchaseOption: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  purchaseOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseOptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  purchaseOptionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  purchaseOptionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  restoreButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  disclaimerSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  disclaimer: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  disclaimerSmall: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
});
