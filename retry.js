const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.SERIAL_RECORD_ID_GENERATOR
  const objectType = "2-13510438"; // this the type id of the custom object project used in this example. Could be replaced with any standard object (contacts, deals, companies, tickets) or another custom object type id 2-XXXXX
  const properties = ["serial_number_id"];
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
	const latestProjectNumber = latestProject.properties.serial_number_id
    
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

 