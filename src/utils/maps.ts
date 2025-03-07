import { Loader } from '@googlemaps/js-api-loader';

// Load the Google Maps API
export const loadGoogleMapsApi = async () => {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries: ['places', 'visualization']
  });

  try {
    return await loader.load();
  } catch (error) {
    console.error('Error loading Google Maps API:', error);
    throw error;
  }
};

// Function to fetch nearby places using Google Places API
// In a real app, this would be implemented on the server side to protect API key
export const fetchNearbyPlaces = async (
  map: google.maps.Map,
  position: google.maps.LatLng | google.maps.LatLngLiteral,
  radius: number = 1500,
  type: string = 'tourist_attraction'
) => {
  return new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
    try {
      // Check if Places API is available
      if (!window.google.maps.places) {
        throw new Error('Places API is not enabled for this API key');
      }

      const service = new google.maps.places.PlacesService(map);
      
      service.nearbySearch(
        {
          location: position,
          radius: radius,
          type: type
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// Convert Places API results to heatmap data
export const placesToHeatmapData = (
  places: google.maps.places.PlaceResult[]
): google.maps.visualization.WeightedLocation[] => {
  return places.map(place => {
    const location = place.geometry?.location;
    if (!location) return null;
    
    // Calculate weight based on rating and user_ratings_total if available
    const rating = place.rating || 3;
    const userRatingsTotal = place.user_ratings_total || 10;
    // Weight formula: higher ratings and more reviews = more popular = higher weight
    const weight = Math.min(10, (rating / 5) * Math.log10(userRatingsTotal + 1));
    
    return {
      location: location,
      weight: weight
    };
  }).filter(Boolean) as google.maps.visualization.WeightedLocation[];
};

// Generate fallback data when Places API is not available
export const generateFallbackHeatmapData = (
  center: google.maps.LatLng | google.maps.LatLngLiteral,
  radius: number = 0.05,
  points: number = 50
) => {
  const { lat, lng } = center;
  const heatmapData = [];
  
  for (let i = 0; i < points; i++) {
    // Random offset from center
    const latOffset = (Math.random() - 0.5) * radius * 2;
    const lngOffset = (Math.random() - 0.5) * radius * 2;
    
    // Add a bias towards the center (more weight near center)
    const distanceFromCenter = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);
    const weight = Math.max(0.2, 1 - (distanceFromCenter / radius));
    
    heatmapData.push({
      location: new google.maps.LatLng(lat + latOffset, lng + lngOffset),
      weight: weight * 10
    });
  }
  
  return heatmapData;
}; 