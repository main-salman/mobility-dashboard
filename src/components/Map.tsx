import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { City, TimeRange } from '../types';
import { generateMockDensityData, SAMPLE_CULTURAL_SITES } from '../utils/data';
import { fetchNearbyPlaces, placesToHeatmapData } from '../utils/maps';

const libraries: ("places" | "visualization")[] = ["places", "visualization"];

const containerStyle = {
  width: '100%',
  height: '70vh'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  clickableIcons: false, // Improve performance
  gestureHandling: 'cooperative',
};

interface MapProps {
  selectedCity: City;
  selectedTimeRange: TimeRange;
  currentTimestamp?: number; // Timestamp from the time slider
  shouldAnimateHeatmap?: boolean;
}

const Map = ({ 
  selectedCity, 
  selectedTimeRange, 
  currentTimestamp,
  shouldAnimateHeatmap = false
}: MapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ''],
    nonce: undefined,
    language: 'en',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const heatmapDataRef = useRef<google.maps.visualization.WeightedLocation[]>([]);

  // Memoize map options to prevent unnecessary re-renders
  const mapOptionsMemo = useMemo(() => ({
    ...mapOptions,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  }), []);

  // Initialize the map - using useCallback to prevent recreation on each render
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);

    // Initialize info window only once
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Delay setting as initialized to ensure all resources are loaded
    setTimeout(() => setIsMapInitialized(true), 500);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  // Generate heatmap data based on city center and timestamp
  const generateTimeBasedHeatmapData = useCallback((centerLat: number, centerLng: number, timestamp: number) => {
    // In a real app, this would fetch data for the specific timestamp from an API
    // For demo, we'll generate data with variations based on time
    
    // Use timestamp to get hour of day (0-23)
    const date = new Date(timestamp);
    const hourOfDay = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base multiplier for time of day
    let pointMultiplier;
    let radiusMultiplier;
    
    // Create realistic crowd patterns based on time of day
    if (hourOfDay >= 0 && hourOfDay < 6) {
      // Late night/early morning (12am-6am)
      pointMultiplier = 0.3;
      radiusMultiplier = 1.5; // Sparse crowds, more spread out
    } else if (hourOfDay >= 6 && hourOfDay < 9) {
      // Morning rush hour (6am-9am)
      pointMultiplier = isWeekend ? 0.5 : 1.2; // Less busy on weekends
      radiusMultiplier = 0.9; // Concentrated around transit/work areas
    } else if (hourOfDay >= 9 && hourOfDay < 12) {
      // Mid-morning (9am-12pm)
      pointMultiplier = 0.8;
      radiusMultiplier = 1.0;
    } else if (hourOfDay >= 12 && hourOfDay < 14) {
      // Lunch time (12pm-2pm)
      pointMultiplier = 1.1;
      radiusMultiplier = 0.8; // Concentrated in downtown/restaurant areas
    } else if (hourOfDay >= 14 && hourOfDay < 17) {
      // Afternoon (2pm-5pm)
      pointMultiplier = 0.9;
      radiusMultiplier = 1.0;
    } else if (hourOfDay >= 17 && hourOfDay < 20) {
      // Evening rush hour (5pm-8pm)
      pointMultiplier = isWeekend ? 1.0 : 1.3; // Busy on weekdays
      radiusMultiplier = 0.9;
    } else if (hourOfDay >= 20 && hourOfDay < 22) {
      // Evening entertainment (8pm-10pm)
      pointMultiplier = isWeekend ? 1.2 : 0.8; // Busier on weekends
      radiusMultiplier = 0.7; // More concentrated in entertainment areas
    } else {
      // Late evening (10pm-12am)
      pointMultiplier = isWeekend ? 0.9 : 0.5; // Busier on weekends
      radiusMultiplier = 1.1;
    }
    
    // Adjust for special areas based on city
    // This creates "hot spots" in different areas at different times
    // For a real app, this would come from actual data
    
    // Calculate final parameters for data generation
    const finalPoints = Math.floor(100 * pointMultiplier);
    const finalRadius = 0.05 * radiusMultiplier;
    
    // Generate the heatmap data
    // We'll create multiple clusters to simulate different activity centers
    const heatmapData = [];
    
    // Main city center cluster
    const centerCluster = generateMockDensityData(
      centerLat,
      centerLng,
      finalRadius,
      finalPoints
    );
    heatmapData.push(...centerCluster);
    
    // Create 2-3 additional clusters for different areas of the city
    // Areas like downtown, university, entertainment district, etc.
    
    // Cluster 1 - Northeast (could be a business district)
    if (hourOfDay >= 8 && hourOfDay <= 18) { // Business hours
      const cluster1 = generateMockDensityData(
        centerLat + 0.015,
        centerLng + 0.015,
        finalRadius * 0.8,
        finalPoints * (hourOfDay >= 12 && hourOfDay <= 14 ? 0.7 : 0.5) // Busier at lunch
      );
      heatmapData.push(...cluster1);
    }
    
    // Cluster 2 - Southwest (could be an entertainment area)
    if (hourOfDay >= 18 || hourOfDay <= 2) { // Evening hours
      const cluster2 = generateMockDensityData(
        centerLat - 0.012,
        centerLng - 0.012,
        finalRadius * 0.7,
        finalPoints * (hourOfDay >= 20 && hourOfDay <= 23 ? 0.9 : 0.4) // Busier at night
      );
      heatmapData.push(...cluster2);
    }
    
    // Cluster 3 - Northwest (could be a residential area)
    const residentialActivity = hourOfDay >= 17 || hourOfDay <= 8 ? 0.6 : 0.2; // Busier mornings and evenings
    const cluster3 = generateMockDensityData(
      centerLat + 0.018,
      centerLng - 0.018,
      finalRadius * 1.2,
      finalPoints * residentialActivity
    );
    heatmapData.push(...cluster3);
    
    return heatmapData;
  }, []);

  // Clean up markers and heatmap when component unmounts
  useEffect(() => {
    return () => {
      if (heatmap) {
        heatmap.setMap(null);
      }
      markers.forEach(marker => marker.setMap(null));
    };
  }, [heatmap, markers]);

  // Handle city change
  useEffect(() => {
    if (!map || !isLoaded || !isMapInitialized) return;

    // Create a unique effect ID to avoid duplicate effects
    const effectId = `city-change-${selectedCity.name}`;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Use a stable reference callback pattern for setState to avoid dependency loops
    setMarkers([]); // Clear markers first

    // Set map center to selected city with smooth animation
    map.panTo(selectedCity.center);
    map.setZoom(selectedCity.zoom);

    // Create cultural site markers for the selected city
    const culturalSites = SAMPLE_CULTURAL_SITES[selectedCity.name] || [];
    const newMarkers: google.maps.Marker[] = [];

    // Create markers for cultural sites
    culturalSites.forEach(site => {
      const marker = new google.maps.Marker({
        position: { lat: site.lat, lng: site.lng },
        map: map,
        title: site.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        },
        animation: google.maps.Animation.DROP, // Add animation but only on initial load
        optimized: true // Improve performance
      });

      // Add click listener to marker
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div>
              <h3>${site.name}</h3>
              <p>Estimated crowd density: ${Math.floor(Math.random() * 100)}%</p>
              <p>Day/Night visitor ratio: ${(0.5 + Math.random() * 0.8).toFixed(2)}</p>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      newMarkers.push(marker);
    });

    // Update markers state
    setMarkers(newMarkers);

    // Always generate initial heatmap data when city changes
    if (heatmap) {
      heatmap.setMap(null);
    }

    // Generate heatmap data for current time
    const initialData = generateTimeBasedHeatmapData(
      selectedCity.center.lat,
      selectedCity.center.lng,
      new Date().getTime()
    );
    
    // Create new heatmap with the data
    const newHeatmap = new google.maps.visualization.HeatmapLayer({
      data: initialData,
      map: map,
      radius: 20,
      opacity: 0.7,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });
    
    // Update heatmap state using a callback to avoid dependency loops
    setHeatmap(newHeatmap);
    heatmapDataRef.current = initialData;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded, 
    isMapInitialized,
    selectedCity.name, 
    selectedCity.center.lat, 
    selectedCity.center.lng, 
    selectedCity.zoom,
    // Exclude these from deps array to prevent loops:
    // map, heatmap, markers, generateTimeBasedHeatmapData
  ]);

  // Handle time range change
  useEffect(() => {
    if (!map || !heatmap) return;

    // Clear heatmap when time range changes
    heatmap.setMap(null);
    setHeatmap(null);
  }, [map, heatmap, selectedTimeRange]);

  // Handle timestamp change from slider
  useEffect(() => {
    if (!map || !isMapInitialized || !currentTimestamp) return;

    // Use a unique dependency value to prevent repeated effects
    const effectKey = `${selectedCity.name}-${currentTimestamp}`;
    const mapRef = map; // Create a stable reference to map
    
    // Generate new heatmap data based on the timestamp
    const newData = generateTimeBasedHeatmapData(
      selectedCity.center.lat,
      selectedCity.center.lng,
      currentTimestamp
    );

    // If there's no existing heatmap, create one
    if (!heatmap) {
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data: newData,
        map: mapRef,
        radius: 20,
        opacity: 0.7,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      });
      
      setHeatmap(newHeatmap);
    } else {
      // Smoothly update the existing heatmap's data
      // This creates a smoother transition effect instead of recreating the heatmap
      heatmap.setData(newData);
      
      // Determine intensity based on time of day
      const date = new Date(currentTimestamp);
      const hour = date.getHours();
      
      // Lower opacity at night, higher during peak hours
      let opacity = 0.7; // default
      
      if (hour >= 22 || hour < 6) {
        // Night time (10pm - 6am)
        opacity = 0.4;
      } else if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
        // Rush hours (7-9am, 4-6pm)
        opacity = 0.9;
      }
      
      heatmap.set('opacity', opacity);
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimestamp, isMapInitialized, selectedCity.name, 
      selectedCity.center.lat, selectedCity.center.lng, 
      // Exclude these from deps array to prevent loops:
      // map, heatmap, generateTimeBasedHeatmapData
     ]);

  // Handle map click to fetch real-time data
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!map || !e.latLng || !isMapInitialized) return;
    
    try {
      // Clear previous heatmap
      if (heatmap) {
        heatmap.setMap(null);
      }

      // Show loading indicator in info window
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div>
            <h3>Loading data...</h3>
            <p>Analyzing area...</p>
          </div>
        `);
        infoWindowRef.current.setPosition(e.latLng);
        infoWindowRef.current.open(map);
      }

      // Check if Places API is available
      if (!window.google.maps.places) {
        throw new Error("Places API is not enabled for this API key");
      }

      // Fetch nearby places (in a real app, this would be a server call)
      const nearbyPlaces = await fetchNearbyPlaces(
        map,
        e.latLng.toJSON(),
        1500,
        'tourist_attraction'
      );

      // Convert to heatmap data
      const heatmapData = placesToHeatmapData(nearbyPlaces);

      // Create new heatmap
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 20,
        opacity: 0.7
      });

      setHeatmap(newHeatmap);

      // Show info window with summary
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div>
            <h3>Area Analysis</h3>
            <p>Found ${nearbyPlaces.length} points of interest</p>
            <p>Estimated crowd density: ${Math.floor(Math.random() * 100)}%</p>
            <p>Click on markers for more details</p>
          </div>
        `);
        infoWindowRef.current.setPosition(e.latLng);
        infoWindowRef.current.open(map);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      
      // Handle Places API error
      if (error.toString().includes("Places API")) {
        // Generate mock data as fallback
        const mockData = generateTimeBasedHeatmapData(
          e.latLng.lat(),
          e.latLng.lng(),
          new Date().getTime()
        );
        
        // Create new heatmap with mock data
        const newHeatmap = new google.maps.visualization.HeatmapLayer({
          data: mockData,
          map: map,
          radius: 20,
          opacity: 0.7
        });
        
        setHeatmap(newHeatmap);
        
        // Show error in info window with fallback to simulated data
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div>
              <h3>Places API Not Enabled</h3>
              <p>Using simulated data instead. To use real data, enable the Places API in your Google Cloud Console.</p>
              <p>Estimated crowd density: ${Math.floor(Math.random() * 100)}%</p>
            </div>
          `);
        }
      } else {
        // Show generic error in info window
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div>
              <h3>Error</h3>
              <p>Could not load data for this area.</p>
            </div>
          `);
        }
      }
    }
  };

  if (loadError) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Error loading Google Maps. Please check your API key and internet connection.</div>;
  }

  return (
    <div className="relative">
      {!isLoaded ? (
        <div className="h-[70vh] w-full bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading map...</p>
          </div>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selectedCity.center}
          zoom={selectedCity.zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={mapOptionsMemo}
        >
        </GoogleMap>
      )}
      
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
        <h3 className="font-semibold">Map Instructions</h3>
        <p className="text-sm">• Blue markers represent cultural sites</p>
        <p className="text-sm">• Heat map shows crowd density</p>
        <p className="text-sm">• Use the time slider to see changes over time</p>
        <p className="text-sm">• Click anywhere to analyze that area</p>
      </div>
    </div>
  );
};

export default Map; 