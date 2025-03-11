'use client';

import { useState, useRef, useEffect } from 'react';
import { City } from '../types';

interface CitySearchProps {
  onCitySelect: (city: City) => void;
}

const CitySearch = ({ onCitySelect }: CitySearchProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };

    checkGoogleMapsLoaded();
  }, []);

  // Initialize autocomplete after Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current) return;

    try {
      // Check if Places library is available
      if (!window.google.maps.places) {
        setPlacesError('Google Places API is not enabled for this API key.');
        return;
      }

      // Initialize Google Places Autocomplete
      autoCompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['geometry.location', 'name', 'formatted_address'],
      });

      // Add event listener for place selection
      autoCompleteRef.current.addListener('place_changed', () => {
        const place = autoCompleteRef.current?.getPlace();

        if (place && place.geometry && place.geometry.location) {
          const newCity: City = {
            name: place.name || searchValue,
            center: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            zoom: 12,
          };

          onCitySelect(newCity);
          setSearchValue(place.name || '');
        }
      });
    } catch (error) {
      console.error('Error initializing Places Autocomplete:', error);
      setPlacesError(
        'Failed to initialize Places API. Please use the quick select options instead.'
      );
    }

    return () => {
      // Clean up listeners when component unmounts
      if (autoCompleteRef.current) {
        google.maps.event.clearInstanceListeners(autoCompleteRef.current);
      }
    };
  }, [onCitySelect, searchValue, isGoogleLoaded]);

  // Handle manual city input (as fallback)
  const handleCityInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    // Create a simple city with a default location (can be improved)
    const newCity: City = {
      name: searchValue,
      center: {
        lat: 0, // Default to map center
        lng: 0,
      },
      zoom: 10,
    };

    onCitySelect(newCity);
  };

  return (
    <div className="w-full">
      {placesError ? (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
          <p>
            <strong>Note:</strong> {placesError}
          </p>
          <p className="mt-1">
            To fix: Enable the Places API in your{' '}
            <a
              href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Cloud Console
            </a>
            .
          </p>
        </div>
      ) : null}

      <form onSubmit={handleCityInputSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search for a city..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitySearch;
