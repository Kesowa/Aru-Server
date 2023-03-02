import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

//This interface just fights the type system
export interface IUser {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // index
  userGroupId: mongoose.Types.ObjectId; // index
  name: string;
  phoneNo: string; // index
  email: string; // index
  password: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  userType: string; // index
  customPermissions: mongoose.Types.ObjectId[];
  dob: Date;
  aadhaarNo: string;
  pilotLicenceNo: string;
  isActive: boolean;
  isBanned: boolean;
  isTermsAccepted: boolean;
  city?: string;
  country?: string;
  expiryDatee?: Date;
  avatar: string;
  passwordResetToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    userGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usergroup",
    },
    name: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    userType: {
      type: String,
      required: true,
    },
    customPermissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    dob: {
      type: Date,
    },
    aadhaarNo: {
      type: String,
    },
    pilotLicenceNo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
      required: true,
    },
    isTermsAccepted: {
      type: Boolean,
      default: false,
      required: true,
    },
    city: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    expiryDatee: {
      type: Date,
      required: false,
    },
    avatar: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({
  phoneNo: 1,
  email: 1,
  userGroupId: 1,
  tenantId: 1,
  userType: 1,
});

//validate password method
userSchema.methods.comparePassword = async function (password: string) {
  try {
    const result = await bcrypt.compare(password, (this as IUser).password);
    return result;
  } catch (err) {
    return false;
  }
};

export default userSchema;
