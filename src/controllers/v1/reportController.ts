import { promises as fs } from "fs";
import turf from "@turf/turf";
import { Request } from "express";
import Mission from "../../models/mission";
import { AuthResponse } from "../../utils/interfaceUtils";
import Layer from "../../models/layer";
import { IVector } from "../../schemas/vectorprops";
import { DirPath, Directory } from "../../constants";
import { generateDocument } from "../../utils/reportUtils/report";
import { Packer } from "docx";
import { IData } from "../../utils/reportUtils/types";
import Flight from "../../models/flight";
import { IUser } from "../../schemas/user";
import { privateCommercialLayerTypes, residentialLayerTypes, govtCommercialLayerTypes, housingComplexLayerTypes, govtLayerTypes, motorableRoadsLayerTypes, footpathLayerTypes, cycleTrackLayerTypes, greeneryLayerTypes, waterBodyLayerTypes, vacantTypes, underConstructionTypes } from "../../utils/reportUtils/reportUtils";
import Document from "../../models/document";
import { missionSpecificSocket } from "../../socket";

export async function findArea(gjson: any) {
  try {
    let totalArea = 0;
    const allIndependantPositions: any[] = [];
    for (const feature of gjson.features) {
      if (
        ["MultiPolygon", "Polygon", "MultiLineString"].includes(
          feature.geometry.type
        )
      ) {
        if (feature.geometry.type === "MultiLineString") {
          for (const linestring of feature.geometry.coordinates) {
            allIndependantPositions.concat(linestring);
          }
          continue;
        }
        let polygons = feature.geometry.coordinates;
        if (feature.geometry.type === "Polygon") {
          polygons = [polygons];
        }
        for (const polygon of polygons) {
          const area = turf.area(turf.polygon(polygon));
          totalArea += area;
        }
      }
    }
    if (allIndependantPositions.length >= 3) {
      const area = turf.area(turf.polygon([allIndependantPositions]));
      totalArea += area;
    }
    return totalArea;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function findLength(gjson: any) {
  try {
    let totalLength = 0;
    for (const feature of gjson.features) {
      if (
        ["MultiLineString", "LineString", "Polygon"].includes(
          feature.geometry.type
        )
      ) {
        let lines = feature.geometry.coordinates;
        if (feature.geometry.type === "LineString") {
          lines = [lines];
        }
        // Polygon and MultiLineString both have similar structure, array of line strings
        totalLength += turf.length(turf.multiLineString(lines));
      }
    }
    return totalLength / 1000; // as turf calculates in km, but we need in m
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function countPolygons(gjson: any) {
  try {
    let count = 0;
    for (const feature of gjson.features) {
      if (feature.geometry.type === "Polygon") {
        count++;
      }
      else if(feature.geometry.type === "MultiPolygon") {
        count += feature.geometry.coordinates.length;
      }
    }
    return count;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export const generateReport = async (req: Request, res: AuthResponse) => {
  {
    const { missionId } = req.body;
    // initializing all numbers and texts
    const data: IData = {
      missionHeading: "",
      missionSubHeading: "",
      missionMapImgPath: "",
      missionCode: "",
      date: "",
      users: [],
      emails: [],
      phoneNos: [],
      area: {
        total: 0,
        privateSpaces: [
          { name: "Private Commercial", value: 0 },
          { name: "Residential", value: 0 },
          { name: "Govt. Commercial", value: 0 },
          { name: "Housing Complex", value: 0 },
        ],
        publicSpaces: [
          { name: "Government", value: 0 },
          { name: "Motorable Roads", value: 0 },
          { name: "Footpath", value: 0 },
          { name: "Cycle Track", value: 0 },
          { name: "Parks & Green", value: 0 },
          { name: "Waterbody", value: 0 },
        ],
        other: 0,
      },
      occupancy: [
        {
          name: "Private Commercial",
          occupied: 0,
          underConstruction: 0,
          vacant: 0,
        },
        { name: "Residential", occupied: 0, underConstruction: 0, vacant: 0 },
        {
          name: "Govt. Commercial",
          occupied: 0,
          underConstruction: 0,
          vacant: 0,
        },
        {
          name: "Housing Complex",
          occupied: 0,
          underConstruction: 0,
          vacant: 0,
        },
        { name: "Government", occupied: 0, underConstruction: 0, vacant: 0 },
      ],
      roadCount: 0,
      roadLength: 0,
      cycleTrackLength: 0,
      deliverables: [
        { name: "OVERVIEW", imgPath: "" },
        { name: "BOUNDARY", imgPath: "" },
        { name: "BUILT-UP AREA", imgPath: "" },
        { name: "AMENITIES AND POI", imgPath: "" },
        { name: "OTHER FEATURES", imgPath: "" },
        { name: "ACTIONABLE POINTS", imgPath: "" },
        { name: "OCCUPIED UNTAXED AREA (ENCROACHMENT)", imgPath: "" },
        { name: "ROAD DETAILS", imgPath: "" },
        { name: "FOOTPATH DETAILS", imgPath: "" },
        { name: "CYCLE TRACK DETAILS", imgPath: "" },
        { name: "WATERBODIES DETAILS", imgPath: "" },
        { name: "GREENERY DETAILS", imgPath: "" },
        { name: "WATERBODIES DETAILS", imgPath: "" },
        { name: "WATER TANK", imgPath: "" },
        { name: "STREET-LIGHT DETAILS", imgPath: "" },
      ]
    };

    // mission details filling
    const mission = await Mission.findOne(
      { _id: missionId }, 
      { name: 1, user: 1 }
    ).populate<{ user: IUser }>({
      path: "user",
      select: {
        name: 1,
        phoneNo: 1,
        email: 1,
      },
    });
    data.missionHeading = mission.name;
    // TODO: missionCode(??), missionMapImgPath(scrape screenshot)

    // date
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    let mm = (now.getMonth() + 1).toString();
    let dd = now.getDate().toString();
    if (parseInt(dd) < 10) dd = "0" + dd;
    if (parseInt(mm) < 10) mm = "0" + mm;
    data.date = dd + "/" + mm + "/" + yyyy;

    // pilot details (names, phone numbers, emails)
    const flight = await Flight.findOne(
      { mission: missionId },
      { pilotID: 1 }
    ).populate<{ pilotID: IUser }>({
      path: "pilotID",
      select: {
        name: 1,
        phoneNo: 1,
        email: 1,
      },
    });
    data.users.push(mission.user.name);
    data.users.push(flight.pilotID.name);
    data.emails.push(mission.user.email);
    data.emails.push(flight.pilotID.email);
    data.phoneNos.push(mission.user.phoneNo);
    data.phoneNos.push(flight.pilotID.phoneNo);

    // area details filling (for page 2 tables)
    const vectorLayers = await Layer.find({
      missionId: missionId,
      type: "Vector",
    }).populate<{ vector: IVector }>("vector");

    function assignOccupancy(layerType: string, idx: number) {
      if(vacantTypes.includes(layerType)) {
        data.occupancy[idx].vacant++;
      }
      else if(underConstructionTypes.includes(layerType)) {
        data.occupancy[idx].underConstruction++;
      } 
      else {
        data.occupancy[idx].occupied++;
      }
    }

    for (const layer of vectorLayers) {
      const layerData = await fs.readFile(DirPath(Directory.DEFAULT, layer.layerpath), "utf-8");
      const gjson = JSON.parse(layerData);
      const currLayerArea = await findArea(gjson);
      const currLayerLength = await findLength(gjson);
      data.area.total += currLayerArea;
      // check the layer type and accordingly add area to respective type
      if (privateCommercialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[0].value += currLayerArea;
        assignOccupancy(layer.vector.name, 0);
      } else if (residentialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[1].value += currLayerArea;
        assignOccupancy(layer.vector.name, 1);
      } else if (govtCommercialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[2].value += currLayerArea;
        assignOccupancy(layer.vector.name, 2);
      } else if (housingComplexLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[3].value += currLayerArea;
        assignOccupancy(layer.vector.name, 3);
      } else if (govtLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[0].value += currLayerArea;
        assignOccupancy(layer.vector.name, 4);
      } else if (motorableRoadsLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[1].value += currLayerArea;
        data.roadCount++;
        data.roadLength += currLayerLength;
      } else if (footpathLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[2].value += currLayerArea;
      } else if (cycleTrackLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[3].value += currLayerArea;
        data.cycleTrackLength += currLayerLength;
      } else if (greeneryLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[4].value += currLayerArea;
      } else if (waterBodyLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[5].value += currLayerArea;
      } else {
        data.area.other += currLayerArea;
      }
    }

    // all information received without errors, now can start report generation successfully
    res.status(200).json({
      status: true,
      message: "Report generation started!",
    });

    console.info("Generating report...");

    // saving the document
    const doc = await generateDocument(data);
    const buffer = await Packer.toBuffer(doc);
    const filename = `${missionId}-report.docx`;
    const filepath = DirPath(Directory.DOCUMENTS, filename);
    await fs.writeFile(filepath, buffer);

    const fileStats = await fs.stat(filepath);

    const docDB = new Document({
      name: filename,
      modDate: new Date(),
      fileSize: (Number(fileStats.size) / (1024 * 1024)).toFixed(5),
      fileType: "docx",
      folderName: "",
      filePath: `/documents/${filename}`,
      missionId,
      tenantId: res.locals.user.tenantId,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
    });
    const savedDoc = await docDB.save();

    console.info("Report Generation Complete");

    missionSpecificSocket
      .to(savedDoc.missionId.toString())
      .emit("DOCUMENT_CREATED", savedDoc);
    
  }
};
