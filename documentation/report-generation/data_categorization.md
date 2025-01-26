### Pre-defined Categories

There is a pre-defined list of categories into which the regions marked by geojsons are categorized. Every vector layer has an associated `vectorType` or `vectorProp` which stores metadata about what type of layer it is. Using these types, we can categorize the layers into the pre-defined categories. <br/>

The lists of categorization can be found in the `reportUtils.ts` file. <br/>

#### Following is the current list of pre-defined area categories and associated vectorTypes:

| Category      | Sub-Category          | Vector Types Categorized under this                                                                                                                                 |
| ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private Space | Private Commercial    | "Bus Shelters", "Parking Area", "Cycle Stand", "Boundary Wall", "Cellphone Tower", "Parcel", "Farming Land"                                                         |
| Private Space | Residential           | "Plot"                                                                                                                                                              |
| Private Space | Government Commercial | "Sub Station", "Metro station", "Metro Route", "Public Convenience", "Mobile Drone Port"                                                                            |
| Private Space | Housing Complex       |
| Private Space | Government            | "Restricted Area", "Powersupply Network", "Landfill", "Fire Station", "Right of Way", "Water Transmission Line", "Water Treatment Plant", "Garbage Collection Area" |
| Public Space  | Motorable Roads       | "Flyover", "Roundabout", "Bridge/Flyover", "Bridge", "Carriage Way", "Road", "Street"                                                                               |
| Public Space  | Footpath              | "Footpath"                                                                                                                                                          |
| Public Space  | Cycle Track           | "Cycle Track"                                                                                                                                                       |
| Public Space  | Parks and Greenery    | "Playground", "Park", "Green Verge", "Jungle"                                                                                                                       |
| Public Space  | Waterbody             | "Drainage Network", "Canal", "Sewerage Network", "Waterbody"                                                                                                        |
| Other         | -                     | All other remaining uncategorized vector types                                                                                                                      |

Also, layers can be categorized to have `Occupied`, `Under Construction` and `Vacant` occupancy, based on the vectorType as well. <br/>

#### Following is the current list of pre-defined occupancy categories and associated vectorTypes:

| Category           | Vector Types Categorized under this |
| ------------------ | ----------------------------------- |
| Occupied           |
| Under Construction |
| Vacant             | "Vacant Plot"                       |
