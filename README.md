# WebAR Plant Game 🌿

An interactive WebAR mobile game that combines plant detection, hand gesture controls, and environmental data visualization in augmented reality.

## Features

- **Plant Detection**: Point your camera at any plant to identify it using AI
- **Hand Gestures**: 
  - 🤏 **Pinch** to create environmental data orbs
  - ✋ **Open hand** to create plant pendants
- **Environmental Data Visualization**:
  - Orb colors represent air quality
  - Orb shapes represent weather conditions
  - Animation speed represents temperature
- **AR Connections**: White animated lines connect pendants to orbs

## Technology Stack

- **WebXR Device API** - Standards-based AR
- **Three.js** - 3D graphics and rendering
- **MediaPipe Hands** - Hand tracking and gesture detection
- **TensorFlow.js + DeepLab** - Plant segmentation
- **Netlify Functions** - Secure API proxying
- **Plant.id API** - Plant identification
- **OpenWeatherMap API** - Weather and air quality data

## Prerequisites

- Modern mobile browser (Chrome on Android, Safari on iOS)
- Camera permissions
- Location permissions (for weather/air quality data)
- API keys (see setup below)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Antigravity
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Keys

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
PLANT_ID_API_KEY=your_plant_id_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
AIR_QUALITY_API_KEY=your_air_quality_api_key_here
```

**Get API Keys:**

- **Plant.id**: https://web.plant.id/ (Free tier: 100 requests/month)
- **OpenWeatherMap**: https://openweathermap.org/api (Free tier: 1000 requests/day)
- **Air Quality**: Using OpenWeatherMap Air Pollution API (same key)

### 4. Local Development

Install Netlify CLI globally:

```bash
npm install -g netlify-cli
```

Start the development server:

```bash
npm run dev
```

This will start a local server at `http://localhost:8888` with Netlify Functions support.

**Important**: To test on mobile devices:
1. Find your computer's local IP address
2. Access the app at `http://<your-ip>:8888` from your mobile device
3. Both devices must be on the same network

### 5. Deploy to Netlify

#### First-time Setup:

1. Create a GitHub repository and push your code
2. Sign up at https://netlify.com
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure build settings (Netlify will auto-detect)

#### Configure Environment Variables in Netlify:

1. Go to Site Settings → Environment Variables
2. Add your API keys:
   - `PLANT_ID_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `AIR_QUALITY_API_KEY`

#### Deploy:

```bash
npm run deploy
```

Or push to your GitHub repository - Netlify will auto-deploy.

## Usage Guide

### Starting the AR Experience

1. Open the app on your mobile device
2. Grant camera and location permissions
3. Tap "Start AR Experience"
4. Wait for hand tracking to initialize

### Detecting Plants

**Method 1: Automatic (with hand tracking)**
- Point your camera at a plant
- The app will automatically detect it

**Method 2: Manual**
- Tap the crosshair button (📱) to capture and identify

### Creating Environmental Orbs

**Method 1: Pinch Gesture**
- Make a pinch gesture with your thumb and index finger
- An orb will appear at your hand position

**Method 2: Manual**
- Tap the orb button (⭕) to create an orb in front of you

**Orb Visual Meaning:**
- **Color**: Air quality (green=good, yellow=moderate, orange=unhealthy, red=hazardous)
- **Shape**: Weather (sphere=clear, elongated=rain, spiky=storm)
- **Animation**: Temperature (slower=cold, faster=hot)

### Creating Plant Pendants

**Prerequisites**: Detect a plant first

**Method 1: Open Hand Gesture**
- Extend all fingers (open hand)
- A pendant will appear with the detected plant

**Method 2: Manual**
- Tap the pendant button (💎) after detecting a plant

**Connections**: White animated lines will automatically connect the pendant to all existing orbs.

## Device Compatibility

### Tested Devices

- ✅ iPhone 12+ (iOS 15+, Safari)
- ✅ Samsung Galaxy S21+ (Android 11+, Chrome)
- ✅ Google Pixel 6+ (Android 12+, Chrome)

### Hand Tracking Support

- **iOS**: Requires iOS 15+ and A12 Bionic chip or newer
- **Android**: Requires ARCore support
- **Fallback**: Manual controls available for all devices

### AR Glasses

- Experimental support for AR glasses with WebXR support
- UI optimized for larger displays

## Troubleshooting

### Camera Not Working

- Ensure camera permissions are granted
- Try refreshing the page
- Check if another app is using the camera

### Hand Tracking Not Working

- Ensure good lighting conditions
- Keep your hand visible and within frame
- Use manual controls as fallback

### Plant Detection Fails

- Ensure the plant is clearly visible
- Try better lighting
- Get closer to the plant
- Check API key configuration

### Environmental Data Not Loading

- Check location permissions
- Verify API keys are configured in Netlify
- Check browser console for errors

### Orbs/Pendants Not Appearing

- Check browser console for errors
- Ensure WebGL is supported
- Try refreshing the page

## Security Notes

- ✅ API keys are **never** exposed in client-side code
- ✅ All API calls go through Netlify Functions
- ✅ `.env` files are in `.gitignore`
- ✅ CORS protection enabled
- ✅ Content Security Policy configured

## Performance Tips

- Close other apps to free up memory
- Use a stable internet connection
- Limit the number of orbs/pendants (auto-managed)
- Clear cache if experiencing slowdowns

## Browser Console

For debugging, the app instance is available in the browser console:

```javascript
window.arPlantGame
```

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- API keys are never committed
- Test on mobile devices before submitting

## License

MIT License - See LICENSE file for details

## Credits

- Plant identification powered by Plant.id
- Weather data from OpenWeatherMap
- Hand tracking by MediaPipe
- 3D rendering with Three.js

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console errors
3. Open an issue on GitHub

---

**Enjoy exploring plants in AR! 🌿✨**
