### Steps for generating OpenAPI Spec Sheet :

- Install swagger-cli :
  `npm install -g swagger-cli`

- Go into the openAPI folder :
  `cd server/openAPI`

- Use swagger-cli to generate the spec sheet :
  `swagger-cli bundle openAPI.yaml --outfile result.yaml --type yaml`

After this, the finally generated spec sheet will be the `result.yaml` file