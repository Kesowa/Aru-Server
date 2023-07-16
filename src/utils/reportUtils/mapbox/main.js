import { renderRaster, renderVector, setupMap } from "./script.js";

// Turn component with given id into mapbox
// Use the given COG server url for rendering the raster layers
setupMap("map", "https://cog-nk.kesowa.com").then(() => {
  // Center on first geojson url
  // Render all given geojson urls
  renderVector([
    "https://cdn-dev.kesowa.com/vector/00854a1e-568d-42db-84e9-a310df7593c9.geojson",
    "https://cdn-dev.kesowa.com/vector/59af3119-fd68-48d0-966a-9a0008ec2b18.geojson"
  ]).then(() => console.log("rendered vector")).catch(console.error);

  // Center on first raster url
  // Render all given ortho urls
  // renderRaster([
  //   // "http://172.17.0.1:5151/raster/a0789482-62c7-4ab5-b9a4-9f83694d0a9e.tif",
  //   "http://172.17.0.1:5151/raster/f6b443a1-7724-4bd6-9be9-4f33fd0fc98c.tif"
  // ])
})
.catch((error) => console.error("Error loading map", error));
