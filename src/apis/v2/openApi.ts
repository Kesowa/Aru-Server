import { bearerAuth, OpenApi } from "ts-openapi";
import { API_SERVER } from "../../constants";

// create an OpenApi instance to store definitions
const openApi = new OpenApi(
  "v1.0", // API version
  "Our Awesome Api", // API title
  "Describing how to keep APIs documented.", // API description
  "nelson.gomes@pipedrive.com" // API maintainer
);

// declare servers for the API
openApi.setServers([{ url: API_SERVER + "/apis/v2" }]);

// set API license
openApi.setLicense(
  "Apache License, Version 2.0", // API license name
  "http://www.apache.org/licenses/LICENSE-2.0", // API license url
  "http://dummy.io/terms/" // API terms of service
);

openApi.declareSecurityScheme("bearerSecurity", bearerAuth());
openApi.addGlobalSecurityScheme("bearerSecurity");

export default openApi;
