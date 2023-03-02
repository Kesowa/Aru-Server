import User from "../models/user";
import Tenant from "../models/tenant";
import Package from "../models/package";
import moment from "moment";
import crypto from "crypto";
import { generateResetPasswordToken } from "../utils/resetPasswordUtils";
import { BASE_SERVER } from "../constants";

// let saltRound = 10;
export const createTenantLevelrootUser = async (tenant: any) => {
  try {
    const temppass = crypto.randomBytes(10).toString("hex");
    //  let hashedPassword = await bcrypt.hash(tenant.phoneNo, saltRound );
    const email: any = String(tenant.email);
    const name: any = email.split("@")[0];
    const tenantRoot = new User({
      name: name,
      email: tenant.email,
      password: temppass,
      phoneNo: tenant.phoneNo,
      userType: "tenant-root",
      isActive: true,
      tenantId: tenant._id,
    });
    //console.log(tenantRoot);
    const t = await tenantRoot.save();

    const token = await generateResetPasswordToken(tenant.email);
    const resetPasswordUrl = `${BASE_SERVER}/apis/v1/auth/reset-password/${token}`;

    // await sendMail(tenant.email, "Account Created! || Kesowa Infinite Ventures Pvt. Ltd", "", `<p><b>Greetings ${tenant.name}!</b></p>
    // <p>We wish you a warm welcome from Kesowa Infinite Ventures Pvt. Ltd for using our app <b>ARU.</b></p>
    // <p>In order to start using our platform, you will be first given access to a <b>root admin</b>account, for which you have to complete the account creation process, which was initiated by KESOWA. Please <a href=${resetPasswordUrl}>click here to reset your password first!</a>
    // <p><b>Your userID:</b> ${tenant.email}</p>
    // <br/>
    // <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
    // <br/>
    // <p>Best regards,</p>
    // <p><b>Team Kesowa</b></p>
    // `, "");

    console.log(t);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// export const addPackageToTenant = async(tenantId:any,packageId:any)=>{
//     try{
//         let [thisPackage,thisTenant] = await Promise.all([Package.findById(packageId),Tenant.findById(tenantId)]);
//         //console.log(thisPackage,thisTenant)
//         if(thisPackage && thisTenant){
//             thisTenant.activePackage = {
//                 name : thisPackage.name,
//                 bandwidth : thisPackage.bandwidth,
//                 storage : thisPackage.storage,
//                 duration : thisPackage.duration,
//                 userCount : thisPackage.userCount,
//                 missionCount:thisPackage.missionCount,
//                 alertCount:thisPackage.alertCount,
//                 vodCount:thisPackage.vodCount,
//                 layerCount:thisPackage.layerCount,
//                 clientCount:thisPackage.clientCount,
//                 locationCount:thisPackage.locationCount,
//                 userGroupCount:thisPackage.userGroupCount,
//                 poster :thisPackage.poster
//             }
//             thisTenant.bandwidthUsed = 0;
//             thisTenant.packageStartDate = moment().toDate();
//             thisTenant.isActivated=true;
//             let newTenant = await thisTenant.save();
//             return newTenant;
//         }
//         else{
//             throw new Error('Invalid inputs.')
//         }
//     }
//     catch(err){
//         console.error(err);
//         throw err;
//     }
// }

export const addPackageToTenant = async (tenantId: any, packageId: any) => {
  try {
    const [thisPackage, thisTenant] = await Promise.all([
      Package.findById(packageId),
      Tenant.findById(tenantId),
    ]);
    if (thisPackage && thisTenant) {
      thisTenant.activePackage = packageId;
      thisTenant.bandwidthUsed = 0;
      thisTenant.packageStartDate = moment().toDate();
      thisTenant.isActivated = true;
      const newTenant = await thisTenant.save();
      return newTenant;
    } else {
      throw new Error("Invalid inputs.");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
