import {
  format,
  addMinutes,
  subDays,
  differenceInMinutes,
  differenceInHours,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  startOfHour,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { TimeRange } from '../types';

/**
 * Calculates time intervals based on the age of the data
 * @param timeRange Selected time range
 * @returns Appropriate time interval in minutes
 */
export const calculateTimeInterval = (timeRange: TimeRange): number => {
  // Use granularity if explicitly specified
  if (timeRange.granularity) {
    return timeRange.granularity;
  }

  // Otherwise determine based on time range value
  if (timeRange.value <= 1) return 15; // 15-minute intervals for 1 day
  if (timeRange.value <= 3) return 30; // 30-minute intervals for 2-3 days
  if (timeRange.value <= 7) return 60; // 1-hour intervals for 4-7 days
  if (timeRange.value <= 30) return 120; // 2-hour intervals for 8-30 days
  return 240; // 4-hour intervals for longer periods
};

/**
 * Rounds a timestamp to the nearest interval
 * @param timestamp Timestamp to round
 * @param intervalMinutes Interval in minutes
 * @returns Rounded timestamp
 */
export const roundToNearestInterval = (timestamp: number, intervalMinutes: number): number => {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const remainder = minutes % intervalMinutes;

  // Round to nearest interval
  if (remainder < intervalMinutes / 2) {
    // Round down
    return date.setMinutes(minutes - remainder, 0, 0);
  } else {
    // Round up
    return date.setMinutes(minutes + (intervalMinutes - remainder), 0, 0);
  }
};

/**
 * Generates time markers for the selected time range
 * @param timeRange Selected time range
 * @param tzString Timezone string (e.g., 'America/New_York')
 * @returns Array of time markers
 */
export const generateTimeMarkers = (
  timeRange: TimeRange,
  tzString: string = 'UTC'
): { timestamp: number; label: string }[] => {
  const now = new Date();
  const interval = calculateTimeInterval(timeRange);
  const markers: { timestamp: number; label: string }[] = [];

  // Start time is X days ago
  const startTime = subDays(now, timeRange.value);
  // Calculate number of intervals
  const totalMinutes = differenceInMinutes(now, startTime);
  const numIntervals = Math.ceil(totalMinutes / interval);

  // Generate markers at each interval
  for (let i = 0; i <= numIntervals; i++) {
    const timestamp = addMinutes(startTime, i * interval).getTime();
    const zonedTime = toZonedTime(new Date(timestamp), tzString);

    // Format the label differently based on interval size
    let label = '';
    if (interval < 60) {
      // For sub-hour intervals, show time with minutes
      label = format(zonedTime, 'h:mm a');
    } else if (interval < 1440) {
      // For hour intervals, show hour
      label = format(zonedTime, 'h a');
    } else {
      // For day intervals, show date
      label = format(zonedTime, 'MMM d');
    }

    markers.push({ timestamp, label });
  }

  return markers;
};

/**
 * Formats time for display
 * @param timestamp Timestamp to format
 * @param tzString Timezone string
 * @returns Formatted time string
 */
export const formatTime = (timestamp: number, tzString: string = 'UTC'): string => {
  const zonedTime = toZonedTime(new Date(timestamp), tzString);
  return format(zonedTime, 'h:mm a');
};

/**
 * Formats date for display
 * @param timestamp Timestamp to format
 * @param tzString Timezone string
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number, tzString: string = 'UTC'): string => {
  const zonedTime = toZonedTime(new Date(timestamp), tzString);
  return format(zonedTime, 'EEEE, MMMM d, yyyy');
};

/**
 * Formats date and time for display
 * @param timestamp Timestamp to format
 * @param tzString Timezone string
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: number, tzString: string = 'UTC'): string => {
  const zonedTime = toZonedTime(new Date(timestamp), tzString);
  return format(zonedTime, 'EEEE, MMMM d, yyyy h:mm a');
};

/**
 * Calculates time bucket key for caching
 * @param timestamp Timestamp to bucket
 * @param bucketSizeMinutes Size of bucket in minutes
 * @returns Bucket key
 */
export const getTimeBucket = (timestamp: number, bucketSizeMinutes: number = 10): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();
  const minute = Math.floor(date.getMinutes() / bucketSizeMinutes) * bucketSizeMinutes;

  return `${year}-${month}-${day}-${hour}-${minute}`;
};
