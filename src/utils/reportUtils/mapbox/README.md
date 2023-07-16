# MapBox
A library (script.js) for taking screenshots of raster and vector layers rendered onto a map, along with usage examples (main.js).

# Dependencies
1. Mapbox
2. Turf

# Usage
1. Use `setupMap` function to attach map to a component
2. Use renderVector/Raster functions to render multiple layers at the same time
3. These functions will resolve only when the layers have been completely rendered
4. Map will be adjusted to have all layers fit within the view
5. Use captureMap function to convert map view into base64 image string with the following resolution: 720x1280
6. Use clearLayers function to remove all rendered layers

## Notes
You will have to modify/merge the render functions if you want to display both raster and vector at the same time, or they won't be in focus
