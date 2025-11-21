# Bug Fixes - CDN and Module Loading Issues

## Issues Fixed

### 1. Three.js Deprecation Warning
**Error:** `Scripts "build/three.js" and "build/three.min.js" are deprecated with r150+`

**Fix:**
- Switched from legacy Three.js build to ES modules
- Added import map in `index.html`:
  ```html
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
      }
    }
  </script>
  ```
- Updated all JavaScript files to import Three.js as ES module:
  ```javascript
  import * as THREE from 'three';
  ```

**Files Modified:**
- `index.html` - Added import map
- `js/main.js` - Added Three.js import
- `js/orb-creator.js` - Added Three.js import
- `js/pendant-creator.js` - Added Three.js import

---

### 2. MediaPipe Hands Loading Error
**Error:** `Failed to load resource: hands.js (404)` and `Refused to execute... Content-Type is not a script MIME type`

**Fix:**
- Updated MediaPipe CDN URLs to use correct paths without version numbers
- Changed from:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646559476/hands.js"></script>
  ```
- To:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
  ```

**Files Modified:**
- `index.html` - Updated MediaPipe script tags

---

### 3. MediaPipe "Can't find variable: Hands" Error
**Error:** `ReferenceError: Can't find variable: Hands`

**Fix:**
- MediaPipe libraries load as global variables on `window` object
- Updated code to access them via `window.Hands`, `window.Camera`, etc.
- Added checks to ensure libraries are loaded before use:
  ```javascript
  if (typeof window.Hands === 'undefined') {
      throw new Error('MediaPipe Hands library not loaded');
  }
  this.hands = new window.Hands({ ... });
  ```

**Files Modified:**
- `js/hand-tracking.js` - Updated to use `window.Hands`, `window.Camera`, `window.drawConnectors`, `window.drawLandmarks`, `window.HAND_CONNECTIONS`

---

### 4. Content Security Policy Blocking TensorFlow Hub
**Error:** `Refused to connect to https://tfhub.dev... does not appear in connect-src directive`

**Fix:**
- Updated Content Security Policy in `netlify.toml` to allow TensorFlow Hub and Google Storage:
  ```toml
  connect-src 'self' https://tfhub.dev https://storage.googleapis.com https://cdn.jsdelivr.net;
  ```

**Files Modified:**
- `netlify.toml` - Updated CSP `connect-src` directive

---

### 5. TensorFlow.js DeepLab Loading
**Fix:**
- Added correct TensorFlow.js and DeepLab script tags:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/deeplab@0.2.1/dist/deeplab.min.js"></script>
  ```

**Files Modified:**
- `index.html` - Added TensorFlow.js scripts

---

## Testing the Fixes

### 1. Clear Browser Cache
```bash
# In browser DevTools
# Application tab → Clear storage → Clear site data
```

### 2. Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Check Console
Open browser DevTools and verify:
- ✅ No Three.js deprecation warnings
- ✅ MediaPipe scripts load successfully
- ✅ No CSP errors
- ✅ Hand tracking initializes without errors

### 4. Expected Console Output
```
Initializing AR Plant Game...
Loading plant segmentation model...
Hand tracking initialized
AR Plant Game initialized successfully
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `index.html` | Import map for Three.js ES modules, updated MediaPipe CDN URLs, added TensorFlow.js scripts |
| `js/main.js` | Added `import * as THREE from 'three'` |
| `js/orb-creator.js` | Added `import * as THREE from 'three'` |
| `js/pendant-creator.js` | Added `import * as THREE from 'three'` |
| `js/hand-tracking.js` | Use `window.Hands`, `window.Camera`, and other MediaPipe globals |
| `netlify.toml` | Updated CSP to allow TensorFlow Hub and Google Storage |

---

## If You Still See Errors

### MediaPipe Still Not Loading?
1. Check your internet connection
2. Try a different CDN or download MediaPipe locally
3. Verify browser supports WebAssembly

### Three.js Errors?
1. Ensure import map is before any module scripts
2. Check browser supports import maps (Chrome 89+, Safari 16.4+)
3. Use a polyfill for older browsers

### CSP Errors?
1. If deploying to Netlify, ensure `netlify.toml` is committed
2. For local testing, CSP might not apply (depends on server)
3. Check browser console for specific blocked resources

---

## Next Steps

1. Test the application in your browser
2. Verify all features work:
   - Camera access
   - Hand tracking
   - Plant detection
   - Orb creation
   - Pendant creation
3. If errors persist, share the console output for further debugging

---

**All fixes have been applied!** The application should now load without CDN or module errors. 🎉
