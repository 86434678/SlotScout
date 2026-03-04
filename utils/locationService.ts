
import * as Location from 'expo-location';

// Major Las Vegas casino coordinates
export const VEGAS_CASINOS = [
  { name: 'MGM Grand', lat: 36.1024, lon: -115.1697, radius: 200 },
  { name: 'Bellagio', lat: 36.1126, lon: -115.1765, radius: 200 },
  { name: 'Caesars Palace', lat: 36.1162, lon: -115.1745, radius: 200 },
  { name: 'Venetian', lat: 36.1212, lon: -115.1697, radius: 200 },
  { name: 'Wynn', lat: 36.1271, lon: -115.1656, radius: 200 },
  { name: 'Aria', lat: 36.1068, lon: -115.1765, radius: 200 },
  { name: 'Planet Hollywood', lat: 36.1099, lon: -115.1708, radius: 200 },
  { name: 'Flamingo', lat: 36.1175, lon: -115.1721, radius: 200 },
  { name: 'Resorts World', lat: 36.1321, lon: -115.1656, radius: 200 },
  { name: 'Circa', lat: 36.1699, lon: -115.1424, radius: 200 },
  { name: 'Fremont', lat: 36.1695, lon: -115.1428, radius: 150 },
  { name: 'Golden Nugget', lat: 36.1698, lon: -115.1433, radius: 150 },
  { name: 'The D', lat: 36.1701, lon: -115.1426, radius: 150 },
  { name: 'Luxor', lat: 36.0955, lon: -115.1761, radius: 200 },
  { name: 'Mandalay Bay', lat: 36.0909, lon: -115.1744, radius: 200 },
  { name: 'New York-New York', lat: 36.1023, lon: -115.1739, radius: 200 },
  { name: 'Paris', lat: 36.1122, lon: -115.1708, radius: 200 },
  { name: 'Treasure Island', lat: 36.1247, lon: -115.1722, radius: 200 },
  { name: 'Mirage', lat: 36.1213, lon: -115.1742, radius: 200 },
  { name: 'Harrah\'s', lat: 36.1186, lon: -115.1709, radius: 200 },
];

/**
 * Request foreground location permission with custom message
 */
export async function requestLocationPermission(): Promise<boolean> {
  console.log('[Location] Requesting foreground location permission');
  
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      console.log('[Location] Permission granted');
      return true;
    } else {
      console.log('[Location] Permission denied');
      return false;
    }
  } catch (error) {
    console.error('[Location] Error requesting permission:', error);
    return false;
  }
}

/**
 * Get current location coordinates
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  console.log('[Location] Getting current position');
  
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    console.log('[Location] Current position:', location.coords.latitude, location.coords.longitude);
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('[Location] Error getting current position:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Detect nearest casino(s) based on current location
 */
export function detectNearestCasinos(
  latitude: number,
  longitude: number
): { casino: string; distance: number }[] {
  console.log('[Location] Detecting nearest casinos for:', latitude, longitude);
  
  const nearbyCasinos = VEGAS_CASINOS.map((casino) => {
    const distance = calculateDistance(latitude, longitude, casino.lat, casino.lon);
    return {
      casino: casino.name,
      distance,
      withinRadius: distance <= casino.radius,
    };
  })
    .filter((item) => item.withinRadius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ casino, distance }) => ({ casino, distance }));

  console.log('[Location] Nearby casinos:', nearbyCasinos);
  
  return nearbyCasinos;
}

/**
 * Get the single nearest casino name
 */
export function getNearestCasinoName(
  latitude: number,
  longitude: number
): string | null {
  const nearest = detectNearestCasinos(latitude, longitude);
  return nearest.length > 0 ? nearest[0].casino : null;
}
