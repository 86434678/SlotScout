
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    type?: 'machine' | 'casino';
}

interface MapProps {
    markers?: MapMarker[];
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    style?: ViewStyle;
    showsUserLocation?: boolean;
    onMarkerPress?: (markerId: string) => void;
}

export const Map = ({
    markers = [],
    initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    },
    style,
    showsUserLocation = false,
    onMarkerPress,
}: MapProps) => {

    const mapHtml = useMemo(() => {
        const markersJson = JSON.stringify(markers);
        const centerLat = initialRegion.latitude;
        const centerLng = initialRegion.longitude;
        const zoom = Math.round(Math.log2(360 / initialRegion.latitudeDelta));

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { height: 100vh; width: 100vw; }
                .leaflet-routing-container {
                    background-color: white;
                    padding: 10px;
                    max-width: 200px;
                    opacity: 0.9;
                }
                .casino-marker {
                    background-color: #FFD700;
                    border: 3px solid #FFA500;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                .machine-marker {
                    background-color: #4A90E2;
                    border: 2px solid #2E5C8A;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);

                var markersData = ${markersJson};
                
                var casinoIcon = L.divIcon({
                    className: 'casino-marker',
                    html: '🎰',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -16]
                });
                
                var machineIcon = L.divIcon({
                    className: 'machine-marker',
                    html: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12]
                });
                
                markersData.forEach(function(m) {
                    var icon = m.type === 'casino' ? casinoIcon : machineIcon;
                    var marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(map);
                    
                    if (m.title || m.description) {
                         marker.bindPopup("<b>" + (m.title || "") + "</b><br>" + (m.description || ""));
                    }
                    
                    marker.on('click', function() {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
                        }
                    });
                });

                window.calculateRoute = function(startLat, startLng, endLat, endLng) {
                    if (window.routingControl) {
                        map.removeControl(window.routingControl);
                    }
                    window.routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(startLat, startLng),
                            L.latLng(endLat, endLng)
                        ],
                        routeWhileDragging: false,
                        showAlternatives: false,
                        addWaypoints: false,
                        fitSelectedRoutes: true
                    }).addTo(map);
                };
            </script>
        </body>
        </html>
        `;
    }, [markers, initialRegion]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerPress' && onMarkerPress) {
                onMarkerPress(data.id);
            }
        } catch (e) {
            console.error('Error parsing WebView message:', e);
        }
    }, [onMarkerPress]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={styles.webview}
                scrollEnabled={false}
                startInLoadingState={true}
                renderLoading={() => <View style={styles.loading}><ActivityIndicator /></View>}
                onMessage={handleMessage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 12,
        width: '100%',
        minHeight: 200,
        backgroundColor: '#e5e7eb',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
