// Client-side configuration
// NO API KEYS HERE - they are in Netlify Functions!

export const CONFIG = {
  // Netlify Function endpoints
  api: {
    plantIdentify: '/.netlify/functions/plant-identify',
    weather: '/.netlify/functions/weather',
    airQuality: '/.netlify/functions/air-quality'
  },

  // Visual mapping for environmental data
  airQuality: {
    colors: {
      good: '#00ff88',        // AQI 0-50
      moderate: '#ffeb3b',    // AQI 51-100
      unhealthy: '#ff9800',   // AQI 101-150
      veryUnhealthy: '#f44336', // AQI 151-200
      hazardous: '#9c27b0'    // AQI 201+
    },
    thresholds: [50, 100, 150, 200]
  },

  weather: {
    // Shape morphing based on weather conditions
    shapes: {
      clear: { morphFactor: 0.0, spikiness: 0.1 },
      clouds: { morphFactor: 0.2, spikiness: 0.15 },
      rain: { morphFactor: 0.5, spikiness: 0.3 },
      drizzle: { morphFactor: 0.4, spikiness: 0.25 },
      thunderstorm: { morphFactor: 0.8, spikiness: 0.6 },
      snow: { morphFactor: 0.3, spikiness: 0.4 },
      mist: { morphFactor: 0.2, spikiness: 0.1 }
    }
  },

  temperature: {
    // Animation speed mapping (normalized 0-1)
    minTemp: -20,  // °C
    maxTemp: 45,   // °C
    minSpeed: 0.2,
    maxSpeed: 2.0
  },

  // Hand gesture sensitivity
  gestures: {
    pinchThreshold: 0.05,      // Distance threshold for pinch detection
    openHandThreshold: 0.85,   // Confidence threshold for open hand
    cooldownMs: 500            // Cooldown between gesture triggers
  },

  // Performance settings
  performance: {
    maxOrbs: 10,
    maxPendants: 5,
    cacheTimeout: 300000,      // 5 minutes
    handTrackingFPS: 30
  },

  // AR settings
  ar: {
    orbDistance: 0.5,          // meters from camera
    pendantDistance: 0.4,      // meters from camera
    orbScale: 0.15,            // meters
    pendantScale: 0.1          // meters
  }
};
