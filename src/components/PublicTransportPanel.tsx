'use client';

import { useState, useEffect } from 'react';
import { City } from '../types';

interface PublicTransportPanelProps {
  selectedCity: City;
}

const PublicTransportPanel = ({ selectedCity }: PublicTransportPanelProps) => {
  const [transportType, setTransportType] = useState<'all' | 'bus' | 'train' | 'subway'>('all');
  const [currentCityName, setCurrentCityName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // When the city changes, update the data
  useEffect(() => {
    if (currentCityName !== selectedCity.name) {
      setCurrentCityName(selectedCity.name);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [selectedCity.name, currentCityName]);

  // Mock data for public transportation - in a real app, this would come from Google Maps Transit API
  const publicTransportData = {
    busRoutes: [
      {
        id: 'B1',
        name: `${selectedCity.name} Downtown Express`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
      {
        id: 'B2',
        name: `${selectedCity.name} University Line`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
      {
        id: 'B3',
        name: `${selectedCity.name} Coastal Route`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
    ],
    trainRoutes: [
      {
        id: 'T1',
        name: `${selectedCity.name} Central Line`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
      {
        id: 'T2',
        name: `${selectedCity.name} Eastern Corridor`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
    ],
    subwayRoutes: [
      {
        id: 'S1',
        name: `${selectedCity.name} Blue Line`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
      {
        id: 'S2',
        name: `${selectedCity.name} Red Line`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
      {
        id: 'S3',
        name: `${selectedCity.name} Green Line`,
        ridership: Math.floor(Math.random() * 30) + 60,
        congestion: Math.floor(Math.random() * 40) + 40,
        onTimePerformance: Math.floor(Math.random() * 30) + 60,
      },
    ],
    // Potential route optimization suggestions
    optimizationSuggestions: [
      `Increase frequency on ${selectedCity.name} Downtown Express during morning peak hours`,
      `Add express service to ${selectedCity.name} University Line during class change times`,
      `Consider new bus stop at ${selectedCity.name} Central Park & Commerce Street to reduce walking distance`,
      `Extend ${selectedCity.name} Blue Line operating hours to match nightlife activity`,
    ],
    // Integration with pedestrian data
    crowdedConnections: [
      {
        name: `${selectedCity.name} Central Station`,
        pedestrianLoad: 'Heavy',
        peakTimes: '7:30-9:00 AM, 5:00-6:30 PM',
      },
      {
        name: `${selectedCity.name} University Transit Hub`,
        pedestrianLoad: 'Moderate',
        peakTimes: '8:30-10:00 AM, 3:00-4:30 PM',
      },
      {
        name: `${selectedCity.name} Downtown Terminal`,
        pedestrianLoad: 'Heavy',
        peakTimes: '8:00-9:30 AM, 4:30-6:00 PM',
      },
    ],
  };

  // Filter routes based on selected transport type
  const getFilteredRoutes = () => {
    let routes = [];
    if (transportType === 'all' || transportType === 'bus')
      routes = [...routes, ...publicTransportData.busRoutes];
    if (transportType === 'all' || transportType === 'train')
      routes = [...routes, ...publicTransportData.trainRoutes];
    if (transportType === 'all' || transportType === 'subway')
      routes = [...routes, ...publicTransportData.subwayRoutes];
    return routes;
  };

  const filteredRoutes = getFilteredRoutes();

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Public Transportation Analysis</h2>
        <div className="flex space-x-2">
          <select
            value={transportType}
            onChange={e => setTransportType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Transport</option>
            <option value="bus">Bus Only</option>
            <option value="train">Train Only</option>
            <option value="subway">Subway Only</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Route Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Route</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Ridership</th>
                <th className="py-2 px-4 border-b text-left">Congestion</th>
                <th className="py-2 px-4 border-b text-left">On-Time %</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map(route => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{route.id}</td>
                  <td className="py-2 px-4 border-b">{route.name}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${route.ridership}%` }}
                        ></div>
                      </div>
                      <span>{route.ridership}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            route.congestion > 80
                              ? 'bg-red-500'
                              : route.congestion > 60
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${route.congestion}%` }}
                        ></div>
                      </div>
                      <span>{route.congestion}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            route.onTimePerformance < 75
                              ? 'bg-red-500'
                              : route.onTimePerformance < 85
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${route.onTimePerformance}%` }}
                        ></div>
                      </div>
                      <span>{route.onTimePerformance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Optimization Suggestions</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="space-y-2">
              {publicTransportData.optimizationSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-blue-800">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Crowded Transit Connections</h3>
          <div className="space-y-3">
            {publicTransportData.crowdedConnections.map((connection, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium">{connection.name}</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-xs text-gray-500">Pedestrian Load:</span>
                    <p
                      className={`text-sm font-medium ${
                        connection.pedestrianLoad === 'Heavy'
                          ? 'text-red-600'
                          : connection.pedestrianLoad === 'Moderate'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {connection.pedestrianLoad}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Peak Times:</span>
                    <p className="text-sm">{connection.peakTimes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
        <p className="font-medium">For City Officials:</p>
        <p>
          Use this data to optimize public transportation routes and schedules based on actual usage
          patterns. Consider adding additional capacity during peak hours or adjusting routes to
          better serve areas with high pedestrian traffic.
        </p>
      </div>
    </div>
  );
};

export default PublicTransportPanel;
