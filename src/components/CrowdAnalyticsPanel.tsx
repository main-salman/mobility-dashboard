'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { City, TimeRange } from '../types';
import { TrafficFlowPoint } from '../utils/maps';

interface CrowdAnalyticsPanelProps {
  selectedCity: City;
  selectedTimeRange: TimeRange;
  flowPoints?: TrafficFlowPoint[];
  currentTimestamp?: number;
  nearbyPlaces?: any[];
}

const CrowdAnalyticsPanel = ({
  selectedCity,
  selectedTimeRange,
  flowPoints = [],
  currentTimestamp,
  nearbyPlaces = [],
}: CrowdAnalyticsPanelProps) => {
  // Tabs for different analytics views
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'places'>('overview');

  // Metrics state
  const [metrics, setMetrics] = useState({
    // Traffic metrics
    totalFlowPoints: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    minSpeed: 0,

    // Directional metrics
    directionDistribution: {} as Record<string, number>,
    dominantDirection: '',
    directionTrend: '',

    // Area metrics
    hotspots: [] as { area: string; intensity: number }[],

    // Time metrics
    hourlyDistribution: [] as { hour: number; count: number }[],
  });

  // Generate new metrics when flow points or city changes
  useEffect(() => {
    if (flowPoints.length === 0) {
      generateDemoMetrics();
      return;
    }
    
    // Calculate traffic metrics
    const avgSpeed = flowPoints.reduce((sum, point) => sum + point.speed, 0) / flowPoints.length;
    const speeds = flowPoints.map(p => p.speed);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    
    // Calculate directional metrics
    const directionCounts: Record<string, number> = {};
    flowPoints.forEach(point => {
      const direction = getBearingAsDirection(point.bearing);
      directionCounts[direction] = (directionCounts[direction] || 0) + 1;
    });
    
    // Sort directions by count
    const sortedDirections = Object.entries(directionCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const dominantDirection = sortedDirections.length > 0 ? sortedDirections[0][0] : 'N/A';
    
    // Calculate direction trend
    const oppositeDirection = getOppositeDirection(dominantDirection);
    const oppositeCount = directionCounts[oppositeDirection] || 0;
    const dominantCount = directionCounts[dominantDirection] || 0;
    
    const directionTrend = dominantCount > oppositeCount * 2
      ? 'Strong one-way flow'
      : dominantCount > oppositeCount * 1.3
      ? 'Moderate one-way flow'
      : 'Balanced multi-directional flow';
    
    // Generate hotspots for the selected city
    const hotspots = getBusyAreasForCity(selectedCity)
      .map((area, index) => ({
        area,
        intensity: 100 - (index * 15) // Simulate different intensities
      }));
    
    // Create hourly distribution
    const hourlyDistribution = Array.from({length: 24}, (_, i) => ({
      hour: i,
      count: calculateHourlyTraffic(i)
    }));
    
    setMetrics({
      totalFlowPoints: flowPoints.length,
      avgSpeed,
      maxSpeed,
      minSpeed,
      directionDistribution: directionCounts,
      dominantDirection,
      directionTrend,
      hotspots,
      hourlyDistribution
    });
  }, [flowPoints, selectedCity, generateDemoMetrics, getBearingAsDirection, getOppositeDirection, getBusyAreasForCity, calculateHourlyTraffic]);

  // Helper function to convert bearing to direction
  const getBearingAsDirection = useCallback((bearing: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }, []);

  // Helper function to get opposite direction
  const getOppositeDirection = useCallback((direction: string) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const opposites = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
    const index = directions.indexOf(direction);
    return index !== -1 ? opposites[index] : 'N/A';
  }, []);

  // Calculate traffic pattern based on hour
  const calculateHourlyTraffic = useCallback((hour: number) => {
    // Weekday pattern with morning and evening rush hours
    if (hour >= 7 && hour <= 9) {
      return 70 + Math.random() * 30; // Morning rush hour
    } else if (hour >= 16 && hour <= 18) {
      return 80 + Math.random() * 20; // Evening rush hour
    } else if (hour >= 11 && hour <= 14) {
      return 50 + Math.random() * 30; // Lunch time
    } else if (hour >= 0 && hour <= 5) {
      return Math.random() * 15; // Night time
    } else {
      return 20 + Math.random() * 30; // Regular day time
    }
  }, []);

  // Get busy areas for the city
  const getBusyAreasForCity = useCallback((city: City): string[] => {
    const cityAreas: Record<string, string[]> = {
      Vancouver: [
        'Downtown',
        'Granville Island',
        'Stanley Park',
        'Gastown',
        'Robson Street'
      ],
      Toronto: [
        'CN Tower',
        'Eaton Centre',
        'Yorkville',
        'Kensington Market',
        'Distillery District'
      ],
      Delhi: [
        'Connaught Place',
        'Chandni Chowk',
        'India Gate',
        'Hauz Khas',
        'Sarojini Nagar'
      ],
      Lahore: [
        'Bahria Town',
        'Mall Road',
        'Anarkali',
        'Gulberg',
        'Defence Housing Authority'
      ],
      London: [
        'Westminster',
        'London Bridge',
        'Piccadilly Circus',
        'Oxford Street',
        'Covent Garden'
      ]
    };
    
    return cityAreas[city.name] || [
      'Downtown',
      'City Center',
      'Main Square',
      'Shopping District',
      'Tourist Area'
    ];
  }, []);

  // Generate demo metrics when no flow points are available
  const generateDemoMetrics = useCallback(() => {
    // Traffic metrics
    const avgSpeed = 0.8 + Math.random() * 0.8;
    const maxSpeed = avgSpeed + 0.3 + Math.random() * 0.5;
    const minSpeed = Math.max(0.2, avgSpeed - 0.3 - Math.random() * 0.3);
    
    // Directional metrics
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const directionDistribution: Record<string, number> = {};
    
    // Generate random distribution with one dominant direction
    const dominantIndex = Math.floor(Math.random() * directions.length);
    const dominantDirection = directions[dominantIndex];
    
    directions.forEach((dir, i) => {
      directionDistribution[dir] = i === dominantIndex 
        ? Math.round(30 + Math.random() * 30) 
        : Math.round(5 + Math.random() * 15);
    });
    
    // Direction trend
    const directionTrend = Math.random() > 0.6
      ? 'Strong one-way flow'
      : Math.random() > 0.3
      ? 'Moderate one-way flow'
      : 'Balanced multi-directional flow';
    
    // Hotspots
    const hotspots = getBusyAreasForCity(selectedCity)
      .map((area, index) => ({
        area,
        intensity: 100 - (index * 15)
      }));
    
    // Hourly distribution
    const hourlyDistribution = Array.from({length: 24}, (_, i) => ({
      hour: i,
      count: calculateHourlyTraffic(i)
    }));
    
    setMetrics({
      totalFlowPoints: Math.round(500 + Math.random() * 500),
      avgSpeed,
      maxSpeed,
      minSpeed,
      directionDistribution,
      dominantDirection,
      directionTrend,
      hotspots,
      hourlyDistribution
    });
  }, [selectedCity, getBusyAreasForCity, calculateHourlyTraffic, setMetrics]);

  // Time period status based on current timestamp
  const timePeriodStatus = useMemo(() => {
    if (!currentTimestamp) return 'Normal';

    const date = new Date(currentTimestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      return isWeekend ? 'Moderately Busy' : 'Peak Hours';
    } else if (hour >= 10 && hour <= 15) {
      return 'Normal Activity';
    } else if (hour >= 19 && hour <= 22) {
      return isWeekend ? 'Busy Evening' : 'Evening Rush';
    } else {
      return 'Low Activity';
    }
  }, [currentTimestamp]);

  // Create the direction distribution chart
  const directionChart = useMemo(() => {
    const directions = Object.keys(metrics.directionDistribution);
    const counts = Object.values(metrics.directionDistribution);
    const maxCount = Math.max(...counts, 1);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Movement Direction</h3>
        <div className="flex flex-col space-y-2">
          {directions.map(direction => {
            const count = metrics.directionDistribution[direction] || 0;
            const percentage = Math.round((count / maxCount) * 100);

            return (
              <div key={direction} className="flex items-center">
                <span className="w-8 font-medium">{direction}</span>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        direction === metrics.dominantDirection ? 'bg-blue-600' : 'bg-blue-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Primary Flow: {metrics.dominantDirection} →{' '}
          {getOppositeDirection(metrics.dominantDirection)}
        </div>
      </div>
    );
  }, [metrics.directionDistribution, metrics.dominantDirection, getOppositeDirection]);

  // Nearby places that might cause crowd formation
  const placesList = useMemo(() => {
    const places =
      nearbyPlaces.length > 0
        ? nearbyPlaces
        : [
            { name: 'Central Station', types: ['transit_station'], crowdLikelihood: 0.9 },
            { name: 'City Mall', types: ['shopping_mall'], crowdLikelihood: 0.8 },
            { name: 'Downtown Park', types: ['park'], crowdLikelihood: 0.7 },
            { name: 'Tourist Attraction', types: ['tourist_attraction'], crowdLikelihood: 0.85 },
          ];

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Crowd Formation Points</h3>
        <div className="space-y-3">
          {places.slice(0, 6).map((place, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="font-medium">{place.name || `Place ${index + 1}`}</div>
                <div className="text-xs text-gray-500">
                  {place.types && place.types[0]
                    ? place.types[0].replace('_', ' ')
                    : 'Unknown type'}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium">
                  {Math.round((place.crowdLikelihood || 0.5) * 100)}%
                </div>
                <div className="text-xs text-gray-500">Crowd likelihood</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [nearbyPlaces]);

  // Render the hourly distribution chart
  const hourlyChart = useMemo(() => {
    const maxCount = Math.max(...metrics.hourlyDistribution.map(h => h.count));

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Hourly Crowd Flow</h3>
        <div className="flex h-40 items-end mt-1 space-x-1">
          {metrics.hourlyDistribution.map(hour => (
            <div
              key={hour.hour}
              className="flex flex-col items-center"
              style={{ width: `${100 / 24}%` }}
            >
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{
                  height: `${(hour.count / maxCount) * 100}%`,
                  backgroundColor:
                    hour.hour >= 7 && hour.hour <= 9
                      ? '#F59E0B'
                      : hour.hour >= 16 && hour.hour <= 18
                        ? '#EF4444'
                        : '#3B82F6',
                }}
              ></div>
              <span className="text-xs mt-1">
                {hour.hour === 0
                  ? '12a'
                  : hour.hour === 12
                    ? '12p'
                    : hour.hour > 12
                      ? `${hour.hour - 12}p`
                      : `${hour.hour}a`}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Midnight</span>
          <span>Morning</span>
          <span>Noon</span>
          <span>Evening</span>
          <span>Night</span>
        </div>
      </div>
    );
  }, [metrics.hourlyDistribution]);

  // Fix the useMemo as well
  const chartData = useMemo(() => {
    // Convert direction distribution to chart data
    if (!metrics.directionDistribution) return [];
    
    return Object.entries(metrics.directionDistribution).map(([direction, count]) => {
      const percentage = (count / metrics.totalFlowPoints) * 100;
      const isOpposite = getOppositeDirection(metrics.dominantDirection) === direction;
      
      return {
        direction,
        count,
        percentage: parseFloat(percentage.toFixed(1)),
        isOpposite,
        isDominant: direction === metrics.dominantDirection,
      };
    });
  }, [metrics.directionDistribution, metrics.totalFlowPoints, metrics.dominantDirection, getOppositeDirection]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-blue-700 text-white">
        <h2 className="text-xl font-bold">{selectedCity.name} Crowd Analytics</h2>
        <div className="text-sm opacity-80">
          {selectedTimeRange.label} • Current Status:{' '}
          <span className="font-medium">{timePeriodStatus}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'patterns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('patterns')}
          >
            Movement Patterns
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'places'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('places')}
          >
            Crowd Hotspots
          </button>
        </nav>
      </div>

      <div className="p-5">
        {/* Overview tab content */}
        {activeTab === 'overview' && (
          <>
            {/* Main metrics cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Flow Volume</div>
                <div className="text-2xl font-bold">{metrics.totalFlowPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Movement points tracked</div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Average Speed</div>
                <div className="text-2xl font-bold">{(metrics.avgSpeed * 20).toFixed(1)} km/h</div>
                <div className="text-sm text-gray-500 mt-1">
                  Range: {(metrics.minSpeed * 20).toFixed(1)} - {(metrics.maxSpeed * 20).toFixed(1)}{' '}
                  km/h
                </div>
              </div>
            </div>

            {/* Direction and pattern */}
            <div className="mb-5">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Movement Pattern</div>
                <div className="text-xl font-bold mt-1">{metrics.directionTrend}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Dominant direction: {metrics.dominantDirection}
                </div>
              </div>
            </div>

            {/* Hourly chart */}
            {hourlyChart}
          </>
        )}

        {/* Patterns tab content */}
        {activeTab === 'patterns' && (
          <>
            {/* Direction distribution */}
            {directionChart}

            {/* Traffic flow characteristics */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Traffic Flow Characteristics</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-3">
                  <div className="font-medium">Average Speed</div>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-600 w-10">Slow</span>
                    <div className="flex-1 mx-2 bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, metrics.avgSpeed * 50)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">Fast</span>
                  </div>
                </div>

                <div>
                  <div className="font-medium">Flow Density</div>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-600 w-10">Light</span>
                    <div className="flex-1 mx-2 bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${60 + Math.random() * 30}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">Heavy</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Places tab content */}
        {activeTab === 'places' && (
          <>
            {/* Crowd formation points */}
            {placesList}

            {/* Hotspots */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Crowd Density Hotspots</h3>
              <div className="space-y-3">
                {metrics.hotspots.map(hotspot => (
                  <div key={hotspot.area} className="flex items-center">
                    <div className="flex-1">
                      <div className="font-medium">{hotspot.area}</div>
                    </div>
                    <div className="w-32 ml-4">
                      <div className="bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            hotspot.intensity > 80
                              ? 'bg-red-500'
                              : hotspot.intensity > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${hotspot.intensity}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-10 text-right text-sm ml-2">{hotspot.intensity}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrowdAnalyticsPanel;
