const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.SERIAL_RECORD_ID_GENERATOR
  var allProjects = [];
  const objectType = "2-13510438"; // this the type id of the custom object project used in this example. Could be replaced with any standard object (contacts, deals, companies, tickets) or another custom object type id 2-XXXXX
  const limit = 100;
  var after = undefined;
  const properties = ["serial_number_id"];
  const archived = false;
  var hasMore = true;
  const projectId = event.inputFields['hs_object_id'];
  const createdate = event.inputFields['hs_createdate'];

  //define reusable function
  
  const hubspotClient = new hubspot.Client({"accessToken":opsToken});
  
  async function listProjectRecord(objectType, limit, after, properties, archived) {
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
  
  // get all projects record
  
  while (hasMore) {
    const projectsPage = await listProjectRecord(objectType, limit, after, properties, archived);

    if (projectsPage && projectsPage.results && projectsPage.results.length > 0) {
      allProjects.push(...projectsPage.results);
    }

    if (projectsPage.paging && projectsPage.paging.next) {
      console.log("There is another page");
      after = projectsPage.paging.next.after;
    }
    else {
      console.log("There are no more pages");
      hasMore = false;
    }
  }
  
  // remove the project enrolled in this workflow from the list
  const allProjectsExceptTheCurrent = allProjects.filter(function(project) {
	return project.id !== projectId;
  });
  
  if (allProjectsExceptTheCurrent.length > 0) {
    // get latest project number
	const latestProject = allProjectsExceptTheCurrent.reduce((latest, current) => {
		const currentCreateDate = Date.parse(current.properties.hs_createdate);
		const latestCreateDate = parseInt(createdate);
		
		// Check if the project was created before the specified createdate
		if (currentCreateDate < latestCreateDate) {
			// Update the latest project if it's empty or if the current project was created more recently
			if (!latest || currentCreateDate > Date.parse(latest.properties.hs_createdate)) {
			latest = current;
			}
		}
		
		return latest;
		}, null);
	  
    var latestProjectId = latestProject.id
    var latestProjectNumber = latestProject.properties.serial_number_id
    
    if (latestProjectNumber) {
      console.log(`Latest project number = ${latestProjectNumber} and ID = ` + latestProjectId)

      const projectNumber = parseInt(latestProjectNumber) + 1;
      console.log(`New project number = ` + projectNumber);

      callback({
        outputFields: {
          latestProjectId: latestProjectId,
          projectNumber: projectNumber,
          nextAction: "setProjectNumber"
        }
      });
    } else {
      callback({
        outputFields: {
          latestProjectId: latestProjectId,
          projectNumber: "NaN",
          nextAction: "retry"
        }
      });
    }

  } else {
    console.error("No projects found");
  }
}