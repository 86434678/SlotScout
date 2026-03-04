
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="scan">
        <Label>Scan</Label>
        <Icon sf={{ default: 'camera', selected: 'camera.fill' }} drawable="camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(community)">
        <Label>Community</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboards">
        <Label>Leaderboards</Label>
        <Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} drawable="emoji-events" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Label>Map</Label>
        <Icon sf={{ default: 'map', selected: 'map.fill' }} drawable="map" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
