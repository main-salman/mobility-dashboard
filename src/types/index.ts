export interface City {
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

// Movement types for different mobility categories
export type MovementType = 'pedestrian' | 'vehicle' | 'transit' | 'bicycle';

// Enhanced TimeRange with granularity to support fine-grained time controls
export interface TimeRange {
  id: string;
  label: string;
  value: number; // in days
  granularity?: number; // Time interval in minutes (15, 30, 60, etc.)
}

export interface MapOptions {
  city: City;
  timeRange: TimeRange;
  showHeatmap: boolean;
}

export interface PlaceData {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  crowdDensity: number; // 0-100 scale
  dayNightRatio?: number; // ratio of night to day crowd
}

export interface HeatMapData {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
  weight: number;
}

export interface TrafficFlowPoint {
  id: string;
  position: google.maps.LatLngLiteral;
  nextPosition: google.maps.LatLngLiteral;
  bearing: number; // Direction in degrees (0-360)
  progress: number; // Animation progress (0-1)
  routeIndex: number; // Which route this belongs to
  speed: number; // Speed in meters per second
  intensity?: number; // Intensity for visualization
  movementType?: MovementType; // Type of movement (pedestrian, vehicle, etc.)
}
