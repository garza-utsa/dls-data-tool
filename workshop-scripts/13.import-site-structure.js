const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
cmsAPI.init();
var Papa = require('papaparse');
const siteName = "CUC24-WS-Garza"; // fill in

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

function createFolderFromRow(result) {
    console.log(result);
    result.data.forEach(function(f, i) {
        setTimeout(function() {
            // console.log(f);
            var path = f.path;
            var parentFolder = path.substr(0, path.lastIndexOf("/"));
            var folderName = path.substring(path.lastIndexOf("/") + 1);
            /* Note: using the path of the new folder we separate the folder name and the parent folder of that folder
                you'll want to make sure any parent folder needed for sub folders are created first by having parent folders listed before sub folders in the csv
                EVEN THEN, for one reason or another, some operations finish faster then others even though they started later
                a simple workaround is to add a delay to the loop  */

            // #1 first we copy
            cmsAPI.copyAsset({
                type: "folder",
                path: f.baseasset,
                siteName: siteName,
                copyParameters: {
                    newName: folderName,
                    destinationContainerIdentifier: {
                        type: "folder",
                        path: {
                            path: parentFolder,
                            siteName: siteName,
                        }
                    }
                }
            }).then(function(result) {
                console.log(result);
                // #2 then we read
                cmsAPI.readAsset({
                    type: "folder",
                    path: parentFolder + "/" + folderName,
                    siteName: siteName,
                    // Note: the copy operation does NOT return a new asset ID so we use the same global vars we used to create the copy to read the copy
                }).then(function(result) {
                    console.log(result);
                    // #3 then we edit
                    result.apiReturn.asset.folder.metadata.displayName = f.displayname;
                    result.apiReturn.asset.folder.shouldBeIndexed = f.indexable;
                    result.apiReturn.asset.folder.shouldBePublished = f.publishable;
                    cmsAPI.editAsset({
                        asset: result.apiReturn,
                    }).then(function(result) {
                        console.log(result);
                    }).catch(function(error) {
                        console.log(error);
                    });
                    // Note: using the edit function, we send back the edited object 
                }).catch(function(error) {
                    console.log(error);
                });
            }).catch(function(error) {
                console.log(error);
            });
        }, i * 400);
    });
}

function createFolders() {
    papaConfig.complete = createFolderFromRow;
    Papa.parse(fs.createReadStream("./csv/folders.csv"), papaConfig);
}

function createPageFromRow(result) {
    console.log(result);
    result.data.forEach(function(p, i) {
        setTimeout(function() {
            // console.log(p);
            var path = p.path;
            var parentFolder = path.substr(0, path.lastIndexOf("/"));
            var pageName = path.substring(path.lastIndexOf("/") + 1);

            // #1 first we copy
            cmsAPI.copyAsset({
                type: "page",
                path: p.baseasset,
                siteName: siteName,
                copyParameters: {
                    newName: pageName,
                    destinationContainerIdentifier: {
                        type: "folder",
                        path: {
                            path: parentFolder,
                            siteName: siteName,
                        }
                    }
                }
            }).then(function(result) {
                console.log(result);
                // #2 then we read
                cmsAPI.readAsset({
                    type: "page",
                    path: parentFolder + "/" + pageName,
                    siteName: siteName,
                    // Note: the copy operation does NOT return a new asset ID so we use the same global vars we used to create the copy to read the copy
                }).then(function(result) {
                    console.log(result);
                    // #3 then we edit
                    result.apiReturn.asset.page.shouldBePublished = p.publishable;
                    result.apiReturn.asset.page.shouldBeIndexed = p.indexable;
                    result.apiReturn.asset.page.metadata.displayName = p.displayname;
                    result.apiReturn.asset.page.metadata.title = p.title;
                    result.apiReturn.asset.page.metadata.author = p.author;
                    result.apiReturn.asset.page.metadata.keywords = p.keywords;
                    result.apiReturn.asset.page.metadata.summary = p.summary;
                    result.apiReturn.asset.page.metadata.metaDescription = p.description;
                    // result.apiReturn.asset.page.metadata.startDate = p.startDate; // required format: MMM DD, YYYY hh:mm:ss A
                    // result.apiReturn.asset.page.metadata.endDate = p.endDate; // required format: MMM DD, YYYY hh:mm:ss A
                    // result.apiReturn.asset.page.metadata.reviewDate = p.reviewDate; // required format: MMM DD, YYYY hh:mm:ss A
                    delete result.apiReturn.asset.page.expirationFolderId; // when replacing an asset value that has both id and path, you must delete one and replace the other
                    result.apiReturn.asset.page.expirationFolderPath = p.expfolderpath;
                    cmsAPI.editAsset({
                        asset: result.apiReturn,
                    }).then(function(result) {
                        console.log(result);
                    }).catch(function(error) {
                        console.log(error);
                    });
                    // Note: using the edit function, we send back the edited object 
                }).catch(function(error) {
                    console.log(error);
                });
            }).catch(function(error) {
                console.log(error);
            });
        }, i * 400);
    });
}

function createPages() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream("./csv/pages.csv"), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: createPageFromRow
    });
}

// createFolders();
createPages();