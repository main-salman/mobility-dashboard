# Urban Mobility Dashboard

A Next.js application for city planners and administrators to visualize and analyze urban mobility patterns using Google Maps API and Google Places API.

## Features

- **City Selection**: Choose from multiple cities (Vancouver, Madinah, Delhi, Lahore) or search for any city
- **Time Range Selection**: View data from the past week, month, year, or a custom time range
- **Cultural Site Visualization**: Blue markers indicate important cultural sites in each city
- **Crowd Density Heatmaps**: Visual representation of crowd density in different areas
- **Day/Night Activity Analysis**: Compare activity patterns between day and night to assess safety
- **Interactive Map**: Click anywhere to get detailed analytics for specific areas
- **City Metrics**: View key statistics like day/night ratio, peak hours, and estimated visitor counts

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Maps**: Google Maps JavaScript API, Google Places API
- **Data Visualization**: Heatmaps for crowd density

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Google Maps API key with Places API and Maps JavaScript API enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mobility-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Google Maps API key:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_google_maps_map_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Select a City**: Choose from the predefined cities or search for a specific location
2. **Choose a Time Range**: Select the period for which you want to view mobility data
3. **Explore the Map**: 
   - Blue markers indicate cultural sites - click on them for site-specific information
   - The heatmap shows crowd density throughout the city
   - Click anywhere on the map to analyze that specific area
4. **View City Metrics**: Scroll down to see detailed statistics about the city's mobility patterns

## Notes

- This is a demonstration application that uses simulated data
- In a production environment, this would connect to real Google Maps Platform data sources
- The application is designed for desktop use primarily, as requested in the requirements

## Future Enhancements

- Integration with real-time Google Maps traffic data
- Additional visualization types (flow lines, time-series graphs)
- Demographic filtering capabilities
- Report generation feature
- Comparative analysis between different cities or time periods

## License

This project is licensed under the MIT License.
