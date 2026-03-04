
import React from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs = [
    {
      name: 'scan',
      route: '/(tabs)/scan' as const,
      label: 'Scan',
      icon: 'camera' as const,
    },
    {
      name: '(community)',
      route: '/(tabs)/(community)' as const,
      label: 'Community',
      icon: 'group' as const,
    },
    {
      name: 'leaderboards',
      route: '/(tabs)/leaderboards' as const,
      label: 'Leaderboards',
      icon: 'emoji-events' as const,
    },
    {
      name: 'map',
      route: '/(tabs)/map' as const,
      label: 'Map',
      icon: 'map' as const,
    },
  ];

  console.log('TabLayout: Tabs configured:', tabs.map(t => t.name));

  console.log('TabLayout: Rendering with platform:', Platform.OS);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="scan">
        <Stack.Screen name="scan" />
        <Stack.Screen name="(community)" />
        <Stack.Screen name="leaderboards" />
        <Stack.Screen name="map" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
