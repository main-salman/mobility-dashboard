'use client';

import { useState, useEffect } from 'react';
import { City } from '../types';

interface TrafficMetricsPanelProps {
  selectedCity: City;
}

const TrafficMetricsPanel = ({ selectedCity }: TrafficMetricsPanelProps) => {
  const [selectedSeason, setSelectedSeason] = useState<
    'current' | 'summer' | 'winter' | 'spring' | 'fall'
  >('current');
  const [currentCityName, setCurrentCityName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // When the city changes, update the data
  useEffect(() => {
    if (currentCityName !== selectedCity.name) {
      setCurrentCityName(selectedCity.name);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [selectedCity.name, currentCityName]);

  // Generate random metrics data when city changes
  useEffect(() => {
    // Re-render component with new random data
    // This is just a dummy effect to trigger re-renders
  }, [refreshTrigger]);

  // Mock data - in a real application, this would come from Google Maps Traffic API
  const trafficMetrics = {
    current: {
      averageSpeed: Math.floor(Math.random() * 20) + 15, // 15-35 km/h
      congestionLevel: Math.floor(Math.random() * 40) + 40, // 40-80%
      peakHours: {
        morning: '7:30 AM - 9:30 AM',
        evening: '4:30 PM - 6:30 PM',
      },
      busyCrossings: [
        `${selectedCity.name} Main St & 5th Ave`,
        `${selectedCity.name} Park Road & Commerce St`,
        `${selectedCity.name} Central Avenue & Market St`,
      ],
      congestionTrend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
    },
    summer: {
      averageSpeed: Math.floor(Math.random() * 20) + 20, // 20-40 km/h
      congestionLevel: Math.floor(Math.random() * 30) + 30, // 30-60%
      peakHours: {
        morning: '8:00 AM - 9:30 AM',
        evening: '4:00 PM - 6:00 PM',
      },
      busyCrossings: [
        'Beach Road & Coastal Highway',
        'Tourist Center & Downtown Crossing',
        'Central Park & Main St',
      ],
      congestionTrend: 'increasing',
    },
    winter: {
      averageSpeed: Math.floor(Math.random() * 15) + 10, // 10-25 km/h
      congestionLevel: Math.floor(Math.random() * 20) + 60, // 60-80%
      peakHours: {
        morning: '7:00 AM - 9:00 AM',
        evening: '3:30 PM - 5:30 PM',
      },
      busyCrossings: [
        'Main St & 5th Ave',
        'School Zone & Residential Area',
        'Shopping District & Highway Exit',
      ],
      congestionTrend: 'decreasing',
    },
    spring: {
      averageSpeed: Math.floor(Math.random() * 15) + 18, // 18-33 km/h
      congestionLevel: Math.floor(Math.random() * 30) + 40, // 40-70%
      peakHours: {
        morning: '7:30 AM - 9:00 AM',
        evening: '4:00 PM - 6:00 PM',
      },
      busyCrossings: [
        'Park Entrance & Boulevard',
        'University District & Transit Hub',
        'Commercial District & Main St',
      ],
      congestionTrend: 'stable',
    },
    fall: {
      averageSpeed: Math.floor(Math.random() * 18) + 17, // 17-35 km/h
      congestionLevel: Math.floor(Math.random() * 25) + 45, // 45-70%
      peakHours: {
        morning: '7:30 AM - 9:30 AM',
        evening: '4:30 PM - 6:00 PM',
      },
      busyCrossings: [
        'School Zone & Residential Area',
        'Shopping District & Business Park',
        'Downtown & Transit Hub',
      ],
      congestionTrend: 'increasing',
    },
  };

  const currentData = trafficMetrics[selectedSeason];

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Traffic Congestion Metrics</h2>
        <div className="flex space-x-2">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current Season</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
            <option value="spring">Spring</option>
            <option value="fall">Fall</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Average Traffic Speed</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{currentData.averageSpeed}</span>
            <span className="text-lg ml-1 text-gray-600">km/h</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                currentData.averageSpeed < 15
                  ? 'bg-red-500'
                  : currentData.averageSpeed < 25
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${(currentData.averageSpeed / 50) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {currentData.averageSpeed < 15
              ? 'Severe congestion'
              : currentData.averageSpeed < 25
                ? 'Moderate traffic'
                : 'Good flow'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Congestion Level</h3>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{currentData.congestionLevel}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                currentData.congestionLevel > 70
                  ? 'bg-red-500'
                  : currentData.congestionLevel > 40
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${currentData.congestionLevel}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Trend: <span className="font-medium">{currentData.congestionTrend}</span>
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Peak Congestion Hours</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Morning:</span>
              <p className="font-medium">{currentData.peakHours.morning}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Evening:</span>
              <p className="font-medium">{currentData.peakHours.evening}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Plan city activities outside these hours to reduce congestion
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Busiest Intersections</h3>
          <ul className="space-y-1">
            {currentData.busyCrossings.map((crossing, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-5 h-5 bg-red-100 text-red-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">
                  {index + 1}
                </span>
                <span>{crossing}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Consider additional traffic management at these locations
          </p>
        </div>
      </div>

      <div className="mt-5 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
        <p className="font-medium">For City Officials:</p>
        <p>
          This data can help prioritize traffic management resources and plan roadwork during
          off-peak hours. Compare seasonal patterns to prepare for expected changes throughout the
          year.
        </p>
      </div>
    </div>
  );
};

export default TrafficMetricsPanel;
