'use client';

import { useState } from 'react';
import { City, TimeRange } from '../types';
import { DEFAULT_CITIES, TIME_RANGES } from '../utils/data';
import CitySearch from './CitySearch';

interface ControlPanelProps {
  onCityChange: (city: City) => void;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  selectedCity: City;
  selectedTimeRange: TimeRange;
  CitySearchComponent?: React.ComponentType<any>;
}

const ControlPanel = ({ 
  onCityChange, 
  onTimeRangeChange, 
  selectedCity, 
  selectedTimeRange,
  CitySearchComponent
}: ControlPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Use the provided component or fall back to the default
  const SearchComponent = CitySearchComponent || CitySearch;

  return (
    <div className={`bg-white shadow-lg rounded-lg p-4 md:p-6 ${isOpen ? 'w-full md:w-80' : 'w-12'} transition-all duration-300`}>
      {isOpen ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Dashboard Controls</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Search City</h3>
            <SearchComponent onCitySelect={onCityChange} />
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Quick Select</h3>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => onCityChange(city)}
                  className={`py-2 px-3 rounded-md text-sm ${
                    selectedCity.name === city.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Time Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIME_RANGES.map((timeRange) => (
                <button
                  key={timeRange.id}
                  onClick={() => onTimeRangeChange(timeRange)}
                  className={`py-2 px-3 rounded-md text-sm ${
                    selectedTimeRange.id === timeRange.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {timeRange.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Legend</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Cultural Sites</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-12 h-3 bg-gradient-to-r from-blue-300 to-red-600 rounded mr-2"></div>
                <span className="text-sm">Crowd Density</span>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <p>Use the time slider to view crowd changes over time</p>
                <p>Click on the map to analyze specific areas</p>
                <p>Click on markers for detailed information</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Currently Viewing</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium">{selectedCity.name}</p>
              <p className="text-sm text-gray-600">{selectedTimeRange.label}</p>
            </div>
          </div>
        </>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full h-full flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ControlPanel; 