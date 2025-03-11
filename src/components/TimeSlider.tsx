'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeRange } from '../types';
import {
  calculateTimeInterval,
  formatTime,
  formatDate,
  generateTimeMarkers,
  roundToNearestInterval,
} from '../utils/timeUtils';

interface TimeSliderProps {
  selectedTimeRange: TimeRange;
  onTimeChange: (timestamp: number) => void;
  onAnimationStateChange?: (isPlaying: boolean) => void;
  cityTimezone?: string; // e.g., 'America/Vancouver', 'Asia/Kolkata'
  currentTimestamp?: number; // For parent-driven time control
}

const TimeSlider = ({
  selectedTimeRange,
  onTimeChange,
  onAnimationStateChange,
  cityTimezone = 'UTC',
  currentTimestamp,
}: TimeSliderProps) => {
  // State for tracking slider position
  const [sliderValue, setSliderValue] = useState(100); // 0 to 100 percent

  // State for tracking current display time
  const [displayTime, setDisplayTime] = useState<number>(Date.now());

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x is normal speed

  // Interval markers for the slider (memoized to reduce re-renders)
  const [timeMarkers, setTimeMarkers] = useState<{ timestamp: number; label: string }[]>([]);

  // Store the stop state in a ref to prevent race conditions
  const hasStoppedRef = useRef(false);

  // Animation frame tracking
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastOnChangeCallRef = useRef<number>(0);

  // Add a debounced version of the stop function to prevent rapid clicking issues
  const [isStopButtonDisabled, setIsStopButtonDisabled] = useState(false);

  // Calculate time range boundaries - memoized for performance
  const calculateTimeRange = useCallback(() => {
    const now = Date.now();
    const startTime = now - selectedTimeRange.value * 24 * 60 * 60 * 1000;
    return { startTime, endTime: now };
  }, [selectedTimeRange.value]);

  // Convert slider value to timestamp (memoized)
  const sliderToTimestamp = useCallback(
    (value: number) => {
      const { startTime, endTime } = calculateTimeRange();
      const timestamp = startTime + (endTime - startTime) * (value / 100);

      // Round to nearest interval if needed
      const interval = calculateTimeInterval(selectedTimeRange);
      return roundToNearestInterval(timestamp, interval);
    },
    [calculateTimeRange, selectedTimeRange]
  );

  // Convert timestamp to slider value (memoized)
  const timestampToSlider = useCallback(
    (timestamp: number) => {
      const { startTime, endTime } = calculateTimeRange();
      const totalRange = endTime - startTime;
      const position = timestamp - startTime;
      return Math.max(0, Math.min(100, (position / totalRange) * 100));
    },
    [calculateTimeRange]
  );

  // Update time markers, slider position, and reset animation when time range changes
  useEffect(() => {
    // Calculate the interval based on granularity
    const interval = selectedTimeRange.granularity || 60; // Default to hourly intervals
    
    // Adjust marker interval based on range length to prevent too many markers
    let markerInterval = interval;
    
    if (interval <= 15) {
      // 15 minute intervals or less
      markerInterval = interval * 6; // Show every 6th marker (e.g., every 90 min for 15 min granularity)
    } else if (interval <= 60) {
      // Less than 1 hour
      markerInterval = interval * 4; // Show every 4th marker
    } else if (interval < 240) {
      // Less than 4 hours
      markerInterval = interval * 2; // Show every 2nd marker
    }
    
    // Generate markers with the adjusted interval
    const markersWithInterval = {
      ...selectedTimeRange,
      granularity: markerInterval,
    };
    
    const markers = generateTimeMarkers(markersWithInterval, cityTimezone);
    
    // If we still have too many markers, sample them
    let finalMarkers = markers;
    if (markers.length > 10) {
      const skipFactor = Math.ceil(markers.length / 10);
      finalMarkers = markers.filter((_, index) => index % skipFactor === 0);
    }
    
    setTimeMarkers(finalMarkers);
    
    // Reset slider to end (current time)
    setSliderValue(100);
    setDisplayTime(Date.now());
    
    // Stop any running animation
    if (isPlaying) {
      setIsPlaying(false);
      if (onAnimationStateChange) onAnimationStateChange(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [selectedTimeRange, cityTimezone, onAnimationStateChange, isPlaying]);

  // Handle parent-driven time changes
  useEffect(() => {
    if (currentTimestamp && !isPlaying) {
      setDisplayTime(currentTimestamp);
      setSliderValue(timestampToSlider(currentTimestamp));
    }
  }, [currentTimestamp, isPlaying, timestampToSlider]);

  // Throttle time updates to prevent too many API calls
  const throttledTimeChange = useCallback(
    (newTimestamp: number) => {
      const now = Date.now();
      if (now - lastOnChangeCallRef.current < 500) {
        // Throttle to max once per 500ms
        return;
      }
      lastOnChangeCallRef.current = now;
      onTimeChange(newTimestamp);
    },
    [onTimeChange]
  );

  // Animation loop with throttling
  const animate = useCallback(() => {
    // Don't continue if stopped
    if (hasStoppedRef.current) {
      return;
    }

    const { startTime, endTime } = calculateTimeRange();
    const now = Date.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = now;

    // Calculate how much to advance the time based on play speed
    const intervalMs = calculateTimeInterval(selectedTimeRange) * 60 * 1000; // Convert minutes to ms
    const timeAdvancement = (deltaTime * playSpeed * 5) / 1000; // 5 is a multiplier to make animation visible

    // Calculate new display time by advancing proportionally through time range
    const totalRangeMs = endTime - startTime;
    const advancementMs = (totalRangeMs / 100) * timeAdvancement;

    let newDisplayTime = displayTime + advancementMs;

    // Loop back to start when reaching the end
    if (newDisplayTime > endTime) {
      newDisplayTime = startTime;
    }

    // Round to nearest interval
    newDisplayTime = roundToNearestInterval(
      newDisplayTime,
      calculateTimeInterval(selectedTimeRange)
    );

    // Update display time and slider
    setDisplayTime(newDisplayTime);
    setSliderValue(timestampToSlider(newDisplayTime));

    // Notify parent (throttled)
    throttledTimeChange(newDisplayTime);

    // Continue animation only if not stopped
    if (!hasStoppedRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [
    calculateTimeRange,
    displayTime,
    playSpeed,
    timestampToSlider,
    selectedTimeRange,
    throttledTimeChange,
  ]);

  // Start/stop animation effect
  useEffect(() => {
    // Reset the stopped flag whenever isPlaying changes
    hasStoppedRef.current = false;

    if (isPlaying) {
      // Initialize the animation timing
      lastUpdateTimeRef.current = Date.now();
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
      
      // Notify parent component
      if (onAnimationStateChange) {
        onAnimationStateChange(true);
      }
    } else {
      // Stop any running animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Notify parent component
      if (onAnimationStateChange) {
        onAnimationStateChange(false);
      }
    }

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Reset the stopped state on cleanup
      hasStoppedRef.current = false;
    };
  }, [isPlaying, animate, onAnimationStateChange]);

  // Handle slider change by user (throttled)
  const handleSliderChange = useCallback(
    (newValue: number) => {
      setSliderValue(newValue);
      const newTimestamp = sliderToTimestamp(newValue);
      setDisplayTime(newTimestamp);
      throttledTimeChange(newTimestamp);
    },
    [sliderToTimestamp, throttledTimeChange]
  );

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    hasStoppedRef.current = false;
    setIsPlaying(prev => !prev);
  }, []);

  // Stop playback and reset to current time
  const stopPlayback = useCallback(() => {
    // Set the stopped flag to true to prevent animation from continuing
    hasStoppedRef.current = true;
    
    // Stop the animation state
    setIsPlaying(false);
    
    // Make sure to notify the parent component
    if (onAnimationStateChange) {
      onAnimationStateChange(false);
    }
    
    // Cancel any ongoing animation frame immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset slider to end (current time)
    const { endTime } = calculateTimeRange();
    
    // Batch these state updates to avoid race conditions
    setSliderValue(100);
    setDisplayTime(endTime);
    throttledTimeChange(endTime);
    
    // Force a delay to ensure state updates
    setTimeout(() => {
      if (hasStoppedRef.current) {  // Check if we're still stopped
        setSliderValue(100);
        setDisplayTime(endTime);
        throttledTimeChange(endTime);
      }
    }, 100);
  }, [calculateTimeRange, throttledTimeChange, onAnimationStateChange]);

  // Adjust play speed
  const adjustSpeed = useCallback(() => {
    // Cycle through speeds: 1x -> 2x -> 5x -> 0.5x -> 1x
    const speeds = [1, 2, 5, 0.5];
    const currentIndex = speeds.indexOf(playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaySpeed(speeds[nextIndex]);
  }, [playSpeed]);

  // Memoized time marker rendering to prevent excessive re-renders
  const renderTimeMarkers = useCallback(() => {
    return timeMarkers.map((marker, index) => {
      // Calculate position as percentage
      const position = timestampToSlider(marker.timestamp);
      return (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${position}%` }}
        >
          <div className="h-2 w-1 bg-gray-400"></div>
          <div className="text-xs text-gray-500 mt-1">{marker.label}</div>
        </div>
      );
    });
  }, [timeMarkers, timestampToSlider]);

  // Add a debounced version of the stop function to prevent rapid clicking issues
  const handleStopClick = useCallback(() => {
    if (isStopButtonDisabled) return;
    
    // Disable the button temporarily
    setIsStopButtonDisabled(true);
    
    // Call the actual stop function
    stopPlayback();
    
    // Re-enable after a delay
    setTimeout(() => {
      setIsStopButtonDisabled(false);
    }, 300);
  }, [stopPlayback, isStopButtonDisabled]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Time Control</h3>
        <div className="flex space-x-2">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isPlaying ? (
              <span>⏸</span>
            ) : (
              <span>▶️</span>
            )}
          </button>

          <button
            onClick={handleStopClick}
            disabled={isStopButtonDisabled}
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              isStopButtonDisabled 
                ? 'bg-red-300 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 active:bg-red-700 cursor-pointer'
            } text-white`}
            title="Stop and reset"
          >
            <span className="text-base">⏹</span>
          </button>

          <button
            onClick={adjustSpeed}
            className="flex items-center justify-center px-2 h-8 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium"
          >
            {playSpeed}x
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium text-gray-700 mb-1">
          {formatDate(displayTime, cityTimezone)}
        </div>
        <div className="text-lg font-bold">{formatTime(displayTime, cityTimezone)}</div>
      </div>

      <div className="relative mb-4">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={e => handleSliderChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* Time markers - render once timeMarkers are available */}
        <div className="w-full h-6 relative mt-1">{renderTimeMarkers()}</div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{selectedTimeRange.value} days ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};

export default TimeSlider;
