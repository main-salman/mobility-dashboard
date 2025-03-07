'use client';

import { useState, useEffect } from 'react';
import { City, TimeRange } from '../types';

interface StatsPanelProps {
  selectedCity: City;
  selectedTimeRange: TimeRange;
}

const StatsPanel = ({ selectedCity, selectedTimeRange }: StatsPanelProps) => {
  const [metrics, setMetrics] = useState({
    dayNightRatio: "0.00",
    crowdDensity: 0,
    peakHours: '',
    avgVisitDuration: '',
    popularityTrend: '',
    visitorCount: ''
  });

  // Generate metrics when component mounts (client-side only)
  useEffect(() => {
    // Generate random stats for demonstration purposes
    const generateRandomStat = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const dayNightRatio = (0.4 + Math.random() * 0.6).toFixed(2);
    const crowdDensity = generateRandomStat(40, 85);
    const peakHours = `${generateRandomStat(10, 12)}:00 - ${generateRandomStat(17, 19)}:00`;
    const avgVisitDuration = `${generateRandomStat(1, 5)} hours`;
    const popularityTrend = Math.random() > 0.5 ? 'Increasing' : 'Decreasing';
    const visitorCount = generateRandomStat(5000, 50000).toLocaleString();

    setMetrics({
      dayNightRatio,
      crowdDensity,
      peakHours,
      avgVisitDuration,
      popularityTrend,
      visitorCount
    });
  }, [selectedCity.name, selectedTimeRange.id]); // Regenerate when city or time range changes

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
      <h2 className="text-xl font-bold mb-4">City Metrics: {selectedCity.name}</h2>
      <p className="text-sm text-gray-600 mb-4">Data for {selectedTimeRange.label}</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Day/Night Activity Ratio</h3>
          <div className="mt-1 flex items-end">
            <span className="text-2xl font-bold">{metrics.dayNightRatio}</span>
            <span className="text-sm ml-1 text-gray-500">({(Number(metrics.dayNightRatio) * 100).toFixed(0)}%)</span>
          </div>
          <p className="text-xs mt-1 text-gray-500">
            {Number(metrics.dayNightRatio) < 0.7 ? 'Low night activity - may indicate safety concerns' : 'Good night activity - suggests safe environment'}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Average Crowd Density</h3>
          <div className="mt-1">
            <span className="text-2xl font-bold">{metrics.crowdDensity}%</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                metrics.crowdDensity > 75 ? 'bg-red-500' : 
                metrics.crowdDensity > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`} 
              style={{ width: `${metrics.crowdDensity}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Peak Hours</h3>
          <div className="mt-1">
            <span className="text-lg font-bold">{metrics.peakHours}</span>
          </div>
          <p className="text-xs mt-1 text-gray-500">
            Highest crowd density during this time
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Average Visit Duration</h3>
          <div className="mt-1">
            <span className="text-lg font-bold">{metrics.avgVisitDuration}</span>
          </div>
          <p className="text-xs mt-1 text-gray-500">
            Time spent at cultural sites
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Popularity Trend</h3>
          <div className="mt-1 flex items-center">
            <span className="text-lg font-bold">{metrics.popularityTrend}</span>
            {metrics.popularityTrend === 'Increasing' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-semibold text-gray-500">Estimated Visitor Count</h3>
          <div className="mt-1">
            <span className="text-lg font-bold">{metrics.visitorCount}</span>
          </div>
          <p className="text-xs mt-1 text-gray-500">
            Total for {selectedTimeRange.label.toLowerCase()}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p><em>Note: This is simulated data for demonstration purposes. In a real implementation, this would be based on Google Maps API data, Google Places API, and other sources.</em></p>
      </div>
    </div>
  );
};

export default StatsPanel; 