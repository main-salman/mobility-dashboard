import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { City, TimeRange, TrafficFlowPoint, MovementType } from '../types';
import { SAMPLE_CULTURAL_SITES } from '../utils/data';
import {
  fetchNearbyPlaces,
  placesToHeatmapData,
  fetchDataForTimeRange,
  fetchPlaceDetails,
  generateTrafficFlowData,
  generateSimulatedTrafficFlow,
  createPolylinePathsFromPoints,
  getRouteColor,
  isRoutesApiAvailable,
  apiDiagnostics,
} from '../utils/maps';
import { toast } from 'react-hot-toast';
import {
  getColorForMovementType,
  createFlowDotElements,
  interpolatePosition,
  updateFlowPoints as updateFlowPointsPosition,
  getPointSizeForZoom,
  samplePointsForZoom,
} from '../utils/visualization';

// Update the libraries array to include routes if possible
// Note: "routes" isn't officially in the documented libraries but we can try to load it
const libraries = ['places', 'visualization', 'geometry'] as const;

const containerStyle = {
  width: '100%',
  height: '70vh',
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
  onFlowPointsUpdate?: (points: TrafficFlowPoint[]) => void;
  onNearbyPlacesUpdate?: (places: any[]) => void;
}

// Add a version parameter to force reload if needed
const mapApiOptions = {
  id: 'google-map-script',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries,
  version: 'weekly', // Use the weekly version to ensure access to the latest features
  mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ''],
  language: 'en',
};

// Optimize the FlowOverlay class for better performance
class FlowOverlay extends google.maps.OverlayView {
  private svgContainer: SVGElement | null = null;
  private flowPoints: TrafficFlowPoint[] = [];
  private rafId: number | null = null;
  private lastDrawTime = 0;
  private readonly DRAW_THROTTLE_MS = 100; // Limit redraws to every 100ms

  constructor() {
    super();
    this.flowPoints = [];
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgContainer.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
    );
  }

  onAdd() {
    const panes = this.getPanes();
    if (panes && panes.overlayLayer && this.svgContainer) {
      panes.overlayLayer.appendChild(this.svgContainer);
    }
  }

  draw() {
    // Throttle drawing to improve performance
    const now = Date.now();
    if (now - this.lastDrawTime < this.DRAW_THROTTLE_MS) {
      // Schedule a draw after the throttle time if we skipped this one
      if (!this.rafId) {
        this.rafId = window.setTimeout(() => {
          this.rafId = null;
          this.draw();
        }, this.DRAW_THROTTLE_MS);
      }
      return;
    }

    this.lastDrawTime = now;

    if (!this.svgContainer) return;

    // Clear existing dots (more efficiently by replacing the entire container)
    const oldContainer = this.svgContainer;
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgContainer.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
    );

    const projection = this.getProjection();
    if (!projection) {
      if (oldContainer.parentNode) {
        oldContainer.parentNode.replaceChild(this.svgContainer, oldContainer);
      }
      return;
    }

    // Get zoom level for appropriate scaling
    const map = this.getMap();
    const zoom = map ? map.getZoom() || 14 : 14;
    const scale = getPointSizeForZoom(zoom);

    // Sample points based on zoom level to maintain performance
    const sampledPoints = samplePointsForZoom(this.flowPoints, zoom);

    // Create dots for each flow point
    const dotElements = createFlowDotElements(sampledPoints, projection, scale);

    // Add dots to SVG container
    dotElements.forEach(dot => this.svgContainer?.appendChild(dot));

    // Replace the old container with the new one
    if (oldContainer.parentNode) {
      oldContainer.parentNode.replaceChild(this.svgContainer, oldContainer);
    }
  }

  onRemove() {
    if (this.rafId) {
      clearTimeout(this.rafId);
      this.rafId = null;
    }

    if (this.svgContainer && this.svgContainer.parentNode) {
      this.svgContainer.parentNode.removeChild(this.svgContainer);
    }
    this.svgContainer = null;
  }

  updatePoints(points: TrafficFlowPoint[]) {
    // Only update and redraw if we have a significant change in points
    // This prevents unnecessary redraws when filtering movement types
    if (
      Math.abs(this.flowPoints.length - points.length) > 10 ||
      points.length === 0 ||
      this.flowPoints.length === 0
    ) {
      this.flowPoints = points;
      this.draw();
    } else {
      // Just update the points without redrawing
      this.flowPoints = points;
    }
  }
}

const Map = ({
  selectedCity,
  selectedTimeRange,
  currentTimestamp,
  shouldAnimateHeatmap = false,
  onFlowPointsUpdate,
  onNearbyPlacesUpdate,
}: MapProps) => {
  const { isLoaded, loadError } = useJsApiLoader(mapApiOptions);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [showTimeRangeNotification, setShowTimeRangeNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowPoints, setFlowPoints] = useState<TrafficFlowPoint[]>([]);
  const [isFlowAnimating, setIsFlowAnimating] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'heatmap' | 'flow' | 'combined'>(
    'combined'
  );
  const [selectedMovementTypes, setSelectedMovementTypes] = useState<MovementType[]>([
    'vehicle',
    'pedestrian',
    'transit',
    'bicycle',
  ]);
  const [hoveredArea, setHoveredArea] = useState<{
    position: google.maps.LatLng;
    data: any;
  } | null>(null);
  const zoomLevelRef = useRef<number>(12);

  const animationFrameRef = useRef<number | null>(null);
  const updateStateRef = useRef({ updating: false });
  const speedFactorRef = useRef(1);

  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const heatmapDataRef = useRef<google.maps.visualization.WeightedLocation[]>([]);
  const timeRangeDataCache = useRef<Record<string, google.maps.visualization.WeightedLocation[]>>(
    {}
  );
  const flowPathsRef = useRef<google.maps.Polyline[]>([]);
  const flowOverlayRef = useRef<FlowOverlay | null>(null);
  const lastSuccessToastRef = useRef<number | null>(null);

  // Memoize map options to prevent unnecessary re-renders
  const mapOptionsMemo = useMemo(
    () => ({
      ...mapOptions,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
    }),
    []
  );

  // Helper function to find nearby flow points (for hover interactions)
  const findNearbyPoints = useCallback(
    (position: google.maps.LatLng, points: TrafficFlowPoint[], radiusMeters: number) => {
      return points.filter(point => {
        const pointPos = new google.maps.LatLng(point.position.lat, point.position.lng);
        return (
          google.maps.geometry.spherical.computeDistanceBetween(position, pointPos) <= radiusMeters
        );
      });
    },
    []
  );

  // Helper function to calculate average speed of points
  const calculateAverageSpeed = useCallback((points: TrafficFlowPoint[]) => {
    if (points.length === 0) return 0;
    return points.reduce((sum, point) => sum + point.speed, 0) / points.length;
  }, []);

  // Helper function to calculate primary direction of flow
  const calculatePrimaryDirection = useCallback((points: TrafficFlowPoint[]) => {
    if (points.length === 0) return 'N/A';

    // Group bearings into 8 compass directions
    const directions: { [key: string]: number } = {
      N: 0,
      NE: 0,
      E: 0,
      SE: 0,
      S: 0,
      SW: 0,
      W: 0,
      NW: 0,
    };

    points.forEach(point => {
      const bearing = point.bearing;
      // Convert bearing to compass direction
      if (bearing >= 337.5 || bearing < 22.5) directions['N']++;
      else if (bearing >= 22.5 && bearing < 67.5) directions['NE']++;
      else if (bearing >= 67.5 && bearing < 112.5) directions['E']++;
      else if (bearing >= 112.5 && bearing < 157.5) directions['SE']++;
      else if (bearing >= 157.5 && bearing < 202.5) directions['S']++;
      else if (bearing >= 202.5 && bearing < 247.5) directions['SW']++;
      else if (bearing >= 247.5 && bearing < 292.5) directions['W']++;
      else if (bearing >= 292.5 && bearing < 337.5) directions['NW']++;
    });

    // Find the most common direction
    return Object.entries(directions).reduce(
      (max, [dir, count]) => (count > max.count ? { dir, count } : max),
      { dir: 'N/A', count: 0 }
    ).dir;
  }, []);

  // Memoize the flowPoints update function to prevent unnecessary re-renders
  const animateFlowPoints = useCallback(
    (timestamp: number) => {
      if (!isFlowAnimating || flowPoints.length === 0) return;

      // Update point positions based on their speed
      const updatedPoints = updateFlowPointsPosition(flowPoints, speedFactorRef.current);

      // Only update state if we have non-trivial changes
      // This prevents unnecessary re-renders
      let hasSignificantChanges = false;
      if (updatedPoints.length !== flowPoints.length) {
        hasSignificantChanges = true;
      } else {
        // Check a sample of points for significant progress changes
        const sampleSize = Math.min(10, updatedPoints.length);
        for (let i = 0; i < sampleSize; i++) {
          const idx = Math.floor(Math.random() * updatedPoints.length);
          if (Math.abs(updatedPoints[idx].progress - flowPoints[idx].progress) > 0.05) {
            hasSignificantChanges = true;
            break;
          }
        }
      }

      if (hasSignificantChanges) {
        setFlowPoints(updatedPoints);
      }

      // Update the overlay directly without waiting for state update
      if (flowOverlayRef.current) {
        flowOverlayRef.current.updatePoints(updatedPoints);
      }

      // Request next animation frame
      animationFrameRef.current = requestAnimationFrame(animateFlowPoints);
    },
    [flowPoints, isFlowAnimating]
  );

  // Toggle flow animation
  const toggleFlowAnimation = useCallback(() => {
    setIsFlowAnimating(prev => {
      const newState = !prev;

      if (newState) {
        // Starting animation
        animationFrameRef.current = requestAnimationFrame(animateFlowPoints);
      } else {
        // Stopping animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }

      return newState;
    });
  }, [animateFlowPoints]);

  // Update heatmap from flow points
  const updateHeatmapFromFlowPoints = useCallback(
    (points: TrafficFlowPoint[]) => {
      if (!map) return;

      // Convert flow points to heatmap data
      const heatmapData = points.map(point => {
        const pos = interpolatePosition(point.position, point.nextPosition, point.progress);
        return {
          location: new google.maps.LatLng(pos.lat, pos.lng),
          weight: point.intensity || 1,
        };
      });

      // Update or create heatmap
      if (heatmap) {
        heatmap.setData(heatmapData);
      } else {
        const newHeatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: visualizationMode === 'heatmap' || visualizationMode === 'combined' ? map : null,
          radius: 20,
          opacity: 0.6,
          maxIntensity: 10,
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
            'rgba(255, 0, 0, 1)',
          ],
        });
        setHeatmap(newHeatmap);
      }
    },
    [map, heatmap, visualizationMode]
  );

  // Optimize updateFlowVisualization to prevent too many API calls
  const updateFlowVisualization = useCallback(
    async (timestamp: number) => {
      if (!map) return;

      // Guard against recursive updates
      if (updateStateRef.current.updating) {
        return;
      }

      updateStateRef.current.updating = true;
      setIsLoading(true);

      // Clear existing flow paths
      flowPathsRef.current.forEach(path => path.setMap(null));
      flowPathsRef.current = [];

      try {
        // Reduce API calls by checking a 5-minute time window
        const cacheKey = `${selectedCity.name}-${Math.floor(timestamp / (5 * 60 * 1000))}`;
        const cachedData = ((window as any).__mobilityFlowCache =
          (window as any).__mobilityFlowCache || {});

        let directionsResults;

        // Check cache first
        if (cachedData[cacheKey]) {
          console.log('Using cached flow data');
          directionsResults = cachedData[cacheKey];
        } else {
          // Get directions data from API
          directionsResults = await generateTrafficFlowData(
            map,
            selectedCity,
            timestamp,
            selectedTimeRange
          );

          if (directionsResults) {
            // Store in cache
            cachedData[cacheKey] = directionsResults;
          }
        }

        if (directionsResults) {
          // Process results
          console.log(`Processing ${directionsResults.length} direction results`);
          // Create polylines for each route if in flow or combined mode
          const polylines: google.maps.Polyline[] = [];

          if (visualizationMode === 'flow' || visualizationMode === 'combined') {
            // Limit the number of routes to 5 for performance
            const routesToShow = directionsResults.slice(0, 5);

            routesToShow.forEach((result, index) => {
              if (!result.routes || !result.routes[0]) return;

              const route = result.routes[0];
              const path = route.overview_path;

              if (!path) return;

              // Create polyline for this route
              const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: getRouteColor(index),
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

              // Simplify click handler to reduce closures
              polyline.addListener('click', () => {
                if (!infoWindowRef.current) return;

                const stats = {
                  distance: route.legs?.[0]?.distance?.text || 'Unknown',
                  duration: route.legs?.[0]?.duration?.text || 'Unknown',
                  startAddress: route.legs?.[0]?.start_address || 'Unknown',
                  endAddress: route.legs?.[0]?.end_address || 'Unknown',
                };

                infoWindowRef.current.setContent(`
                <div class="stats-window">
                  <h3>Route Information</h3>
                  <p><strong>From:</strong> ${stats.startAddress}</p>
                  <p><strong>To:</strong> ${stats.endAddress}</p>
                  <p><strong>Distance:</strong> ${stats.distance}</p>
                  <p><strong>Duration:</strong> ${stats.duration}</p>
                </div>
              `);

                infoWindowRef.current.setPosition(path[Math.floor(path.length / 2)]);
                infoWindowRef.current.open(map);
              });

              polylines.push(polyline);
            });
          }

          // Store polylines in ref
          flowPathsRef.current = polylines;

          // Create flow points for each movement type
          // Limit total points to prevent freezing (max ~5000 total points)
          const MAX_TOTAL_POINTS = 5000;
          const newFlowPoints: TrafficFlowPoint[] = [];
          let pointId = 0;

          // Process routes (limit to 10 routes maximum)
          const routesToProcess = directionsResults.slice(0, 10);

          // Use a label for loops to allow breaking from nested loops
          routeProcessing: for (let routeIdx = 0; routeIdx < routesToProcess.length; routeIdx++) {
            const result = routesToProcess[routeIdx];
            if (!result.routes || !result.routes[0] || !result.routes[0].legs) continue;

            const leg = result.routes[0].legs[0];
            if (!leg || !leg.steps) continue;

            // Calculate time-based factors
            const date = new Date(timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Process each step in the route (limit steps if too many)
            const stepsToProcess = leg.steps.slice(
              0,
              MAX_TOTAL_POINTS / (routesToProcess.length * 5)
            );

            for (let stepIdx = 0; stepIdx < stepsToProcess.length; stepIdx++) {
              const step = stepsToProcess[stepIdx];
              if (!step.path) continue;
              const path = step.path;

              // Generate different movement types along this path
              const movementTypes: MovementType[] = ['vehicle']; // Always include vehicles

              // Add other types with probability (reduce number of generated points)
              if (Math.random() < 0.4) {
                movementTypes.push('pedestrian');
              }

              if (Math.random() < 0.2) {
                movementTypes.push('transit');
              }

              if (hour >= 7 && hour <= 19 && Math.random() < 0.3) {
                movementTypes.push('bicycle');
              }

              // Sample path points to reduce total number
              // Skip points if we're getting too many
              const skipFactor = Math.max(1, Math.ceil(path.length / 10));

              // Create points along the path for each movement type
              for (let i = 0; i < path.length - 1; i += skipFactor) {
                // Skip randomly if we're approaching the limit
                if (newFlowPoints.length > MAX_TOTAL_POINTS * 0.8 && Math.random() < 0.7) continue;

                const start = path[i];
                const end = path[i + 1];

                // Extract coordinates
                let startLat, startLng, endLat, endLng;

                if (typeof start.lat === 'function' && typeof start.lng === 'function') {
                  startLat = start.lat();
                  startLng = start.lng();
                } else {
                  startLat = start.lat;
                  startLng = start.lng;
                }

                if (typeof end.lat === 'function' && typeof end.lng === 'function') {
                  endLat = end.lat();
                  endLng = end.lng();
                } else {
                  endLat = end.lat;
                  endLng = end.lng;
                }

                // Calculate bearing
                const bearing = (Math.atan2(endLng - startLng, endLat - startLat) * 180) / Math.PI;

                // For each movement type on this segment
                for (const movementType of movementTypes) {
                  // Skip if we've exceeded our point limit
                  if (newFlowPoints.length >= MAX_TOTAL_POINTS) {
                    // Use break with label to exit all nested loops at once
                    break routeProcessing;
                  }

                  // Skip if this movement type is not selected by the user
                  if (!selectedMovementTypes.includes(movementType)) continue;

                  // Calculate intensity based on time of day and type
                  let intensity = 0.5; // Base intensity

                  // Time-based intensity adjustment
                  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
                    // Rush hours
                    intensity = isWeekend ? 0.7 : 0.9;
                  } else if (hour >= 10 && hour <= 15) {
                    // Mid-day
                    intensity = 0.6;
                  } else if (hour >= 19 && hour <= 22) {
                    // Evening
                    intensity = 0.5;
                  } else {
                    // Night
                    intensity = 0.3;
                  }

                  // Movement type adjustment
                  if (movementType === 'pedestrian') {
                    // Pedestrians have higher density in downtown areas
                    if (isWeekend || (hour >= 10 && hour <= 20)) {
                      intensity *= 1.3;
                    } else {
                      intensity *= 0.7;
                    }
                  } else if (movementType === 'bicycle') {
                    // Bicycles are more common in daylight hours
                    intensity *= hour >= 7 && hour <= 19 ? 1.2 : 0.4;
                  } else if (movementType === 'transit') {
                    // Transit is more regular throughout the day
                    intensity *= hour >= 6 && hour <= 22 ? 1.0 : 0.2;
                  }

                  // Calculate speed based on movement type and step duration/distance
                  let speed = 1; // Default
                  if (step.duration && step.distance) {
                    // Convert to meters per second
                    let baseSpeed = step.distance.value / step.duration.value;

                    // Adjust speed based on movement type
                    if (movementType === 'pedestrian') {
                      baseSpeed = 1.4; // About 5 km/h
                    } else if (movementType === 'bicycle') {
                      baseSpeed = 4.0; // About 14 km/h
                    } else if (movementType === 'transit') {
                      baseSpeed = 8.0; // About 30 km/h
                    } else {
                      // Vehicles - use the API-provided speed with some randomness
                      baseSpeed = baseSpeed * (0.9 + Math.random() * 0.2);
                    }

                    // Normalize to 0.5-2 range for visualization
                    speed = 0.5 + Math.min(1.5, baseSpeed / 10);
                  }

                  // Create flow point for this movement type
                  newFlowPoints.push({
                    id: `flow-${routeIdx}-${movementType}-${pointId++}`,
                    position: { lat: startLat, lng: startLng },
                    nextPosition: { lat: endLat, lng: endLng },
                    bearing: bearing,
                    progress: Math.random(), // Stagger starting positions
                    routeIndex: routeIdx,
                    speed: speed,
                    intensity: intensity,
                    movementType: movementType,
                  });
                }
              }
            }
          }

          console.log(`Generated ${newFlowPoints.length} flow points`);

          // Set flow points for animation
          setFlowPoints(newFlowPoints);

          // Update the overlay
          if (flowOverlayRef.current) {
            flowOverlayRef.current.updatePoints(newFlowPoints);
          }

          // Update heatmap if in heatmap or combined mode
          if (visualizationMode === 'heatmap' || visualizationMode === 'combined') {
            updateHeatmapFromFlowPoints(newFlowPoints);
          }

          // Pass flow points to parent component if callback provided
          if (onFlowPointsUpdate) {
            onFlowPointsUpdate(newFlowPoints);
          }

          // Show success toast if we haven't shown one recently
          const now = Date.now();
          if (!lastSuccessToastRef.current || now - lastSuccessToastRef.current > 30000) {
            toast.success('Routes loaded successfully!', {
              duration: 3000,
              style: { background: '#10B981', color: '#fff' },
            });
            lastSuccessToastRef.current = now;
          }

          // Clear any error message
          setError(null);
        } else {
          // If API data isn't available, use simulated data instead
          console.log('No API data available, using simulated data');

          // Generate simulated traffic data
          const simulatedPoints = generateSimulatedTrafficFlow(
            selectedCity,
            timestamp,
            selectedTimeRange
          );

          console.log(`Generated ${simulatedPoints.length} simulated flow points`);

          // Add movement types to simulated points
          const movementTypes = ['vehicle', 'pedestrian', 'bicycle', 'transit'];
          const pointsWithMovementTypes = simulatedPoints.map(point => ({
            ...point,
            movementType: movementTypes[point.routeIndex % movementTypes.length],
          }));

          // Filter by selected movement types if any are selected
          const filteredPoints =
            selectedMovementTypes.length > 0
              ? pointsWithMovementTypes.filter(p => selectedMovementTypes.includes(p.movementType))
              : pointsWithMovementTypes;

          // Set flow points for animation
          setFlowPoints(filteredPoints);

          // Update the overlay
          if (flowOverlayRef.current) {
            flowOverlayRef.current.updatePoints(filteredPoints);
          }

          // Update heatmap if in heatmap or combined mode
          if (visualizationMode === 'heatmap' || visualizationMode === 'combined') {
            updateHeatmapFromFlowPoints(filteredPoints);
          }

          // Pass flow points to parent component if callback provided
          if (onFlowPointsUpdate) {
            onFlowPointsUpdate(filteredPoints);
          }

          // Show toast notification
          toast.info('Using simulated traffic data', {
            duration: 3000,
            style: { background: '#4B5563', color: '#fff' },
          });

          // Clear any error message
          setError(null);
        }
      } catch (error) {
        console.error('Error updating flow visualization:', error);
        setFlowPoints([]);
        if (heatmap) {
          heatmap.setData([]);
        }

        // Show error notification
        toast.error(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}.`, {
          duration: 5000,
        });

        setError(
          `Failed to load traffic data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        updateStateRef.current.updating = false;
        setIsLoading(false);
      }
    },
    [
      map,
      selectedCity,
      selectedTimeRange,
      visualizationMode,
      updateHeatmapFromFlowPoints,
      heatmap,
      onFlowPointsUpdate,
      selectedMovementTypes,
    ]
  );

  // Throttle the updateFlowVisualization calls to prevent overwhelming the API
  const lastUpdateTimestampRef = useRef<number>(0);
  const throttledUpdateFlowVisualization = useCallback(
    (timestamp: number) => {
      const now = Date.now();
      if (now - lastUpdateTimestampRef.current < 5000) {
        // Only update once every 5 seconds max
        return;
      }
      lastUpdateTimestampRef.current = now;
      updateFlowVisualization(timestamp);
    },
    [updateFlowVisualization]
  );

  // Initialize or update flow visualization when necessary
  useEffect(() => {
    if (map && isMapInitialized && currentTimestamp) {
      throttledUpdateFlowVisualization(currentTimestamp);
    }
  }, [
    map,
    isMapInitialized,
    currentTimestamp,
    selectedCity,
    selectedTimeRange,
    throttledUpdateFlowVisualization,
  ]);

  // Handle changes to movement type selection
  useEffect(() => {
    if (flowOverlayRef.current && flowPoints.length > 0) {
      // Filter flow points based on selected movement types
      const filteredPoints = flowPoints.filter(point =>
        selectedMovementTypes.includes(point.movementType)
      );

      // Update the overlay with filtered points
      flowOverlayRef.current.updatePoints(filteredPoints);
    }
  }, [selectedMovementTypes, flowPoints]);

  // Map load callback
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setMap(map);

      // Initialize map settings
      map.setCenter(selectedCity.center);
      map.setZoom(selectedCity.zoom || 14);

      // Add zoom change listener
      map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom) {
          zoomLevelRef.current = currentZoom;

          // Update flow overlay when zoom changes
          if (flowOverlayRef.current) {
            flowOverlayRef.current.draw();
          }
        }
      });

      // Create flow overlay and add to map
      const overlay = new FlowOverlay();
      overlay.setMap(map);
      flowOverlayRef.current = overlay;

      // Add hover capabilities for flow points
      map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
        if (e.latLng && flowPoints.length > 0) {
          const position = e.latLng;
          const nearbyPoints = findNearbyPoints(position, flowPoints, 50);

          if (nearbyPoints.length > 0) {
            setHoveredArea({
              position,
              data: {
                count: nearbyPoints.length,
                avgSpeed: calculateAverageSpeed(nearbyPoints),
                primaryDirection: calculatePrimaryDirection(nearbyPoints),
                types: Array.from(new Set(nearbyPoints.map(p => p.movementType))),
              },
            });
          } else {
            setHoveredArea(null);
          }
        }
      });

      // Create info window for place details
      infoWindowRef.current = new google.maps.InfoWindow();

      setIsMapInitialized(true);
    },
    [selectedCity, findNearbyPoints, calculateAverageSpeed, calculatePrimaryDirection, flowPoints]
  );

  // Handle map unmount
  const onUnmount = useCallback(() => {
    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Remove flow overlay
    if (flowOverlayRef.current) {
      flowOverlayRef.current.setMap(null);
      flowOverlayRef.current = null;
    }

    // Clear all markers and polylines
    flowPathsRef.current.forEach(path => path.setMap(null));
    markers.forEach(marker => marker.setMap(null));

    // Clear heatmap
    if (heatmap) {
      heatmap.setMap(null);
    }

    mapRef.current = null;
    setMap(null);
  }, [markers, heatmap]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Function to render movement type controls
  const renderMovementTypeControls = () => {
    const movementTypes: MovementType[] = ['vehicle', 'pedestrian', 'transit', 'bicycle'];

    return (
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 z-10">
        <div className="text-sm font-semibold mb-1">Movement Types</div>
        <div className="flex flex-wrap gap-2">
          {movementTypes.map(type => (
            <button
              key={type}
              className={`px-2 py-1 rounded-md text-xs font-medium ${
                selectedMovementTypes.includes(type)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => {
                // Toggle movement type
                setSelectedMovementTypes(prev =>
                  prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                );
              }}
              style={{
                borderLeft: `4px solid ${getColorForMovementType(type, 0.5)}`,
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Function to render API test buttons
  const renderApiTestButtons = useCallback(() => {
    return (
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button
          onClick={toggleFlowAnimation}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md"
        >
          {isFlowAnimating ? 'Pause Animation' : 'Start Animation'}
        </button>

        <button
          onClick={() =>
            setVisualizationMode(prev =>
              prev === 'flow' ? 'heatmap' : prev === 'heatmap' ? 'combined' : 'flow'
            )
          }
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md"
        >
          Mode: {visualizationMode}
        </button>

        <button
          onClick={() => {
            // Toggle speed between 0.5x, 1x, 2x, 4x
            const speeds = [0.5, 1, 2, 4];
            const currentIndex = speeds.indexOf(speedFactorRef.current);
            const nextIndex = (currentIndex + 1) % speeds.length;
            speedFactorRef.current = speeds[nextIndex];

            toast.success(`Animation speed: ${speedFactorRef.current}x`, {
              duration: 1500,
            });
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md"
        >
          Speed: {speedFactorRef.current}x
        </button>

        <button
          onClick={() => {
            if (map) {
              // Force refresh the flow visualization
              if (currentTimestamp) {
                updateFlowVisualization(currentTimestamp);
              }
            }
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md"
        >
          Force Refresh
        </button>
      </div>
    );
  }, [
    isFlowAnimating,
    toggleFlowAnimation,
    visualizationMode,
    map,
    updateFlowVisualization,
    currentTimestamp,
  ]);

  // Display hover info
  const renderHoverInfo = () => {
    if (!hoveredArea) return null;

    const { position, data } = hoveredArea;

    return (
      <div
        className="absolute bg-black bg-opacity-80 text-white p-2 rounded-md text-xs z-20"
        style={{
          left: (position.lat() % 1) * 1000, // Just using lat/lng as simple screen coords
          top: (position.lng() % 1) * 1000,
          transform: 'translate(-50%, -130%)',
        }}
      >
        <div>Count: {data.count}</div>
        <div>Avg Speed: {(data.avgSpeed * 20).toFixed(1)} km/h</div>
        <div>Direction: {data.primaryDirection}</div>
        {data.types && <div>Types: {data.types.join(', ')}</div>}
      </div>
    );
  };

  // Add a ref to track the current city to prevent unnecessary fetches
  const lastFetchedCityRef = useRef<string | null>(null);
  const placesRetryCountRef = useRef<number>(0);
  const MAX_PLACES_RETRIES = 2;
  const placesDisabledRef = useRef<boolean>(false);

  // Fetch nearby places when city changes - with safeguards against infinite loops
  const fetchAndPassNearbyPlaces = useCallback(async () => {
    if (!map || !onNearbyPlacesUpdate) return;

    // Skip if we've already determined Places API is disabled or reached max retries
    const currentCityName = selectedCity.name;
    if (
      placesDisabledRef.current ||
      (lastFetchedCityRef.current === currentCityName &&
        placesRetryCountRef.current >= MAX_PLACES_RETRIES)
    ) {
      return;
    }

    try {
      console.log(
        `Fetching places for ${currentCityName}. Attempt: ${placesRetryCountRef.current + 1}`
      );

      const places = await fetchNearbyPlaces(map, selectedCity.center, 2500, 'tourist_attraction', [
        'transit_station',
        'shopping_mall',
        'restaurant',
        'park',
      ]);

      // Check if API is disabled by looking at the log message
      if (places.length === 0) {
        const consoleMessages = (window as any).__consoleMessages || [];
        const isDisabled = consoleMessages.some((msg: string) =>
          msg.includes('Places API calls have been disabled')
        );

        if (isDisabled) {
          console.warn('Places API is disabled. Using empty places array.');
          placesDisabledRef.current = true;
          onNearbyPlacesUpdate([]);
          lastFetchedCityRef.current = currentCityName;
          return;
        }
      }

      // Check if we got any places to prevent empty results retries
      if (places && places.length > 0) {
        onNearbyPlacesUpdate(places);
        // Reset retry count on success
        placesRetryCountRef.current = 0;
        // Remember we've successfully fetched for this city
        lastFetchedCityRef.current = currentCityName;
      } else {
        // Increment retry count for empty results
        placesRetryCountRef.current++;
        console.warn(
          `No places found for ${currentCityName}. Retry count: ${placesRetryCountRef.current}`
        );

        // Only pass empty array if we've reached max retries
        if (placesRetryCountRef.current >= MAX_PLACES_RETRIES) {
          console.warn(`Max retries reached for ${currentCityName}. Giving up.`);
          onNearbyPlacesUpdate([]);
          lastFetchedCityRef.current = currentCityName;
        }
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      placesRetryCountRef.current++;

      // Only pass empty array if we've reached max retries
      if (placesRetryCountRef.current >= MAX_PLACES_RETRIES) {
        console.warn(`Max retries reached for ${currentCityName} after error. Giving up.`);
        onNearbyPlacesUpdate([]);
        lastFetchedCityRef.current = currentCityName;
      }
    }
  }, [map, selectedCity, onNearbyPlacesUpdate]);

  // Call fetch places when city changes - with improved dependency handling
  useEffect(() => {
    // Override for console logging to detect Places API disabled message
    if (!(window as any).__consoleOriginal) {
      (window as any).__consoleMessages = [];
      (window as any).__consoleOriginal = console.log;
      console.log = function (...args: any[]) {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Places API calls have been disabled')
        ) {
          (window as any).__consoleMessages.push(args[0]);
        }
        (window as any).__consoleOriginal.apply(console, args);
      };
    }

    if (map && isMapInitialized && onNearbyPlacesUpdate) {
      // Reset retry count when city changes
      if (lastFetchedCityRef.current !== selectedCity.name) {
        placesRetryCountRef.current = 0;
      }

      // Debounce the places API call to prevent rapid consecutive calls
      const timerId = setTimeout(() => {
        fetchAndPassNearbyPlaces();
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [selectedCity.name, map, isMapInitialized, fetchAndPassNearbyPlaces, onNearbyPlacesUpdate]);

  // Now ensure animation starts correctly if flow points exist
  useEffect(() => {
    // Start animation when there are flow points
    if (flowPoints.length > 0 && !isFlowAnimating && map) {
      console.log(`Starting animation for ${flowPoints.length} flow points`);
      setIsFlowAnimating(true);

      // Start animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animateFlowPoints);
    }

    // If there are no flow points but animation is running, stop it
    if (flowPoints.length === 0 && isFlowAnimating) {
      console.log('No flow points, stopping animation');
      setIsFlowAnimating(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [flowPoints.length, isFlowAnimating, map, animateFlowPoints]);

  // This ensures we generate flow data when currentTimestamp changes
  useEffect(() => {
    if (map && currentTimestamp && !updateStateRef.current.updating) {
      console.log(`Generating flow data for timestamp: ${currentTimestamp}`);
      updateFlowVisualization(currentTimestamp);
    }
  }, [map, currentTimestamp, updateFlowVisualization]);

  return (
    <div className="relative w-full h-full">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-md shadow-md z-10">
          <p className="flex items-center">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></span>
            Loading traffic data...
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 py-2 px-4 rounded-md shadow-md z-10">
          <p>{error}</p>
        </div>
      )}

      {/* Display loading message if the API hasn't loaded yet */}
      {!isLoaded ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700">Loading Google Maps...</p>
          </div>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selectedCity.center}
          zoom={selectedCity.zoom || 14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptionsMemo}
        />
      )}

      {/* Movement type controls */}
      {map && isMapInitialized && renderMovementTypeControls()}

      {/* API test controls */}
      {map && isMapInitialized && renderApiTestButtons()}

      {/* Hover info */}
      {hoveredArea && renderHoverInfo()}
    </div>
  );
};

export default Map;
