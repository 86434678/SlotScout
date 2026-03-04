
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Privacy Policy
        </Text>
        <Text style={styles.updated}>
          Last Updated: January 2025
        </Text>

        <Text style={styles.sectionTitle}>
          1. Information We Collect
        </Text>
        <Text style={styles.paragraph}>
          SlotScout collects the following information:
        </Text>
        <Text style={styles.bulletPoint}>
          • Account information (email, name) when you sign up
        </Text>
        <Text style={styles.bulletPoint}>
          • Photos you upload of slot machines
        </Text>
        <Text style={styles.bulletPoint}>
          • Community reports you submit (casino, win amounts, notes)
        </Text>
        <Text style={styles.bulletPoint}>
          • Location data (only when you grant permission and take photos)
        </Text>
        <Text style={styles.bulletPoint}>
          • Usage data and analytics
        </Text>

        <Text style={styles.sectionTitle}>
          2. How We Use Your Information
        </Text>
        <Text style={styles.paragraph}>
          We use your information to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Identify slot machines using AI image recognition
        </Text>
        <Text style={styles.bulletPoint}>
          • Display community reports and wins
        </Text>
        <Text style={styles.bulletPoint}>
          • Improve our services and user experience
        </Text>
        <Text style={styles.bulletPoint}>
          • Send you important updates about the app
        </Text>

        <Text style={styles.sectionTitle}>
          3. Data Sharing
        </Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share data with:
        </Text>
        <Text style={styles.bulletPoint}>
          • AI service providers for image recognition
        </Text>
        <Text style={styles.bulletPoint}>
          • Cloud storage providers for photo hosting
        </Text>
        <Text style={styles.bulletPoint}>
          • Analytics services to improve the app
        </Text>

        <Text style={styles.sectionTitle}>
          4. Your Rights
        </Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Access your personal data
        </Text>
        <Text style={styles.bulletPoint}>
          • Request deletion of your account and data
        </Text>
        <Text style={styles.bulletPoint}>
          • Opt out of data collection
        </Text>
        <Text style={styles.bulletPoint}>
          • Update your information at any time
        </Text>

        <Text style={styles.sectionTitle}>
          5. Location Data
        </Text>
        <Text style={styles.paragraph}>
          Location data is used only for auto-tagging the casino when reporting machines. We collect your location only when you:
        </Text>
        <Text style={styles.bulletPoint}>
          • Grant location permission when prompted
        </Text>
        <Text style={styles.bulletPoint}>
          • Take a photo of a slot machine
        </Text>
        <Text style={styles.bulletPoint}>
          • Submit a machine location report
        </Text>
        <Text style={styles.paragraph}>
          Your location data is never shared or sold to third parties. It is used solely to improve the accuracy of casino detection and community reporting.
        </Text>

        <Text style={styles.sectionTitle}>
          6. Data Security
        </Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Children's Privacy
        </Text>
        <Text style={styles.paragraph}>
          SlotScout is intended for users 21 years and older. We do not knowingly collect information from children under 21.
        </Text>

        <Text style={styles.sectionTitle}>
          8. Disclaimer
        </Text>
        <Text style={styles.paragraph}>
          All statistics displayed in SlotScout are public aggregates from Nevada Gaming Control Board reports or user-reported data. This information is not a guarantee of future results and is provided for entertainment purposes only.
        </Text>

        <Text style={styles.sectionTitle}>
          9. Changes to This Policy
        </Text>
        <Text style={styles.paragraph}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app.
        </Text>

        <Text style={styles.sectionTitle}>
          10. Contact Us
        </Text>
        <Text style={styles.paragraph}>
          If you have questions about this privacy policy, please contact us at:
        </Text>
        <Text style={styles.contact}>
          support@slotscout.app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  updated: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  contact: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 24,
    marginTop: 8,
  },
});
