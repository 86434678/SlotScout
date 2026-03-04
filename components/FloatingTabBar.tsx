
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  
  const animatedValue = useSharedValue(0);

  // Improved active tab detection using segments
  const activeTabIndex = React.useMemo(() => {
    console.log('FloatingTabBar: Current pathname:', pathname);
    console.log('FloatingTabBar: Current segments:', segments);
    
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;
      const routeStr = tab.route as string;
      
      console.log(`FloatingTabBar: Checking tab ${index} (${tab.name}) with route ${routeStr}`);

      // Extract the group name from tab name (e.g., "(community)" -> "community")
      const groupMatch = tab.name.match(/\(([^)]+)\)/);
      const groupName = groupMatch ? groupMatch[1] : tab.name;

      // Check if any segment matches the group name or tab name
      const segmentMatch = segments.some(seg => {
        const segStr = String(seg);
        // Check for exact match or group match
        return segStr === groupName || 
               segStr === `(${groupName})` || 
               segStr === tab.name ||
               segStr.includes(groupName);
      });

      if (segmentMatch) {
        score = 100;
        console.log(`  -> Segment match! Score: ${score}`);
      }
      // Exact route match
      else if (pathname === routeStr) {
        score = 95;
        console.log(`  -> Exact pathname match! Score: ${score}`);
      }
      // Check if pathname starts with tab route (for nested routes)
      else if (pathname.startsWith(routeStr + '/') || pathname.startsWith(routeStr)) {
        score = 90;
        console.log(`  -> Starts with match! Score: ${score}`);
      }
      // Check if pathname contains the group name
      else if (pathname.includes(`/${groupName}`) || pathname.includes(`(${groupName})`)) {
        score = 85;
        console.log(`  -> Group name in pathname match (${groupName})! Score: ${score}`);
      }
      // Check if pathname contains the tab name
      else if (pathname.includes(tab.name)) {
        score = 80;
        console.log(`  -> Contains name match! Score: ${score}`);
      }
      // For routes with /(tabs)/ prefix, also check without it
      else if (routeStr.includes('/(tabs)/')) {
        const routeWithoutTabs = routeStr.replace('/(tabs)', '');
        if (pathname === routeWithoutTabs || pathname.startsWith(routeWithoutTabs + '/') || pathname.startsWith(routeWithoutTabs)) {
          score = 75;
          console.log(`  -> Route without tabs match! Score: ${score}`);
        }
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    console.log(`FloatingTabBar: Best match is tab ${bestMatch} (${bestMatch >= 0 ? tabs[bestMatch].name : 'none'}) with score ${bestMatchScore}`);

    // Default to first tab if no match found
    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, segments, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href) => {
    console.log('FloatingTabBar: Navigating to', route);
    router.push(route);
  };

  const tabWidth = (screenWidth - 48) / tabs.length; // Account for container padding

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint="dark"
          style={styles.blurContainer}
        >
          {/* Solid background overlay to ensure opacity */}
          <View style={styles.solidBackground} />
          
          {/* Gold underline indicator for active tab */}
          <Animated.View style={[styles.indicator, indicatorStyle, { width: tabWidth }]} />
          
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              const iconColor = isActive ? colors.primary : '#AAAAAA';
              const textColor = isActive ? '#FFFFFF' : '#888888';
              const iconSize = 28;

              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={styles.tab}
                    onPress={() => handleTabPress(tab.route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <IconSymbol
                        android_material_icon_name={tab.icon}
                        ios_icon_name={tab.icon}
                        size={iconSize}
                        color={iconColor}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: textColor },
                        isActive && styles.tabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  container: {
    width: screenWidth - 24,
    marginHorizontal: 12,
    marginBottom: Platform.select({
      ios: 8,
      android: 16,
      default: 16,
    }),
    alignSelf: 'center',
    pointerEvents: 'box-none',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)', // Subtle gold border
    backgroundColor: Platform.select({
      ios: 'rgba(10, 10, 10, 0.95)', // Increased opacity for consistency
      android: 'rgba(10, 10, 10, 0.95)',
      default: 'rgba(10, 10, 10, 0.95)',
    }),
    // Add subtle shadow/glow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    // Requested styling
    height: 90,
    paddingBottom: 30,
    paddingTop: 10,
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A', // Solid black background for all tabs
    opacity: 0.95, // Ensure it's not transparent
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.primary, // Gold underline
    borderRadius: 2,
    zIndex: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    zIndex: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5, // tabBarItemStyle
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    marginBottom: 5, // tabBarIconStyle
  },
  tabLabel: {
    fontSize: 12, // tabBarLabelStyle
    fontWeight: 'bold', // tabBarLabelStyle
    textAlign: 'center',
    marginBottom: 5, // tabBarLabelStyle
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
});
