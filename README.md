# PLANT ID WebAR

An interactive WebAR mobile game that combines plant detection, hand gesture controls, and environmental data visualization in augmented reality.

## Features

- **Plant Detection**: Point your camera at any plant to identify it using AI (with PlantNet fallback)
- **Hand Gestures**: 
  - 🤏 **Pinch** to create environmental data orbs (improved reliability with 200ms cooldown)
  - ✋ **Open hand** to attach orbs to wrist or create plant pendants
  - ✌️ **Peace sign** to clear all AR objects (orbs, pendants, connections)
- **Wrist-Wrapping Orbs**:
  - Orbs arrange in circular pattern around your wrist
  - Follow hand movement in real-time
  - Persist after gesture completes
- **Y3K Aesthetic**:
  - Orbs: Futuristic metallic/holographic appearance with silver, neon pink, and electric blue gradients
  - Pendant Frames: Animated Y3K shader with color-shifting gradients
  - Pseudo-environment reflections for glossy look
- **Liquid Glass UI**:
  - Semi-transparent white panels (10% opacity)
  - Heavy blur effect (40px) for premium liquid glass appearance
  - Material Design 3 icons throughout interface
- **Environmental Data Visualization**:
  - Orb colors represent air quality
  - Orb shapes represent weather conditions
  - Animation speed represents temperature
- **AR Connections**: White animated lines connect pendants to orbs
- **Space Mono Font**: Clean, modern monospace typography throughout

## Technology Stack

- **WebXR Device API** - Standards-based AR
- **Three.js** - 3D graphics and rendering with custom Y3K shaders
- **MediaPipe Hands** - Hand tracking and gesture detection
- **TensorFlow.js + DeepLab** - Plant segmentation
- **Netlify Functions** - Secure API proxying
- **Plant.id API** - Primary plant identification
- **PlantNet API** - Fallback plant identification
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
PLANTNET_API_KEY=your_plantnet_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Get API Keys:**

- **Plant.id**: https://web.plant.id/ (Free tier: 100 requests/month)
- **PlantNet**: https://my.plantnet.org/ (Free tier: 500 requests/day)
- **OpenWeatherMap**: https://openweathermap.org/api (Free tier: 1000 requests/day)

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
   - `PLANTNET_API_KEY`
   - `OPENWEATHER_API_KEY`

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
- Tap the orb button (bubble chart icon) to create an orb in front of you

**Orb Visual Meaning:**
- **Aesthetic**: Y3K futuristic style with metallic/holographic appearance
- **Color**: Air quality blended with Y3K palette (silver, neon pink, electric blue)
  - Green tones = good air quality
  - Yellow/orange tones = moderate/unhealthy
  - Red/purple tones = hazardous
- **Shape**: Weather (sphere=clear, elongated=rain, spiky=storm)
- **Animation**: Temperature (slower=cold, faster=hot)
- **Reflections**: Pseudo-environment reflections for glossy, premium look

### Attaching Orbs to Wrist

**Method: Open Hand Gesture (without plant detected)**
- Extend all fingers (open hand)
- Existing orbs will arrange in a circular pattern around your wrist
- Orbs will follow your hand movement in real-time
- The wrist-wrapping persists until you use the peace gesture

### Creating Plant Pendants

**Prerequisites**: Detect a plant first

**Method 1: Open Hand Gesture (with plant detected)**
- Extend all fingers (open hand)
- A pendant will appear with the detected plant
- Pendant frame features Y3K aesthetic with animated color-shifting gradients

**Method 2: Manual**
- Tap the pendant button (diamond icon) after detecting a plant

**Connections**: White animated lines will automatically connect the pendant to all existing orbs.

### Clearing AR Objects

**Method: Peace Gesture**
- Extend index and middle fingers (peace sign)
- Keep ring and pinky fingers closed
- All orbs, pendants, and connection lines will be removed
- Provides a quick reset to start fresh

## PlantNet Fallback

The app uses a **two-tier plant identification system** for maximum reliability:

1. **Primary**: Plant.id API (100 requests/month free tier)
2. **Fallback**: PlantNet API (500 requests/day free tier)

**How it works:**
- If Plant.id fails (quota exceeded, network error, etc.), the app automatically tries PlantNet
- PlantNet results are normalized to match the same data structure
- Plants identified via PlantNet are marked with `source: 'PlantNet'` in the data
- The fallback is completely transparent to the user

**Verified**: ✅ PlantNet fallback is working correctly

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

- **Hard refresh** your browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Orbs now have fallback data and should always appear (even if APIs fail)
- Check browser console for errors
- Ensure WebGL is supported
- Status indicator shows "Creating orb..." during creation
- If you see "Orb creation failed", check your internet connection

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
