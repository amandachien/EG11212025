# Quick Start Guide 🚀

## Get Started in 5 Minutes

### Step 1: Get API Keys (Free)

1. **Plant.id** (100 requests/month free)
   - Visit: https://web.plant.id/
   - Sign up and get your API key

2. **OpenWeatherMap** (1000 requests/day free)
   - Visit: https://openweathermap.org/api
   - Sign up and get your API key
   - This key works for both weather AND air quality!

### Step 2: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your API keys
# PLANT_ID_API_KEY=your_key_here
# OPENWEATHER_API_KEY=your_key_here
# AIR_QUALITY_API_KEY=your_key_here  # Use same as OpenWeatherMap
```

### Step 3: Install & Run

```bash
# Install dependencies (already done if you see node_modules/)
npm install

# Install Netlify CLI globally
npm install -g netlify-cli

# Start development server
npm run dev
```

The app will open at `http://localhost:8888`

### Step 4: Test on Mobile

**Option A: Same Network**
1. Find your computer's IP address:
   - Mac: System Preferences → Network
   - Windows: `ipconfig` in command prompt
2. On your phone, visit `http://YOUR_IP:8888`
   - Example: `http://192.168.1.100:8888`

**Option B: Deploy to Netlify (Recommended)**
1. Push code to GitHub
2. Connect to Netlify
3. Add environment variables in Netlify dashboard
4. Access via your Netlify URL

---

## How to Use the App

### 1. Start AR Experience
- Tap "Start AR Experience"
- Grant camera and location permissions
- Wait for hand tracking to initialize

### 2. Detect a Plant
- **Automatic**: Point camera at plant
- **Manual**: Tap the 📱 button

### 3. Create Environmental Orb
- **Gesture**: Pinch thumb and index finger
- **Manual**: Tap the ⭕ button

The orb shows:
- **Color** = Air quality
- **Shape** = Weather
- **Speed** = Temperature

### 4. Create Plant Pendant
- **Gesture**: Open your hand (all fingers extended)
- **Manual**: Tap the 💎 button (after detecting a plant)

White lines will connect the pendant to all orbs!

---

## Troubleshooting

**Camera not working?**
- Check permissions in browser settings
- Refresh the page
- Try a different browser

**Hand tracking not working?**
- Ensure good lighting
- Use manual buttons as fallback

**"API key not configured"?**
- Check your `.env` file
- Restart the dev server (`npm run dev`)
- For Netlify: Add keys in dashboard

**Nothing appears in AR?**
- Check browser console for errors
- Ensure WebGL is supported
- Try on a newer device

---

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [walkthrough.md](walkthrough.md) for technical details
- Deploy to Netlify for production use

**Enjoy exploring plants in AR! 🌿✨**
