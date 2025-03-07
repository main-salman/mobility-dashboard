import { City, TimeRange } from '../types';

export const DEFAULT_CITIES: City[] = [
  {
    name: 'Vancouver',
    center: { lat: 49.2827, lng: -123.1207 },
    zoom: 12
  },
  {
    name: 'Madinah',
    center: { lat: 24.5247, lng: 39.5692 },
    zoom: 13
  },
  {
    name: 'Delhi',
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 11
  },
  {
    name: 'Lahore',
    center: { lat: 31.5204, lng: 74.3587 },
    zoom: 11
  }
];

export const TIME_RANGES: TimeRange[] = [
  { id: 'week', label: 'Past Week', value: 7 },
  { id: 'month', label: 'Past Month', value: 30 },
  { id: 'year', label: 'Past Year', value: 365 },
  { id: 'custom', label: 'Custom Range', value: 0 }
];

// Cultural sites for each city - these would be fetched from Google Places API in a real app
export const SAMPLE_CULTURAL_SITES = {
  'Vancouver': [
    { name: 'Stanley Park', lat: 49.3017, lng: -123.1417 },
    { name: 'Vancouver Art Gallery', lat: 49.2827, lng: -123.1207 },
    { name: 'Museum of Anthropology', lat: 49.2695, lng: -123.2587 }
  ],
  'Madinah': [
    { name: 'Prophet\'s Mosque', lat: 24.4672, lng: 39.6112 },
    { name: 'Quba Mosque', lat: 24.4397, lng: 39.6166 },
    { name: 'Al-Baqi Cemetery', lat: 24.4705, lng: 39.6150 }
  ],
  'Delhi': [
    { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
    { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
    { name: 'Humayun\'s Tomb', lat: 28.5933, lng: 77.2507 }
  ],
  'Lahore': [
    { name: 'Lahore Fort', lat: 31.5882, lng: 74.3156 },
    { name: 'Badshahi Mosque', lat: 31.5881, lng: 74.3143 },
    { name: 'Shalimar Gardens', lat: 31.5913, lng: 74.3804 }
  ]
};

// Function to generate mock density data
export const generateMockDensityData = (centerLat: number, centerLng: number, radius: number = 0.05, points: number = 50) => {
  const heatmapData = [];
  
  for (let i = 0; i < points; i++) {
    // Random offset from center
    const latOffset = (Math.random() - 0.5) * radius * 2;
    const lngOffset = (Math.random() - 0.5) * radius * 2;
    
    // Add a bias towards the center (more weight near center)
    const distanceFromCenter = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);
    const weight = Math.max(0.2, 1 - (distanceFromCenter / radius));
    
    heatmapData.push({
      location: new google.maps.LatLng(centerLat + latOffset, centerLng + lngOffset),
      weight: weight * 10
    });
  }
  
  return heatmapData;
};

// Simulate day/night crowd ratio (1.0 means equal, <1.0 means fewer people at night)
export const generateDayNightRatio = (baseRatio: number = 0.7) => {
  // Random variance between 0.6 and 1.2 times the base ratio
  return baseRatio * (0.6 + Math.random() * 0.6);
}; 