const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.SERIAL_RECORD_ID_GENERATOR
  const objectType = "2-13510438"; // This is the type id of the custom object used in this example. Could be replaced with any standard object (contacts, deals, companies, tickets) or another custom object type id 2-XXXXX
  const properties = ["serial_number_id"]; // This is the name of your serial number property. This property needs to be created on the object first. 
  const latestRecordId = event.inputFields['latestRecordId'];
  const objectId = latestRecordId

  //define reusable function
  
  const hubspotClient = new hubspot.Client({"accessToken":opsToken});
  
  async function getRecord() {
    try {
      const apiResponse = await hubspotClient.crm.objects.basicApi.getById(objectType, objectId, properties);
      return apiResponse
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // get the latest record

  getRecord()
    .then(latestRecord => {
	const latestRecordNumber = latestRecord.properties.serial_number_id
    
    if (latestRecordNumber) {
      console.log(`Latest number = ${latestRecordNumber} and ID = ` + latestRecordId)

      const recordNumber = parseInt(latestRecordNumber) + 1;
      console.log(`New number = ` + recordNumber);

      callback({
        outputFields: {
          recordNumber: recordNumber,
          nextAction: "setRecordNumber"
        }
      });
    } else {
      callback({
        outputFields: {
          recordNumber: "NaN",
          nextAction: "retry"
        }
      });
    }
    
  })
    .catch(error => {
    console.error(error);
  });
    
    
}

 
