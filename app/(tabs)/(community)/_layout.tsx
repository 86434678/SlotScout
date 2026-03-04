
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerBackTitle: 'Back',
        headerBackTitleVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Community',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="win-detail"
        options={{
          title: 'Win Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="leaderboards"
        options={{
          title: 'Leaderboards',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="casino-sightings"
        options={{
          title: 'Casino Sightings',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
