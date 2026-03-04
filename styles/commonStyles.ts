import { StyleSheet } from 'react-native';

// SlotScout - Dark Casino Theme
export const colors = {
  // Dark casino theme
  background: '#0A0A0A',
  card: '#1A1A1A',
  cardBackground: '#1A1A1A', // alias for card
  cardHighlight: '#252525',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  
  // Casino gold/red accents
  primary: '#FFD700', // Gold
  gold: '#FFD700', // alias for primary
  primaryDark: '#B8860B',
  secondary: '#DC143C', // Crimson red
  red: '#DC143C', // alias for secondary
  accent: '#FF6B35', // Orange-red
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // UI elements
  border: '#2A2A2A',
  highlight: '#FFD70020',
  shadow: '#00000080',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHighlight: {
    backgroundColor: colors.cardHighlight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});


