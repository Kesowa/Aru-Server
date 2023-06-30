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
import { privateCommercialLayerTypes, residentialLayerTypes, govtCommercialLayerTypes, housingComplexLayerTypes, govtLayerTypes, motorableRoadsLayerTypes, footpathLayerTypes, cycleTrackLayerTypes, greeneryLayerTypes, waterBodyLayerTypes } from "../../utils/reportUtils/reportUtils";

export async function findArea(filepath: string) {
  try {
    const data = await fs.readFile(filepath, "utf-8");
    const gjson = JSON.parse(data);
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
    if (allIndependantPositions.length >= 4) {
      const area = turf.area(turf.polygon([allIndependantPositions]));
      totalArea += area;
    }
    return totalArea;
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
    };

    // mission details filling
    const mission = await Mission.findOne({ _id: missionId }, { name: 1 });
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
    data.users.push(flight.pilotID.name);
    data.emails.push(flight.pilotID.email);
    data.phoneNos.push(flight.pilotID.phoneNo);

    // area details filling (for page 2 tables)
    const vectorLayers = await Layer.find({
      missionId: missionId,
      type: "Vector",
    }).populate<{ vector: IVector }>("vector");

    for (const layer of vectorLayers) {
      const currLayerArea = await findArea(
        DirPath(Directory.DEFAULT, layer.layerpath)
      );
      data.area.total += currLayerArea;
      // check the layer type and accordingly add area to respective type
      if (privateCommercialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[0].value += currLayerArea;
      } else if (residentialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[1].value += currLayerArea;
      } else if (govtCommercialLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[2].value += currLayerArea;
      } else if (housingComplexLayerTypes.includes(layer.vector.name)) {
        data.area.privateSpaces[3].value += currLayerArea;
      } else if (govtLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[0].value += currLayerArea;
      } else if (motorableRoadsLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[1].value += currLayerArea;
      } else if (footpathLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[2].value += currLayerArea;
      } else if (cycleTrackLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[3].value += currLayerArea;
      } else if (greeneryLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[4].value += currLayerArea;
      } else if (waterBodyLayerTypes.includes(layer.vector.name)) {
        data.area.publicSpaces[5].value += currLayerArea;
      } else {
        data.area.other += currLayerArea;
      }
    }

    // saving the document
    const doc = generateDocument(data);
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(
      DirPath(Directory.DOCUMENTS, `${missionId}-report.docx`),
      buffer
    );

    res.json({
      success: true,
      message: "Report Generated",
    });
  }
};
