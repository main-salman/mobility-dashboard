'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { City, TimeRange } from '../types';
import { TrafficFlowPoint } from '../utils/maps';

interface StatsPanelProps {
  selectedCity: City;
  selectedTimeRange: TimeRange;
  flowPoints?: TrafficFlowPoint[];
  currentTimestamp?: number;
}

const StatsPanel = ({
  selectedCity,
  selectedTimeRange,
  flowPoints = [],
  currentTimestamp,
}: StatsPanelProps) => {
  // Main metrics state
  const [metrics, setMetrics] = useState({
    crowdDensity: 0,
    peakHours: '',
    avgSpeed: 0,
    dominantDirection: '',
    busyAreas: [] as string[],
    hourlyDistribution: [] as { hour: number; count: number }[],
  });

  // Chart visibility toggle
  const [showCharts, setShowCharts] = useState(false);

  // Helper function to get peak hours based on the city
  const getPeakHoursForCity = useCallback((city: City) => {
    const cityPatterns: Record<string, string> = {
      Vancouver: '7:30-9:15 AM, 4:15-6:00 PM',
      Toronto: '7:45-9:30 AM, 4:30-6:30 PM',
      Bangalore: '9:00-10:30 AM, 5:30-7:30 PM',
      'New York': '7:00-9:30 AM, 4:00-7:00 PM',
      London: '7:30-9:30 AM, 4:30-6:30 PM',
      Paris: '8:00-9:30 AM, 5:30-7:00 PM',
      Tokyo: '7:30-9:00 AM, 5:30-8:00 PM',
      Singapore: '8:00-9:30 AM, 5:30-7:30 PM',
      Sydney: '7:30-9:30 AM, 4:30-6:30 PM',
      Dubai: '7:30-9:30 AM, 5:00-8:00 PM',
      Delhi: '8:30-10:30 AM, 5:00-8:00 PM',
      Lahore: '8:00-10:00 AM, 4:30-7:00 PM',
    };
    
    return cityPatterns[city.name] || '8:00-10:00 AM, 5:00-7:00 PM';
  }, []);

  // Helper function to get busy areas for the city
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
        'Financial District',
        'Yonge-Dundas Square',
        'Kensington Market',
        'Distillery District'
      ],
      Delhi: [
        'Connaught Place',
        'Chandni Chowk',
        'India Gate',
        'Sarojini Nagar'
      ],
      Lahore: [
        'Mall Road',
        'Anarkali Bazaar',
        'Gulberg',
        'Defence'
      ],
      London: [
        'Oxford Street',
        'Piccadilly Circus',
        'Camden Market',
        'Westminster'
      ],
    };
    
    return cityAreas[city.name] || [
      'Downtown',
      'City Center',
      'Main Square',
      'Tourist Area'
    ];
  }, []);

  // Convert bearing angle to compass direction
  const getBearingAsDirection = useCallback((bearing: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(bearing / 45) % 8];
  }, []);

  // Calculate expected traffic volume by hour of day
  const calculateHourlyTraffic = useCallback((hour: number): number => {
    // Morning rush hour (7-9 AM)
    if (hour >= 7 && hour <= 9) {
      return Math.round(60 + Math.random() * 40);
    }
    // Evening rush hour (4-7 PM)
    else if (hour >= 16 && hour <= 18) {
      return Math.round(65 + Math.random() * 35);
    }
    // Lunch time (12-1 PM)
    else if (hour >= 12 && hour <= 13) {
      return Math.round(50 + Math.random() * 20);
    }
    // Late night (0-5 AM)
    else if (hour >= 0 && hour <= 5) {
      return Math.round(5 + Math.random() * 10);
    }
    // Regular daytime
    else {
      return Math.round(20 + Math.random() * 30);
    }
  }, []);

  // Generate demo metrics when no real data is available
  const generateDemoMetrics = useCallback(() => {
    // Generate demo metrics
    const dayNightRatio = parseFloat((1 + Math.random() * 1.5).toFixed(1));
    const peakHours = getPeakHoursForCity(selectedCity);
    const crowdDensity = Math.round(40 + Math.random() * 30);
    
    // Generate busy areas
    const busyAreas = getBusyAreasForCity(selectedCity)
      .map((area, index) => ({
        name: area,
        density: 90 - index * 10,
        dayNightRatio: (1 + Math.random() * 1.5).toFixed(1)
      }));
    
    // Generate hourly distribution for the graph
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: calculateHourlyTraffic(i)
    }));
    
    setMetrics({
      dayNightRatio,
      peakHours,
      crowdDensity,
      busyAreas,
      hourlyDistribution
    });
  }, [selectedCity, getPeakHoursForCity, getBusyAreasForCity, calculateHourlyTraffic, setMetrics]);

  // Calculate real metrics based on flow points
  useEffect(() => {
    if (flowPoints.length === 0) {
      // Generate realistic demo data if no flow points
      generateDemoMetrics();
      return;
    }

    // Calculate real metrics from flow points
    const avgIntensity =
      flowPoints.reduce((sum, point) => sum + (point.intensity || 1), 0) / flowPoints.length;
    const crowdDensity = Math.round(avgIntensity * 50); // Convert to percentage

    const avgSpeed = flowPoints.reduce((sum, point) => sum + point.speed, 0) / flowPoints.length;

    // Count points by direction
    const directionCounts: Record<string, number> = {};
    flowPoints.forEach(point => {
      const direction = getBearingAsDirection(point.bearing);
      directionCounts[direction] = (directionCounts[direction] || 0) + 1;
    });

    // Find dominant direction
    const dominantDirection =
      Object.entries(directionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([dir]) => dir)[0] || 'N/A';

    // Simulate busy areas based on city
    const busyAreas = getBusyAreasForCity(selectedCity);

    // Create hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: calculateHourlyTraffic(i),
    }));

    setMetrics({
      crowdDensity,
      peakHours: getPeakHoursForCity(selectedCity),
      avgSpeed,
      dominantDirection,
      busyAreas,
      hourlyDistribution,
    });
  }, [flowPoints, selectedCity, generateDemoMetrics, calculateHourlyTraffic, getBearingAsDirection, getBusyAreasForCity, getPeakHoursForCity]);

  // Determine current time period status
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

  // Visualize hourly distribution chart (simplified version)
  const hourlyDistributionChart = useMemo(() => {
    const maxCount = Math.max(...metrics.hourlyDistribution.map(h => h.count));

    return (
      <div className="mb-5">
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-blue-700 text-white">
        <h2 className="text-xl font-bold">{selectedCity.name} Crowd Analytics</h2>
        <div className="text-sm opacity-80">
          {selectedTimeRange.label} • Current Status:{' '}
          <span className="font-medium">{timePeriodStatus}</span>
        </div>
      </div>

      <div className="p-5">
        {/* Main metrics cards */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Crowd Density</div>
            <div className="text-2xl font-bold">{metrics.crowdDensity}%</div>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  metrics.crowdDensity > 70
                    ? 'bg-red-500'
                    : metrics.crowdDensity > 40
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${metrics.crowdDensity}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Movement Speed</div>
            <div className="text-2xl font-bold">{(metrics.avgSpeed * 20).toFixed(1)} km/h</div>
            <div className="text-sm text-gray-500 mt-1">
              {metrics.avgSpeed < 0.8
                ? 'Slow traffic'
                : metrics.avgSpeed < 1.3
                  ? 'Moderate flow'
                  : 'Fast movement'}
            </div>
          </div>
        </div>

        {/* Detailed metrics */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Traffic Details</h3>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Hours:</span>
              <span className="font-medium">{metrics.peakHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Primary Direction:</span>
              <span className="font-medium">{metrics.dominantDirection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Busiest Areas:</span>
              <span className="font-medium text-right">
                {metrics.busyAreas.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Charts section */}
        {showCharts && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {hourlyDistributionChart}

            <div className="mb-5">
              <h3 className="text-lg font-semibold mb-2">Busy Areas</h3>
              <div className="space-y-2">
                {metrics.busyAreas.map((area, index) => (
                  <div key={area} className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${100 - index * 15}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
