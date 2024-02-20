// example usage of the api library
// cmsUrl and cmsAPI are in your .env file

var cmsAPI = require('./lib/cascade-restapi.js');
cmsAPI.init();

cmsAPI.readAsset({
    type: "block", 
    id: "b381579b0a0000c954bf5467fe6572cd",
    debug: true  // fill in
}).then(function(result) {
    console.log(result);
    // Note: result is the object the read function returns
    // console.log(result.apiReturn.asset.page.metadata.title);
    // Note: apiReturn is the read asset as object
    // Note: Using dot notation, we drill down the object property (page XML nodes) until we reach the specific node (field) we want
}).catch(function(error) {
    console.log(error);
});