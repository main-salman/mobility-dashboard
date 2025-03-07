'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_CITIES, TIME_RANGES } from '../utils/data';
import { City, TimeRange } from '../types';
import ControlPanel from '../components/ControlPanel';
import StatsPanel from '../components/StatsPanel';
import TimeSlider from '../components/TimeSlider';
import TrafficMetricsPanel from '../components/TrafficMetricsPanel';
import PublicTransportPanel from '../components/PublicTransportPanel';
import SafetyAnalysisPanel from '../components/SafetyAnalysisPanel';

// Import the Map component dynamically to avoid SSR issues with Google Maps
const Map = dynamic(() => import('../components/Map'), {
  loading: () => <div className="h-[70vh] w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>,
  ssr: false
});

// Also import CitySearch dynamically to avoid 'google is not defined' error
const DynamicCitySearch = dynamic(() => import('../components/CitySearch'), {
  ssr: false
});

// Pass this to ControlPanel to use the dynamic CitySearch
const CitySearchWrapper = (props: any) => {
  return <DynamicCitySearch {...props} />;
};

// City timezone mapping
const CITY_TIMEZONES: Record<string, string> = {
  'Vancouver': 'America/Vancouver',
  'Madinah': 'Asia/Riyadh',
  'Delhi': 'Asia/Kolkata',
  'Lahore': 'Asia/Karachi'
};

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITIES[0]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[0]);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | undefined>(undefined);
  const [cityTimezone, setCityTimezone] = useState<string>('America/Vancouver');
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'transport' | 'safety'>('overview');
  const [placesApiError, setPlacesApiError] = useState(false);

  // Check if Places API is available
  useEffect(() => {
    const checkPlacesApi = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        try {
          // Check if Places API is available
          if (!window.google.maps.places) {
            setPlacesApiError(true);
          }
        } catch (e) {
          setPlacesApiError(true);
        }
      } else {
        // Try again in a second if Google Maps isn't loaded yet
        setTimeout(checkPlacesApi, 1000);
      }
    };
    
    checkPlacesApi();
  }, []);

  // Update timezone when city changes
  useEffect(() => {
    const timezone = CITY_TIMEZONES[selectedCity.name] || 'UTC';
    setCityTimezone(timezone);
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gray-50">
      {placesApiError && (
        <div className="bg-yellow-50 border-b border-yellow-200 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Places API Not Enabled</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>For full functionality, enable the Places API in your <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="font-medium underline">Google Cloud Console</a>. Some features will use simulated data instead.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Urban Mobility Dashboard</h1>
          <p className="text-gray-600 text-sm">Visualize crowd density and mobility patterns for urban planning</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Current Selection: {selectedCity.name}</h2>
          <p className="text-gray-600">Visualizing data for {selectedTimeRange.label}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ControlPanel 
              onCityChange={setSelectedCity}
              onTimeRangeChange={setSelectedTimeRange}
              selectedCity={selectedCity}
              selectedTimeRange={selectedTimeRange}
              CitySearchComponent={CitySearchWrapper}
            />
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <Map 
                selectedCity={selectedCity}
                selectedTimeRange={selectedTimeRange}
                currentTimestamp={currentTimestamp}
                shouldAnimateHeatmap={false}
              />
            </div>
            
            <div className="mb-6">
              <TimeSlider 
                selectedTimeRange={selectedTimeRange}
                onTimeChange={setCurrentTimestamp}
                cityTimezone={cityTimezone}
              />
            </div>
            
            {/* Tab Navigation for City Administration Data */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    City Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('traffic')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'traffic'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Traffic Metrics
                  </button>
                  <button
                    onClick={() => setActiveTab('transport')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'transport'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Public Transport
                  </button>
                  <button
                    onClick={() => setActiveTab('safety')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'safety'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Safety & Accessibility
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Conditional rendering based on active tab */}
            {activeTab === 'overview' && (
              <StatsPanel 
                selectedCity={selectedCity}
                selectedTimeRange={selectedTimeRange}
              />
            )}
            
            {activeTab === 'traffic' && (
              <TrafficMetricsPanel
                selectedCity={selectedCity}
              />
            )}
            
            {activeTab === 'transport' && (
              <PublicTransportPanel
                selectedCity={selectedCity}
              />
            )}
            
            {activeTab === 'safety' && (
              <SafetyAnalysisPanel
                selectedCity={selectedCity}
              />
            )}
          </div>
        </div>

        <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">City Administrator Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Analyze Traffic Patterns</h3>
              <p className="text-gray-600">Identify congestion hotspots and compare seasonal traffic variations to optimize road infrastructure and traffic management.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Improve Public Transport</h3>
              <p className="text-gray-600">Optimize bus routes and schedules based on ridership patterns and coordinate with pedestrian movement data.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Enhance Safety & Accessibility</h3>
              <p className="text-gray-600">Identify accident-prone areas and accessibility challenges to create safer streets for all residents including those with disabilities.</p>
            </div>
          </div>
          
          <div className="mt-6 text-gray-600">
            <p><strong>Note for City Officials:</strong> This dashboard aggregates mobility data to help you make data-driven decisions about urban planning, public transportation, and safety improvements. The data is intended to help prioritize resources and measure the impact of city initiatives.</p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-lg font-semibold mb-2">Urban Mobility Dashboard</h2>
              <p className="text-gray-400 text-sm">
                A tool for city planners and administrators to visualize and analyze urban mobility patterns.
              </p>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2">Powered By</h3>
              <ul className="text-gray-400 text-sm">
                <li>Next.js</li>
                <li>Google Maps API</li>
                <li>Google Places API</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Urban Mobility Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
