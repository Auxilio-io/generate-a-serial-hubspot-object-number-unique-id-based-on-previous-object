const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  
  //define variables
  const opsToken = process.env.OPS_TOKEN
  var allProjects = [];
  const objectType = "2-13510438";
  const limit = 100;
  var after = undefined;
  const properties = ["no_de_projet"];
  const archived = false;
  var hasMore = true;
  const projectId = event.inputFields['hs_object_id'];

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
    const latestProject = allProjectsExceptTheCurrent.reduce((a, b) => a.properties.createdAt > b.properties.createdAt ? a : b);
    var latestProjectNumber = latestProject.properties.no_de_projet
    

    console.log(`Latest project number = ${latestProjectNumber} and ID = ` + latestProject.id)

    const projectNumber = parseInt(latestProjectNumber) + 1;
    console.log(`New project number = ` + projectNumber);

    callback({
    outputFields: {
        projectNumber: projectNumber
    }
    });

  } else {
    console.error("No projects found");
  }
}

 