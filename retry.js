const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.OPS_TOKEN
  const objectType = "2-13510438";
  const properties = ["no_de_projet"];
  const latestProjectId = event.inputFields['latestProjectId'];
  const objectId = latestProjectId

  //define reusable function
  
  const hubspotClient = new hubspot.Client({"accessToken":opsToken});
  
  async function getProject() {
    try {
      const apiResponse = await hubspotClient.crm.objects.basicApi.getById(objectType, objectId, properties);
      return apiResponse
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // get the latest project

  getProject()
    .then(latestProject => {
	const latestProjectNumber = latestProject.properties.no_de_projet
    
    if (latestProjectNumber) {
      console.log(`Latest project number = ${latestProjectNumber} and ID = ` + latestProjectId)

      const projectNumber = parseInt(latestProjectNumber) + 1;
      console.log(`New project number = ` + projectNumber);

      callback({
        outputFields: {
          projectNumber: projectNumber,
          nextAction: "setProjectNumber"
        }
      });
    } else {
      callback({
        outputFields: {
          projectNumber: "NaN",
          nextAction: "retry"
        }
      });
    }
    
  })
    .catch(error => {
    console.error(error);
  });
    
    
}

 