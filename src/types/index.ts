export interface City {
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

export interface TimeRange {
  id: string;
  label: string;
  value: number; // in days
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