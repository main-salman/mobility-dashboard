import { Loader } from '@googlemaps/js-api-loader';
import { TimeRange, City, TrafficFlowPoint } from '../types';

// Global cache for flow data to prevent redundant API calls
const flowDataCache: Record<
  string,
  {
    data: google.maps.DirectionsResult[] | null;
    timestamp: number;
    expiresAt: number;
  }
> = {};

// Cache timeout (10 minutes in milliseconds)
const CACHE_TIMEOUT = 10 * 60 * 1000;
// Time bucket size (10 minutes) for aggregating timestamps
const TIME_BUCKET_SIZE = 10 * 60 * 1000;

// Global caching and diagnostics
export const trafficFlowCache: Record<string, { data: any; timestamp: number; expiresAt: number }> =
  {};
export const apiDiagnostics: {
  routeResponses: Array<{
    timestamp: string;
    requestNumber: number;
    status: number;
    data: string;
  }>;
} = {
  routeResponses: [],
};

// Define the structure of a traffic flow point
export interface TrafficFlowPoint {
  id: string;
  position: google.maps.LatLngLiteral;
  nextPosition: google.maps.LatLngLiteral;
  bearing: number;
  progress: number;
  routeIndex: number;
  speed: number;
  intensity?: number; // Intensity level for visualization (0-2 scale, higher = more intense)
}

// Load the Google Maps API
export const loadGoogleMapsApi = async () => {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries: ['places', 'visualization', 'routes', 'geometry'],
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
  type: string = 'tourist_attraction',
  additionalTypes: string[] = []
): Promise<google.maps.places.PlaceResult[]> => {
  // Simply return empty array to avoid Places API calls completely
  console.log('Places API calls have been disabled to prevent deprecation warnings');
  return [];
};

// Convert Places API results to heatmap data
export const placesToHeatmapData = (
  places: google.maps.places.PlaceResult[]
): google.maps.visualization.WeightedLocation[] => {
  return places
    .map(place => {
      const location = place.geometry?.location;
      if (!location) return null;

      // Calculate weight based on rating and user_ratings_total if available
      const rating = place.rating || 3;
      const userRatingsTotal = place.user_ratings_total || 10;
      // Weight formula: higher ratings and more reviews = more popular = higher weight
      const weight = Math.min(10, (rating / 5) * Math.log10(userRatingsTotal + 1));

      return {
        location: location,
        weight: weight,
      };
    })
    .filter(Boolean) as google.maps.visualization.WeightedLocation[];
};

// Fetch place data based on selected time range
export const fetchDataForTimeRange = async (
  map: google.maps.Map,
  center: google.maps.LatLng | google.maps.LatLngLiteral,
  timeRange: TimeRange
): Promise<google.maps.visualization.WeightedLocation[]> => {
  // Return empty array to avoid Places API calls
  console.log('Places API calls have been disabled to prevent deprecation warnings');
  return [];
};

// Fetch place details for a specific location
export const fetchPlaceDetails = async (
  map: google.maps.Map,
  location: google.maps.LatLng | google.maps.LatLngLiteral
): Promise<google.maps.places.PlaceResult | null> => {
  // Simply return null to avoid Places API calls completely
  console.log('Places API calls have been disabled to prevent deprecation warnings');
  return null;
};

// Generate simulated traffic flow data
export const generateSimulatedTrafficFlow = (
  city: City,
  timestamp: number,
  timeRange: TimeRange
): TrafficFlowPoint[] => {
  // Number of flow points to generate
  const numPoints = 100;

  // Create a more realistic traffic pattern based on time of day
  const date = new Date(timestamp);
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Determine traffic intensity factor based on time and day
  let intensityFactor = 1.0;

  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
    // Rush hours
    intensityFactor = isWeekend ? 1.2 : 1.8;
  } else if (hour >= 10 && hour <= 15) {
    // Midday
    intensityFactor = 1.3;
  } else if (hour >= 19 && hour <= 22) {
    // Evening
    intensityFactor = 1.4;
  } else {
    // Night (low traffic)
    intensityFactor = 0.6;
  }

  // Generate points
  const points: TrafficFlowPoint[] = [];

  // Use city center as base and generate routes in different directions
  const center = city.center;

  // Create flow from various areas of the city
  for (let i = 0; i < numPoints; i++) {
    // Generate a random direction vector
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 0.01 + 0.005; // Random distance from center

    // Starting point (origin)
    const startLat = center.lat + Math.cos(angle) * distance;
    const startLng = center.lng + Math.sin(angle) * distance;

    // Ending point (destination)
    const endAngle = angle + (Math.random() * Math.PI) / 2 - Math.PI / 4; // Slightly varied direction
    const endDistance = Math.random() * 0.01 + 0.005;
    const endLat = startLat + Math.cos(endAngle) * endDistance;
    const endLng = startLng + Math.sin(endAngle) * endDistance;

    // Calculate bearing
    const bearing = (Math.atan2(endLng - startLng, endLat - startLat) * 180) / Math.PI;

    // Calculate point-specific intensity (variations around the general intensity)
    const pointIntensity = intensityFactor * (0.7 + Math.random() * 0.6);

    // Generate simulated speed based on intensity and time
    // Higher intensity generally means slower speeds (congestion)
    const speedFactor = Math.max(0.5, 1.5 - intensityFactor * 0.5);
    const speed = speedFactor * (0.7 + Math.random() * 0.6);

    // Create flow point
    points.push({
      id: `sim-${i}`,
      position: { lat: startLat, lng: startLng },
      nextPosition: { lat: endLat, lng: endLng },
      bearing: bearing,
      progress: Math.random(), // Random initial progress
      routeIndex: Math.floor(Math.random() * 5), // Simulate different route groups
      speed: speed,
      intensity: pointIntensity, // Add intensity for visualization
    });
  }

  return points;
};

// Add a helper function to check if Routes API is available
export const isRoutesApiAvailable = (): boolean => {
  try {
    // We specifically check if the key global objects and methods are defined
    // This doesn't guarantee the API will work, but it ensures the essential components are loaded
    if (
      typeof google !== 'undefined' &&
      google.maps &&
      google.maps.geometry &&
      google.maps.geometry.encoding &&
      typeof google.maps.geometry.encoding.decodePath === 'function'
    ) {
      console.log('Routes API dependencies appear to be available');
      return true;
    } else {
      // Log which specific dependencies are missing
      const diagnostics = {
        googleDefined: typeof google !== 'undefined',
        mapsDefined: typeof google !== 'undefined' && !!google.maps,
        geometryDefined: typeof google !== 'undefined' && !!google.maps && !!google.maps.geometry,
        encodingDefined:
          typeof google !== 'undefined' &&
          !!google.maps &&
          !!google.maps.geometry &&
          !!google.maps.geometry.encoding,
        decodePathDefined:
          typeof google !== 'undefined' &&
          !!google.maps &&
          !!google.maps.geometry &&
          !!google.maps.geometry &&
          typeof google.maps.geometry.encoding?.decodePath === 'function',
      };

      console.error('Routes API dependencies not available:', diagnostics);
      return false;
    }
  } catch (error) {
    console.error('Error checking Routes API availability:', error);
    return false;
  }
};

// Generate real traffic flow data using direct API calls
export const generateTrafficFlowData = async (
  map: google.maps.Map,
  city: City,
  timestamp: number,
  timeRange: TimeRange
): Promise<google.maps.DirectionsResult[] | null> => {
  console.log(`Generating traffic flow data for ${city.name} at timestamp ${timestamp}`);

  if (!isRoutesApiAvailable()) {
    console.error('Routes API is not available in Google Maps');
    return null;
  }

  // Try to use cached data first
  const cacheKey = `traffic_flow_${city.name}_${timeRange.name}_${timestamp}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (parsed.expiry > Date.now()) {
        console.log(`Using cached traffic flow data for ${city.name}`);
        return parsed.data;
      } else {
        console.log(`Cached traffic flow data for ${city.name} has expired`);
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.error('Error parsing cached traffic flow data:', error);
      localStorage.removeItem(cacheKey);
    }
  } else {
    console.log(`No valid cache found for ${city.name}, generating new data`);
  }

  const routePairs = generateRoutePairs(getPointsForCity(city), timestamp);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API Key is not defined');
    return null;
  }

  try {
    console.log(`Generating ${routePairs.length} routes for ${city.name}`);

    // Reset diagnostic info for this flow data generation
    apiDiagnostics.routeResponses = [];

    const results: google.maps.DirectionsResult[] = [];

    for (let i = 0; i < routePairs.length; i++) {
      const pair = routePairs[i];
      console.log(
        `Requesting route ${i + 1}/${routePairs.length}: ${JSON.stringify(pair.origin)} to ${JSON.stringify(pair.destination)}`
      );

      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: pair.origin.lat,
              longitude: pair.origin.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: pair.destination.lat,
              longitude: pair.destination.lng,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: 'en-US',
        units: 'IMPERIAL',
      };

      try {
        // Make a direct API call to the Routes API instead of using the client library
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.legs.distanceMeters,routes.legs.duration,routes.legs.staticDuration,routes.legs.polyline,routes.legs.steps,routes.legs.startLocation,routes.legs.endLocation,routes.legs.localizedValues,routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline,routes.description,routes.viewport,routes.warnings,routes.travelAdvisory,routes.localizedValues,routes.routeToken,routes.routeLabels',
          },
          body: JSON.stringify(requestBody),
        });

        // Store status for diagnostics
        const responseStatus = response.status;
        console.log(`Route request ${i + 1} status: ${responseStatus}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Route API error (${responseStatus}):`, errorText);
          throw new Error(`Routes API request failed with status ${responseStatus}: ${errorText}`);
        }

        const data = await response.json();

        // Store the raw response for debugging
        apiDiagnostics.routeResponses.push({
          timestamp: new Date().toLocaleTimeString(),
          requestNumber: i + 1,
          status: responseStatus,
          data: JSON.stringify(data),
        });

        console.log(
          `Route ${i + 1} data received:`,
          data.routes?.[0]?.distanceMeters ? `${data.routes[0].distanceMeters}m` : 'No distance',
          data.routes?.[0]?.duration ? `${data.routes[0].duration}` : 'No duration',
          data.routes?.[0]?.polyline?.encodedPolyline ? 'Has polyline' : 'No polyline',
          `${data.routes?.length || 0} routes found`
        );

        const result = convertRouteToDirectionsResult(data);
        results.push(result);
      } catch (error) {
        console.error(`Error fetching route ${i + 1}/${routePairs.length}:`, error);
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < routePairs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (results.length === 0) {
      console.error('No valid routes were generated');
      return null;
    }

    // Cache the results for 1 hour
    const cacheData = {
      data: results,
      expiry: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached traffic flow data for ${city.name}`);
    } catch (error) {
      console.error('Error caching traffic flow data:', error);
    }

    return results;
  } catch (error) {
    console.error('Error generating traffic flow data:', error);
    return null;
  }
};

// Helper function to get points for a city
function getPointsForCity(city: City): { name: string; position: google.maps.LatLngLiteral }[] {
  // Major points of interest for each city
  const cityPoints: Record<string, { name: string; position: google.maps.LatLngLiteral }[]> = {
    Vancouver: [
      { name: 'Downtown', position: { lat: 49.282, lng: -123.12 } },
      { name: 'Stanley Park', position: { lat: 49.3, lng: -123.14 } },
      { name: 'UBC', position: { lat: 49.26, lng: -123.245 } },
      { name: 'Metrotown', position: { lat: 49.225, lng: -123.003 } },
      { name: 'North Vancouver', position: { lat: 49.32, lng: -123.072 } },
    ],
    Madinah: [
      { name: 'Al-Masjid an-Nabawi', position: { lat: 24.467, lng: 39.611 } },
      { name: 'Quba Mosque', position: { lat: 24.435, lng: 39.619 } },
      { name: 'Prince Mohammed Airport', position: { lat: 24.55, lng: 39.705 } },
      { name: 'Uhud Mountain', position: { lat: 24.5, lng: 39.617 } },
    ],
    Delhi: [
      { name: 'Connaught Place', position: { lat: 28.6328, lng: 77.22 } },
      { name: 'India Gate', position: { lat: 28.6129, lng: 77.2295 } },
      { name: 'Red Fort', position: { lat: 28.6562, lng: 77.241 } },
      { name: 'Qutub Minar', position: { lat: 28.5244, lng: 77.1855 } },
      { name: 'IGI Airport', position: { lat: 28.5566, lng: 77.0988 } },
    ],
    Lahore: [
      { name: 'Lahore Fort', position: { lat: 31.588, lng: 74.3156 } },
      { name: 'Badshahi Mosque', position: { lat: 31.5918, lng: 74.3157 } },
      { name: 'Lahore Airport', position: { lat: 31.5216, lng: 74.4036 } },
      { name: 'Minar-e-Pakistan', position: { lat: 31.5926, lng: 74.3099 } },
      { name: 'Gaddafi Stadium', position: { lat: 31.5152, lng: 74.3352 } },
    ],
  };

  return cityPoints[city.name] || cityPoints['Vancouver'];
}

// Helper to generate route pairs based on time of day
function generateRoutePairs(
  points: { name: string; position: google.maps.LatLngLiteral }[],
  timestamp: number,
  maxRoutes: number = 3
): { origin: google.maps.LatLngLiteral; destination: google.maps.LatLngLiteral }[] {
  const pairs: { origin: google.maps.LatLngLiteral; destination: google.maps.LatLngLiteral }[] = [];

  // Select origin-destination pairs based on time of day
  const date = new Date(timestamp);
  const hour = date.getHours();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  if (hour >= 6 && hour <= 10) {
    // Morning rush - commute to downtown/center
    for (let i = 1; i < Math.min(points.length, maxRoutes + 1); i++) {
      pairs.push({
        origin: points[i].position,
        destination: points[0].position, // Downtown/center
      });
    }
  } else if (hour >= 15 && hour <= 19) {
    // Evening rush - commute from downtown/center
    for (let i = 1; i < Math.min(points.length, maxRoutes + 1); i++) {
      pairs.push({
        origin: points[0].position, // Downtown/center
        destination: points[i].position,
      });
    }
  } else {
    // Off-peak hours - mixed routes
    for (let i = 0; i < Math.min(points.length - 1, maxRoutes); i++) {
      pairs.push({
        origin: points[i].position,
        destination: points[i + 1].position,
      });
    }
  }

  return pairs;
}

// Helper to convert Routes API response to DirectionsResult
function convertRouteToDirectionsResult(data: any): google.maps.DirectionsResult {
  console.log('Converting route response to DirectionsResult');

  // Check if we have routes in the response
  if (!data || !data.routes || !data.routes.length) {
    console.error('No routes found in response', data);
    return { routes: [] } as google.maps.DirectionsResult;
  }

  const routes = data.routes.map((route: any, routeIndex: number) => {
    console.log(`Processing route ${routeIndex + 1} with distance: ${route.distanceMeters}m`);

    // Create legs from the route's legs
    const legs = route.legs.map((leg: any) => {
      // Create steps from the leg's steps
      const steps =
        leg.steps?.map((step: any) => {
          return {
            distance: {
              value: step.distanceMeters,
              text: step.localizedValues?.distance?.text || `${step.distanceMeters}m`,
            },
            duration: {
              value: parseInt(step.staticDuration || '0'),
              text: step.localizedValues?.staticDuration?.text || '0 mins',
            },
            end_location: new google.maps.LatLng(
              step.endLocation?.latLng?.latitude || 0,
              step.endLocation?.latLng?.longitude || 0
            ),
            start_location: new google.maps.LatLng(
              step.startLocation?.latLng?.latitude || 0,
              step.startLocation?.latLng?.longitude || 0
            ),
            instructions: step.navigationInstruction?.instructions || '',
            path: google.maps.geometry.encoding.decodePath(step.polyline?.encodedPolyline || ''),
            travel_mode: google.maps.TravelMode.DRIVING,
          } as google.maps.DirectionsStep;
        }) || [];

      // Create the leg
      return {
        distance: {
          value: leg.distanceMeters,
          text: leg.localizedValues?.distance?.text || `${leg.distanceMeters}m`,
        },
        duration: {
          value: parseInt(leg.staticDuration || '0'),
          text: leg.localizedValues?.duration?.text || '0 mins',
        },
        end_address: '',
        end_location: new google.maps.LatLng(
          leg.endLocation?.latLng?.latitude || 0,
          leg.endLocation?.latLng?.longitude || 0
        ),
        start_address: '',
        start_location: new google.maps.LatLng(
          leg.startLocation?.latLng?.latitude || 0,
          leg.startLocation?.latLng?.longitude || 0
        ),
        steps: steps,
        path: google.maps.geometry.encoding.decodePath(leg.polyline?.encodedPolyline || ''),
      } as unknown as google.maps.DirectionsLeg;
    });

    // Create the overview path from the route's polyline
    const overview_path = route.polyline?.encodedPolyline
      ? google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline)
      : [];

    console.log(
      `Route has ${overview_path.length} points in overview path and ${legs.length} legs`
    );

    // Create the route
    return {
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(
          route.viewport?.low?.latitude || 0,
          route.viewport?.low?.longitude || 0
        ),
        new google.maps.LatLng(
          route.viewport?.high?.latitude || 0,
          route.viewport?.high?.longitude || 0
        )
      ),
      legs: legs,
      overview_path: overview_path,
      overview_polyline: { points: route.polyline?.encodedPolyline || '' },
      warnings: [],
      waypoint_order: [],
    } as unknown as google.maps.DirectionsRoute;
  });

  console.log(`Successfully converted ${routes.length} routes`);
  return { routes } as google.maps.DirectionsResult;
}

// Create flow polylines from points (for simulated data)
export const createPolylinePathsFromPoints = (
  flowPoints: TrafficFlowPoint[],
  map: google.maps.Map
): google.maps.Polyline[] => {
  // Group points by route index
  const routeGroups: Record<number, google.maps.LatLngLiteral[]> = {};

  // Collect all unique positions for each route
  flowPoints.forEach(point => {
    if (!routeGroups[point.routeIndex]) {
      routeGroups[point.routeIndex] = [];
    }

    // Only add position if it doesn't exist yet
    const positions = routeGroups[point.routeIndex];
    const posExists = positions.some(
      pos => pos.lat === point.position.lat && pos.lng === point.position.lng
    );

    if (!posExists) {
      positions.push(point.position);
    }

    // Also add next position if it's the last point in a segment
    const nextPosExists = positions.some(
      pos => pos.lat === point.nextPosition.lat && pos.lng === point.nextPosition.lng
    );

    if (!nextPosExists) {
      positions.push(point.nextPosition);
    }
  });

  // Sort positions for each route to create a continuous path
  Object.keys(routeGroups).forEach(routeKey => {
    const routeIndex = parseInt(routeKey);
    const positions = routeGroups[routeIndex];

    // Sort by proximity if we have enough points
    if (positions.length > 2) {
      const sorted: google.maps.LatLngLiteral[] = [positions[0]];
      const remaining = [...positions.slice(1)];

      while (remaining.length > 0) {
        const lastPoint = sorted[sorted.length - 1];
        let closestIndex = 0;
        let closestDistance = Number.MAX_VALUE;

        // Find closest remaining point
        remaining.forEach((point, index) => {
          const distance = Math.sqrt(
            Math.pow(lastPoint.lat - point.lat, 2) + Math.pow(lastPoint.lng - point.lng, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        // Add closest point to sorted list
        sorted.push(remaining[closestIndex]);
        remaining.splice(closestIndex, 1);
      }

      routeGroups[routeIndex] = sorted;
    }
  });

  // Create polylines for each route
  const polylines: google.maps.Polyline[] = [];

  Object.keys(routeGroups).forEach(routeKey => {
    const routeIndex = parseInt(routeKey);
    const routePoints = routeGroups[routeIndex];

    if (routePoints.length >= 2) {
      const polyline = new google.maps.Polyline({
        path: routePoints,
        geodesic: true,
        strokeColor: getRouteColor(routeIndex),
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#ffffff',
            },
            offset: '0%',
            repeat: '80px',
          },
        ],
      });

      polylines.push(polyline);
    }
  });

  return polylines;
};

// Get color for routes
export const getRouteColor = (index: number): string => {
  const colors = [
    '#4285F4', // Google blue
    '#DB4437', // Google red
    '#F4B400', // Google yellow
    '#0F9D58', // Google green
    '#AB47BC', // Purple
    '#00ACC1', // Teal
    '#FF7043', // Deep orange
    '#9E9E9E', // Grey
  ];

  return colors[index % colors.length];
};

// Calculate the bearing (direction) between two points in degrees
const calculateBearing = (
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral
): number => {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
};

// Calculate distance between two points in meters
const getDistanceInMeters = (start: google.maps.LatLng, end: google.maps.LatLng): number => {
  return google.maps.geometry.spherical.computeDistanceBetween(start, end);
};

// Calculate speed based on duration and distance
const calculateSpeed = (durationSeconds: number, distanceMeters: number): number => {
  if (durationSeconds <= 0) return 1;
  // Speed in meters per second
  return distanceMeters / durationSeconds;
};
