let map;
let cogServerUrl;
export async function setupMap(containerId, serverUrl) {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibmVlbGR1dHRhMTkiLCJhIjoiY2tweG9mN3F4MThrNTJ4cDk0enVjcTN4dCJ9.uxa_h0rjqumTxFMI1QELKQ"; // Replace with your Mapbox access token

  cogServerUrl = serverUrl;

  map = new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/streets-v11", // Replace with your preferred map style
    center: [-74.5, 40], // Replace with your desired initial center coordinates
    zoom: 9, // Replace with your desired initial zoom level
  });

  // Add zoom controls
  const zoomControls = new mapboxgl.NavigationControl();
  map.addControl(zoomControls, "top-right");

  await new Promise((res) => map.on("load", res));
}

// Add raster layer from GeoJSON
export async function renderRaster(rasterFilePaths) {
  const bounds = [];
  for (const rasterFilePath of rasterFilePaths) {
    const rasterSourceId = `raster-source-${rasterFilePath}`;
    const rasterLayerId = `raster-layer-${rasterFilePath}`;

    //-------handle for detail:not found----
    const metaDataURL = `${cogServerUrl}/cog/info?url=${rasterFilePath}`;
    const response = await fetch(metaDataURL, {
      method: "GET",
    });
    const metadata = await response.json();
    console.log("metadata", metadata);

    bounds.push([metadata["bounds"][0], metadata["bounds"][1]]);
    bounds.push([metadata["bounds"][2], metadata["bounds"][3]]);

    // Add the raster source
    map.addSource(rasterSourceId, {
      type: "raster",
      tiles: [
        `${cogServerUrl}/cog/tiles/{z}/{x}/{y}.png?url=${rasterFilePath}`,
      ], // Replace with the path to your raster tiles
      tileSize: 256,
    });

    // Add the raster layer
    map.addLayer({
      id: rasterLayerId,
      type: "raster",
      source: rasterSourceId,
      /*paint: {
        // Apply your desired paint properties here
        //"raster-opacity": 0.7,
        //"raster-hue-rotate": 180,
        // Add more paint properties as needed
      },*/
    });
  }
  const allBounds = turf.multiPoint(bounds);
  map.fitBounds(turf.bbox(allBounds));
}

// Add vector layer from GeoJSON
export async function renderVector(geojsonFilePaths) {
  const bounds = [];
  for (const geojsonFilePath of geojsonFilePaths) {
    const parsedGeojson = await (await fetch(geojsonFilePath)).json();
    // Center the map on the points using Turf.js
    const pointFeatures = parsedGeojson.features.filter(
      (feature) => feature.geometry.type === "MultiPolygon",
    );
    const bound = turf.bbox(turf.featureCollection(pointFeatures));
    bounds.push([bound[0], bound[1]]);
    bounds.push([bound[2], bound[3]]);

    map.addSource(geojsonFilePath, {
      type: "geojson",
      data: parsedGeojson,
    });

    map.addLayer({
      id: `vector-layer-${geojsonFilePath}`,
      type: "fill",
      source: geojsonFilePath,
      paint: {
        "fill-color": ["coalesce", ["get", "fill"]],
        "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    });

    map.addLayer({
      id: `vector-layer-outline-${geojsonFilePath}`,
      type: "line",
      source: geojsonFilePath,
      paint: {
        "line-color": ["coalesce", ["get", "stroke"]],
        "line-width": ["coalesce", ["get", "stroke-width"], 2],
        "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    });

    map.addLayer({
      id: `vector-layer-line-${geojsonFilePath}`,
      type: "line",
      source: geojsonFilePath,
      paint: {
        "line-color": ["coalesce", ["get", "stroke"]],
        "line-width": ["coalesce", ["get", "stroke-width"], 2],
        "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
      },
      filter: ["==", ["geometry-type"], "LineString"],
    });
  }
  console.log(bounds);
  const allBounds = turf.multiPoint(bounds);
  const points = turf.bbox(allBounds);
  console.log(points);
  map.fitBounds(points);
}
