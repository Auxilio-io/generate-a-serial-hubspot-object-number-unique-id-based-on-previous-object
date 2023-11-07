const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.SERIAL_RECORD_ID_GENERATOR
  var allRecords = [];
  const objectType = "2-13510438"; // This is the type id of the custom object used in this example. Could be replaced with any standard object (contacts, deals, companies, tickets) or another custom object type id 2-XXXXX
  const limit = 100;
  var after = undefined;
  const properties = ["serial_number_id"]; // This is the name of your serial number property. This property needs to be created on the object first. 
  const archived = false;
  var hasMore = true;
  const recordId = event.inputFields['hs_object_id'];
  const createdate = event.inputFields['hs_createdate'];

  //define reusable function
  
  const hubspotClient = new hubspot.Client({"accessToken":opsToken});
  
  async function listRecords(objectType, limit, after, properties, archived) {
      try {
        const apiResponse = await hubspotClient.crm.objects.basicApi.getPage(objectType, limit, after, properties, archived);
        return apiResponse;
      } catch (e) {
        if (e.response) {
          console.error(JSON.stringify(e.response, null, 2));
        } else {
          console.error(e);
        }
      }
  
  }
  
  // get all records
  
  while (hasMore) {
    const recordsPage = await listRecords(objectType, limit, after, properties, archived);

    if (recordsPage && recordsPage.results && recordsPage.results.length > 0) {
      allRecords.push(...recordsPage.results);
    }

    if (recordsPage.paging && recordsPage.paging.next) {
      console.log("There is another page");
      after = recordsPage.paging.next.after;
    }
    else {
      console.log("There are no more pages");
      hasMore = false;
    }
  }
  
  // remove the record enrolled in this workflow from the list
  const allRecordsExceptTheCurrent = allRecords.filter(function(record) {
	return record.id !== recordId;
  });
  
  if (allRecordsExceptTheCurrent.length > 0) {
    // get latest number
	const latestRecords = allRecordsExceptTheCurrent.reduce((latest, current) => {
		const currentCreateDate = Date.parse(current.properties.hs_createdate);
		const latestCreateDate = parseInt(createdate);
		
		// Check if the record was created before the specified createdate
		if (currentCreateDate < latestCreateDate) {
			// Update the latest record if it's empty or if the current record was created more recently
			if (!latest || currentCreateDate > Date.parse(latest.properties.hs_createdate)) {
			latest = current;
			}
		}
		
		return latest;
		}, null);
	  
    var latestRecordId = latestRecords.id
    var latestRecordNumber = latestRecords.properties.serial_number_id
    
    if (latestRecordNumber) {
      console.log(`Latest number = ${latestRecordNumber} and ID = ` + latestRecordId)

      const recordNumber = parseInt(latestRecordNumber) + 1;
      console.log(`New number = ` + recordNumber);

      callback({
        outputFields: {
          latestRecordId: latestRecordId,
          recordNumber: recordNumber,
          nextAction: "setRecordNumber"
        }
      });
    } else {
      callback({
        outputFields: {
          latestRecordId: latestRecordId,
          recordNumber: "NaN",
          nextAction: "retry"
        }
      });
    }

  } else {
    console.error("No records found");
  }
}
