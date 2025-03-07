'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeRange } from '../types';
import { format, subDays, addHours, differenceInMinutes, differenceInHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface TimeSliderProps {
  selectedTimeRange: TimeRange;
  onTimeChange: (timestamp: number) => void;
  cityTimezone?: string; // e.g., 'America/Vancouver', 'Asia/Kolkata'
}

const TimeSlider = ({ selectedTimeRange, onTimeChange, cityTimezone = 'UTC' }: TimeSliderProps) => {
  const [sliderValue, setSliderValue] = useState(100); // 0-100 percentage
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [localTime, setLocalTime] = useState<Date>(new Date());
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  
  // Use refs to avoid dependency issues
  const sliderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const sliderValueRef = useRef(sliderValue);
  const animationSpeedRef = useRef(animationSpeed);
  
  // Update refs when state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    sliderValueRef.current = sliderValue;
  }, [sliderValue]);
  
  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  // Calculate time range in milliseconds based on selected time range
  const calculateTimeRangeMillis = useCallback(() => {
    const now = new Date();
    const startDate = subDays(now, selectedTimeRange.value || 7);
    return { 
      startTime: startDate.getTime(),
      endTime: now.getTime(),
      range: now.getTime() - startDate.getTime()
    };
  }, [selectedTimeRange.value]);
  
  // Calculate time from slider value
  const calculateTimeFromSlider = useCallback((value: number) => {
    const { startTime, range } = calculateTimeRangeMillis();
    return startTime + (range * (value / 100));
  }, [calculateTimeRangeMillis]);

  // Update time display when slider value changes
  useEffect(() => {
    const timestamp = calculateTimeFromSlider(sliderValue);
    const date = new Date(timestamp);
    
    // Convert to local timezone if provided
    const localDate = cityTimezone !== 'UTC' 
      ? toZonedTime(date, cityTimezone)
      : date;
    
    setLocalTime(localDate);
    
    // Format date for display
    const today = new Date();
    const diffHours = differenceInHours(today, localDate);
    
    let displayText = '';
    if (diffHours < 24) {
      displayText = `Today at ${format(localDate, 'h:mm a')}`;
    } else if (diffHours < 48) {
      displayText = `Yesterday at ${format(localDate, 'h:mm a')}`;
    } else {
      displayText = format(localDate, 'MMM d, yyyy h:mm a');
    }
    
    setTimeDisplay(displayText);
    onTimeChange(timestamp);
  }, [sliderValue, calculateTimeFromSlider, cityTimezone, onTimeChange]);

  // Update time range when selected time range changes
  useEffect(() => {
    // Reset slider to current time when time range changes
    setSliderValue(100);
  }, [selectedTimeRange]);

  // Get animation interval speed based on selection
  const getAnimationInterval = useCallback(() => {
    switch (animationSpeedRef.current) {
      case 'slow': return 500;
      case 'fast': return 100;
      case 'medium':
      default: return 200;
    }
  }, []);

  // Start animation function (extracted from togglePlay)
  const startAnimation = useCallback(() => {
    // Reset to start if already at end
    if (sliderValueRef.current >= 100) {
      setSliderValue(0);
    }
    
    // Calculate step size based on time range
    // Longer time ranges should move faster
    const stepSize = selectedTimeRange.value > 30 ? 2 : 
                     selectedTimeRange.value > 7 ? 1 : 0.5;
    
    // Clear any existing interval
    if (sliderIntervalRef.current) {
      clearInterval(sliderIntervalRef.current);
    }
    
    // Start animation interval
    const intervalId = setInterval(() => {
      setSliderValue(prev => {
        const newValue = prev + stepSize;
        if (newValue >= 100) {
          clearInterval(intervalId);
          setIsPlaying(false);
          return 100;
        }
        return newValue;
      });
    }, getAnimationInterval());
    
    sliderIntervalRef.current = intervalId;
  }, [selectedTimeRange.value, getAnimationInterval]);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      // Stop playing
      if (sliderIntervalRef.current) {
        clearInterval(sliderIntervalRef.current);
        sliderIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start playing
      setIsPlaying(true);
      startAnimation();
    }
  }, [startAnimation]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (sliderIntervalRef.current) {
        clearInterval(sliderIntervalRef.current);
      }
    };
  }, []);

  // Handle animation speed change
  const changeAnimationSpeed = useCallback(() => {
    const newSpeed = animationSpeed === 'slow' ? 'medium' : 
                    animationSpeed === 'medium' ? 'fast' : 'slow';
    
    setAnimationSpeed(newSpeed);
    
    // Restart the animation if it's playing
    if (isPlaying) {
      if (sliderIntervalRef.current) {
        clearInterval(sliderIntervalRef.current);
      }
      
      // Use setTimeout to ensure state updates before restarting
      setTimeout(startAnimation, 0);
    }
  }, [animationSpeed, isPlaying, startAnimation]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Time Control</h3>
        <div className="text-sm font-medium text-gray-600">{timeDisplay}</div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={togglePlay}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <button
          onClick={changeAnimationSpeed}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none"
          title="Change animation speed"
        >
          <span className="text-xs font-bold">
            {animationSpeed === 'slow' ? '1x' : animationSpeed === 'medium' ? '2x' : '3x'}
          </span>
        </button>
        
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={sliderValue} 
          onChange={(e) => setSliderValue(parseInt(e.target.value))} 
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{selectedTimeRange.value === 0 ? 'Custom' : `${selectedTimeRange.value} days ago`}</span>
        <span>Current</span>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Move the slider or press play to animate crowd movements over time</p>
      </div>
    </div>
  );
};

export default TimeSlider; 