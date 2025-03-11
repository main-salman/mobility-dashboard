import { TrafficFlowPoint, MovementType } from '../types';

// Updated color scheme with more distinct colors
export const getColorForMovementType = (type: MovementType, intensity: number): string => {
  // Base colors for different movement types with higher contrast
  const baseColors = {
    pedestrian: [41, 121, 255], // Bright blue
    vehicle: [255, 109, 0], // Vibrant orange
    transit: [0, 168, 107], // Strong green
    bicycle: [233, 30, 99], // Hot pink
  };

  // Get base color
  const baseColor = baseColors[type] || [200, 200, 200];

  // Adjust colors based on intensity (shift toward red for higher intensity)
  const r = Math.min(255, baseColor[0] + intensity * 120);
  const g = Math.max(0, baseColor[1] - intensity * 80);
  const b = Math.max(0, baseColor[2] - intensity * 80);

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

// Performance-optimized point creation - creates fewer elements for better performance
export const createFlowDotElements = (
  flowPoints: TrafficFlowPoint[],
  projection: google.maps.MapCanvasProjection,
  scale: number = 1
): SVGElement[] => {
  // Limit the number of points to prevent freezing
  const MAX_ELEMENTS = 1000;
  let pointsToRender = flowPoints;

  // If we have too many points, sample them down
  if (flowPoints.length > MAX_ELEMENTS) {
    const samplingRate = MAX_ELEMENTS / flowPoints.length;
    pointsToRender = flowPoints.filter(() => Math.random() <= samplingRate);
  }

  return pointsToRender.map(point => {
    // Calculate current position based on progress
    const currentPosition = interpolatePosition(point.position, point.nextPosition, point.progress);

    // Convert geo coordinates to pixel coordinates
    const pixelPosition = projection.fromLatLngToDivPixel(
      new google.maps.LatLng(currentPosition.lat, currentPosition.lng)
    );

    // Performance optimization: Use simpler shapes for all types when there are many points
    if (pointsToRender.length > 300) {
      // Just use circles for all types when there are many points
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pixelPosition.x.toString());
      circle.setAttribute('cy', pixelPosition.y.toString());
      circle.setAttribute('r', (2 * scale).toString());
      circle.setAttribute('fill', getColorForMovementType(point.movementType, point.intensity));
      circle.setAttribute('data-point-id', point.id);
      circle.setAttribute('data-point-type', point.movementType);
      return circle;
    }

    // Determine shape based on movement type
    const shape = document.createElementNS(
      'http://www.w3.org/2000/svg',
      getShapeForMovementType(point.movementType)
    );

    // Set common attributes
    const color = getColorForMovementType(point.movementType, point.intensity);

    // Apply specific attributes based on shape
    if (point.movementType === 'pedestrian') {
      // Circle for pedestrians
      (shape as SVGCircleElement).setAttribute('cx', pixelPosition.x.toString());
      (shape as SVGCircleElement).setAttribute('cy', pixelPosition.y.toString());
      (shape as SVGCircleElement).setAttribute('r', (2.5 * scale).toString());
      shape.setAttribute('fill', color);
    } else if (point.movementType === 'vehicle') {
      // Rectangle for vehicles
      const size = 5 * scale;
      (shape as SVGRectElement).setAttribute('x', (pixelPosition.x - size / 2).toString());
      (shape as SVGRectElement).setAttribute('y', (pixelPosition.y - size / 2).toString());
      (shape as SVGRectElement).setAttribute('width', size.toString());
      (shape as SVGRectElement).setAttribute('height', size.toString());
      (shape as SVGRectElement).setAttribute('rx', '1');
      shape.setAttribute('fill', color);

      // Rotate in direction of movement
      shape.setAttribute(
        'transform',
        `rotate(${point.bearing} ${pixelPosition.x} ${pixelPosition.y})`
      );
    } else if (point.movementType === 'transit') {
      // Diamond for transit
      const size = 5 * scale;
      const points = `
        ${pixelPosition.x},${pixelPosition.y - size} 
        ${pixelPosition.x + size},${pixelPosition.y} 
        ${pixelPosition.x},${pixelPosition.y + size} 
        ${pixelPosition.x - size},${pixelPosition.y}
      `;
      (shape as SVGPolygonElement).setAttribute('points', points);
      shape.setAttribute('fill', color);
    } else if (point.movementType === 'bicycle') {
      // Triangle for bicycles
      const size = 4 * scale;
      const points = `
        ${pixelPosition.x},${pixelPosition.y - size} 
        ${pixelPosition.x + size},${pixelPosition.y + size} 
        ${pixelPosition.x - size},${pixelPosition.y + size}
      `;
      (shape as SVGPolygonElement).setAttribute('points', points);
      shape.setAttribute('fill', color);

      // Rotate in direction of movement
      shape.setAttribute(
        'transform',
        `rotate(${point.bearing} ${pixelPosition.x} ${pixelPosition.y})`
      );
    }

    // Add data attribute for interaction
    shape.setAttribute('data-point-id', point.id);
    shape.setAttribute('data-point-type', point.movementType);

    return shape;
  });
};

// Get appropriate SVG element type based on movement type
const getShapeForMovementType = (type: MovementType): string => {
  switch (type) {
    case 'pedestrian':
      return 'circle';
    case 'vehicle':
      return 'rect';
    case 'transit':
      return 'polygon';
    case 'bicycle':
      return 'polygon';
    default:
      return 'circle';
  }
};

// Interpolate between two positions based on progress
export const interpolatePosition = (
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral,
  progress: number
): google.maps.LatLngLiteral => {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
};

// Optimized animation with throttling to prevent freezing
let lastUpdateTime = 0;
const THROTTLE_MS = 50; // Limit updates to every 50ms

export const updateFlowPoints = (
  flowPoints: TrafficFlowPoint[],
  speedFactor: number = 1
): TrafficFlowPoint[] => {
  // Throttle updates to prevent excessive CPU usage
  const now = Date.now();
  if (now - lastUpdateTime < THROTTLE_MS) {
    return flowPoints; // Skip this update cycle
  }
  lastUpdateTime = now;

  // Calculate elapsed time since last update in seconds
  const elapsedSec = THROTTLE_MS / 1000;

  return flowPoints.map(point => {
    // Apply different speeds for different movement types
    const typeSpeedFactor = getSpeedFactorForMovementType(point.movementType);

    // Update progress based on speed, time elapsed, and type
    // Scale by elapsed time for framerate-independent animation
    let progress =
      point.progress + (point.speed / 5000) * speedFactor * typeSpeedFactor * elapsedSec * 60;

    // Reset progress when reaching destination
    if (progress >= 1) {
      progress = 0;
    }

    return {
      ...point,
      progress,
    };
  });
};

// Get speed factor based on movement type
const getSpeedFactorForMovementType = (type: MovementType): number => {
  switch (type) {
    case 'pedestrian':
      return 0.3; // Pedestrians move slower
    case 'vehicle':
      return 1.0; // Normal speed for vehicles
    case 'transit':
      return 0.7; // Transit is moderate speed
    case 'bicycle':
      return 0.5; // Bicycles are moderate-slow
    default:
      return 1.0;
  }
};

// Get appropriate point size based on zoom level
export const getPointSizeForZoom = (zoom: number): number => {
  if (zoom >= 16) return 4;
  if (zoom >= 14) return 3.5;
  if (zoom >= 12) return 3;
  if (zoom >= 10) return 2.5;
  return 2;
};

// More aggressive point sampling for better performance
export const samplePointsForZoom = (
  points: TrafficFlowPoint[],
  zoom: number
): TrafficFlowPoint[] => {
  // More aggressive max points to prevent freezing
  const maxPoints = {
    20: 5000, // Reduced from 50000
    18: 2000, // Reduced from 20000
    16: 1000, // Reduced from 10000
    14: 800, // Reduced from 5000
    12: 600, // Reduced from 2000
    10: 400, // Reduced from 1000
    8: 200, // Reduced from 500
    0: 100, // Reduced from 200
  };

  // Find appropriate max points for current zoom
  let limit = maxPoints[0];
  for (const [zoomThreshold, pointLimit] of Object.entries(maxPoints)) {
    if (zoom >= parseInt(zoomThreshold)) {
      limit = pointLimit;
      break;
    }
  }

  // If we have fewer points than the limit, return all points
  if (points.length <= limit) return points;

  // Otherwise, sample points
  const samplingRate = limit / points.length;

  // Ensure we get a good distribution of movement types
  const result: TrafficFlowPoint[] = [];
  const typeGroups: Record<MovementType, TrafficFlowPoint[]> = {
    pedestrian: [],
    vehicle: [],
    transit: [],
    bicycle: [],
  };

  // Group points by type
  points.forEach(point => {
    if (typeGroups[point.movementType]) {
      typeGroups[point.movementType].push(point);
    }
  });

  // Sample from each type proportionally
  Object.entries(typeGroups).forEach(([type, typePoints]) => {
    const typeLimit = Math.max(10, Math.floor(limit * (typePoints.length / points.length)));
    const typeSamplingRate = typeLimit / typePoints.length;

    typePoints.forEach(point => {
      if (Math.random() <= typeSamplingRate) {
        result.push(point);
      }
    });
  });

  return result;
};
