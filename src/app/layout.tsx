import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Urban Mobility Dashboard',
  description: 'Visualize crowd density and mobility patterns for urban planning',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload Google Maps API */}
        <link rel="preconnect" href="maps.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="maps.gstatic.com" crossOrigin="anonymous" />

        {/* First, load the core Maps JavaScript API */}
        <Script
          id="google-maps-script"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,visualization,geometry&v=weekly`}
          strategy="beforeInteractive"
        />

        {/* Then, load the Routes API directly using client library approach */}
        <Script
          id="routes-api-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Function to initialize the Routes API
                window.initRoutesAPI = function() {
                  console.log('Routes API client loading attempted');
                  if (!window.google) {
                    console.error('Google Maps not loaded yet, waiting...');
                    setTimeout(window.initRoutesAPI, 1000);
                    return;
                  }
                  
                  // Create routes namespace if it doesn't exist
                  if (!window.google.maps.routes) {
                    window.google.maps.routes = {};
                  }

                  // Create a wrapper around the RoutesService
                  if (!window.google.maps.routes.RoutesService) {
                    window.google.maps.routes.RoutesService = function() {
                      this.computeRoute = function(request, callback) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', 'https://routes.googleapis.com/directions/v2:computeRoutes');
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.setRequestHeader('X-Goog-Api-Key', '${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}');
                        xhr.setRequestHeader('X-Goog-FieldMask', '*');
                        
                        xhr.onload = function() {
                          if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            callback(response, 200);
                          } else {
                            callback(null, xhr.status);
                          }
                        };
                        
                        xhr.onerror = function() {
                          callback(null, 'NETWORK_ERROR');
                        };
                        
                        xhr.send(JSON.stringify(request));
                      };
                    };
                    
                    // Add the required enums
                    window.google.maps.routes.TravelMode = {
                      DRIVE: 'DRIVE',
                      BICYCLE: 'BICYCLE',
                      WALK: 'WALK',
                      TWO_WHEELER: 'TWO_WHEELER',
                      TRANSIT: 'TRANSIT'
                    };
                    
                    window.google.maps.routes.RoutingPreference = {
                      TRAFFIC_AWARE: 'TRAFFIC_AWARE',
                      TRAFFIC_AWARE_OPTIMAL: 'TRAFFIC_AWARE_OPTIMAL'
                    };
                    
                    console.log('Routes API client successfully initialized');
                  }
                };
                
                // Start the initialization after a short delay
                setTimeout(window.initRoutesAPI, 1000);
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
