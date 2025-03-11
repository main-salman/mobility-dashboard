'use client';

import { useState, useEffect } from 'react';
import { City } from '../types';

interface SafetyAnalysisPanelProps {
  selectedCity: City;
}

const SafetyAnalysisPanel = ({ selectedCity }: SafetyAnalysisPanelProps) => {
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'pedestrian' | 'bicycle' | 'vehicle'>(
    'all'
  );
  const [currentCityName, setCurrentCityName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // When the city changes, update the data
  useEffect(() => {
    if (currentCityName !== selectedCity.name) {
      setCurrentCityName(selectedCity.name);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [selectedCity.name, currentCityName]);

  // Generate random metrics for different cities
  const getRandomMetrics = () => {
    return {
      pedestrianIncidents: Math.floor(Math.random() * 15) + 3,
      bicycleIncidents: Math.floor(Math.random() * 14) + 2,
      vehicleIncidents: Math.floor(Math.random() * 15) + 2,
    };
  };

  // Mock data for safety analysis - in a real app, this would come from city data APIs or Google Maps
  const safetyData = {
    incidentHotspots: [
      {
        id: 1,
        location: `${selectedCity.name} Main St & 5th Ave`,
        ...getRandomMetrics(),
        riskLevel: 'high',
      },
      {
        id: 2,
        location: `${selectedCity.name} University Blvd & Park St`,
        ...getRandomMetrics(),
        riskLevel: 'high',
      },
      {
        id: 3,
        location: `${selectedCity.name} Downtown Shopping District`,
        ...getRandomMetrics(),
        riskLevel: 'high',
      },
      {
        id: 4,
        location: `${selectedCity.name} West End & River Road`,
        ...getRandomMetrics(),
        riskLevel: 'medium',
      },
      {
        id: 5,
        location: `${selectedCity.name} Central Park Entrance`,
        ...getRandomMetrics(),
        riskLevel: 'medium',
      },
    ],
    accessibilityIssues: [
      {
        location: `${selectedCity.name} Main St Sidewalks`,
        issue: 'Uneven pavement',
        affectedGroups: 'Wheelchair users, Elderly',
        priority: 'high',
      },
      {
        location: `${selectedCity.name} Downtown Crosswalks`,
        issue: 'Insufficient crossing time',
        affectedGroups: 'Elderly, Visually impaired',
        priority: 'high',
      },
      {
        location: `${selectedCity.name} Transit Stations`,
        issue: 'Limited ramp access',
        affectedGroups: 'Wheelchair users',
        priority: 'medium',
      },
      {
        location: `${selectedCity.name} University District`,
        issue: 'Missing audible signals',
        affectedGroups: 'Visually impaired',
        priority: 'medium',
      },
    ],
    safetyImprovements: [
      {
        type: 'Infrastructure',
        action: `Install pedestrian islands at 3 major ${selectedCity.name} intersections`,
        impact: 'Reduces crossing distance and exposure time',
      },
      {
        type: 'Signalization',
        action: `Extend pedestrian crossing times at 5 ${selectedCity.name} downtown intersections`,
        impact: 'Accommodates slower-moving pedestrians',
      },
      {
        type: 'Design',
        action: `Add protected bike lanes on ${selectedCity.name} Main St corridor`,
        impact: 'Separates bicycles from vehicle traffic',
      },
      {
        type: 'Enforcement',
        action: `Increase speed limit enforcement in ${selectedCity.name} school zones`,
        impact: 'Reduces vehicle speeds in high-pedestrian areas',
      },
    ],
    nighttimeSafetyMetrics: {
      poorlyLitAreas: [
        `${selectedCity.name} West End Commercial District`,
        `${selectedCity.name} University Path`,
        `${selectedCity.name} Riverside Park`,
      ],
      pedestrianActivityDrop: Math.floor(Math.random() * 30) + 50, // percentage drop from day to night
      recommendedImprovements: [
        `Increase street lighting along ${selectedCity.name} University Path`,
        `Install emergency call boxes in ${selectedCity.name} Riverside Park`,
        `Extend evening public transit service hours in ${selectedCity.name}`,
      ],
    },
  };

  const getFilteredHotspots = () => {
    return safetyData.incidentHotspots.filter(hotspot => {
      if (safetyFilter === 'all') return true;
      if (safetyFilter === 'pedestrian' && hotspot.pedestrianIncidents > 5) return true;
      if (safetyFilter === 'bicycle' && hotspot.bicycleIncidents > 5) return true;
      if (safetyFilter === 'vehicle' && hotspot.vehicleIncidents > 5) return true;
      return false;
    });
  };

  const filteredHotspots = getFilteredHotspots();

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Safety & Accessibility Analysis</h2>
        <div className="flex space-x-2">
          <select
            value={safetyFilter}
            onChange={e => setSafetyFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Incidents</option>
            <option value="pedestrian">Pedestrian Focus</option>
            <option value="bicycle">Bicycle Focus</option>
            <option value="vehicle">Vehicle Focus</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Incident Hotspots</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Location</th>
                <th className="py-2 px-4 border-b text-center">Pedestrian</th>
                <th className="py-2 px-4 border-b text-center">Bicycle</th>
                <th className="py-2 px-4 border-b text-center">Vehicle</th>
                <th className="py-2 px-4 border-b text-center">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotspots.map(hotspot => (
                <tr key={hotspot.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b font-medium">{hotspot.location}</td>
                  <td className="py-2 px-4 border-b text-center">
                    <span
                      className={`inline-block w-8 h-8 rounded-full ${
                        hotspot.pedestrianIncidents > 10
                          ? 'bg-red-100 text-red-800'
                          : hotspot.pedestrianIncidents > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      } flex items-center justify-center`}
                    >
                      {hotspot.pedestrianIncidents}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span
                      className={`inline-block w-8 h-8 rounded-full ${
                        hotspot.bicycleIncidents > 10
                          ? 'bg-red-100 text-red-800'
                          : hotspot.bicycleIncidents > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      } flex items-center justify-center`}
                    >
                      {hotspot.bicycleIncidents}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span
                      className={`inline-block w-8 h-8 rounded-full ${
                        hotspot.vehicleIncidents > 10
                          ? 'bg-red-100 text-red-800'
                          : hotspot.vehicleIncidents > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      } flex items-center justify-center`}
                    >
                      {hotspot.vehicleIncidents}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        hotspot.riskLevel === 'high'
                          ? 'bg-red-100 text-red-800'
                          : hotspot.riskLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {hotspot.riskLevel.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click any location on the map to view detailed incident data and safety recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Accessibility Issues</h3>
          <div className="space-y-3">
            {safetyData.accessibilityIssues.map((issue, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <h4 className="font-medium">{issue.location}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      issue.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : issue.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {issue.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm mt-1">{issue.issue}</p>
                <p className="text-xs text-gray-600 mt-1">Affects: {issue.affectedGroups}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended Safety Improvements</h3>
          <div className="space-y-3">
            {safetyData.safetyImprovements.map((improvement, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {improvement.type}
                </span>
                <p className="font-medium text-blue-800 mt-1">{improvement.action}</p>
                <p className="text-xs text-blue-700 mt-1">{improvement.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Nighttime Safety Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Poorly Lit Areas</h4>
            <ul className="space-y-1 text-sm">
              {safetyData.nighttimeSafetyMetrics.poorlyLitAreas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-5 h-5 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center justify-center mr-2">
                    !
                  </span>
                  {area}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <span className="text-sm font-medium">Nighttime Activity Drop:</span>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${safetyData.nighttimeSafetyMetrics.pedestrianActivityDrop}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm">
                  {safetyData.nighttimeSafetyMetrics.pedestrianActivityDrop}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Percentage decrease in pedestrian activity from daytime to nighttime
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Recommended Improvements</h4>
            <ul className="space-y-2">
              {safetyData.nighttimeSafetyMetrics.recommendedImprovements.map(
                (improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-5 h-5 bg-green-100 text-green-800 rounded-full text-xs flex items-center justify-center mr-2">
                      {index + 1}
                    </span>
                    <span>{improvement}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
        <p className="font-medium">For City Officials:</p>
        <p>
          This analysis identifies high-risk areas for pedestrians, cyclists, and vehicles. Use this
          data to prioritize safety improvements and accessibility enhancements. The nighttime
          analysis can help address safety concerns that may be reducing evening mobility in certain
          areas.
        </p>
      </div>
    </div>
  );
};

export default SafetyAnalysisPanel;
