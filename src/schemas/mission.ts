import { ObjectId } from "bson";
import { Column, Entity, PrimaryColumn } from "typeorm";


@Entity()
export default class Mission {
  @PrimaryColumn({
    default: () => ObjectId.generate(((new Date()).valueOf()) / 1000).toString("hex"),
    type: "string"
  })
  _id: ObjectId

  @Column()
  deliverables: string[];

  @Column()
  status: "Upcoming" | "Live" | "Completed" | "Review"; // index

  @Column()
  user: ObjectId; // index

  @Column()
  pilotAssigned: ObjectId;

  @Column()
  assetID?: ObjectId;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  tenantId: ObjectId; // index

  @Column()
  clientId: ObjectId[]; // index

  @Column()
  missionType: string;

  @Column()
  invites: string[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column()
  size: number;

  @Column()
  isPublic: boolean;
}

export type IMission = Mission;
