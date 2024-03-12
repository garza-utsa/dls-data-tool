/** 
Objective: 
- for each article, read asset
- find images in structured data
- parse startDate to compute news/year/images folder path
- move images to new folder path computed above
**/
const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
cmsAPI.init();
var Papa = require('papaparse');
const oldSiteName = "COEHD-VPAA-OLD";
const newSiteName = "COEHD-VPAA-DLS-HALSTORE" // fill in
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const START_YEAR = 2020;
const END_YEAR = 2024;

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

function readCSV() {
    Papa.parse(fs.createReadStream("./csv/articles.csv"), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: readPageFromRow
    });    
}

async function readPageFromRow(rows) {

    if (rows.id != "") {
        rows.data.forEach(function(p, i){
            const id = p.id;
            const path = p.path;
            const type = p.type;
            console.log("processing page: " + path);
            if (type == "page") {
                cmsAPI.readAsset({
                    id: id,
                    type: type,
                    siteName: oldSiteName
                }).then(function(result){
                    if (result.read_status == "Success") {
                        const startDate = result.apiReturn.asset.page.metadata.startDate;
                        // console.log(JSON.stringify(result.apiReturn.asset.page));
                        // console.dir(startDate);
                        const imageData = result.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes;
                        const image1 = imageData[1];
                        const image2 = imageData[3];

                        if (image1.fileId != undefined) {
                            // console.dir(image1);
                            console.log("move image with ID: " + image1.fileId);
                            moveImage(startDate, image1, oldSiteName, newSiteName).then(function (result) {
                                console.log("image1 moved");
                                // console.log(result);
                            }).catch(function (error) {
                                console.log(error);
                            });
                        }
                        if (image2.fileId != undefined) {
                            console.log("move image with ID: " + image2.fileId);
                            moveImage(startDate, image2, oldSiteName, newSiteName).then(function (result) {
                                console.log("image2 moved");
                                // console.log(result);
                            }).catch(function (error) {
                                console.log(error);
                            });
                        }
                        // console.dir(JSON.stringify(imageData));
                    }
                })
            }
        });
    }
}

async function moveImage(startDate, imageData, oldSite, newSite) {
    const newParentFolderPath = generateNewParentFolderPath(startDate);
    console.log(startDate + " -> " + newParentFolderPath);
    const fileName = imageData.filePath.split('/').pop();
    var newFileName = fileName.toLowerCase();
    newFileName = newFileName.replace(/_/g, "-");
    console.log("move image with name: " + fileName + "-> "   + newFileName);
    console.log("move image with ID: " + imageData.fileId);
    const moveParams = {
        type: "file",
        path: imageData.filePath, // fill in
        siteName: oldSite, // fill in
        moveParameters: {
            destinationContainerIdentifier: {
                type: "folder",
                path: {
                    path: newParentFolderPath,
                    siteName: newSite
                },
            },
            newName: newFileName
        }
    }
    console.log(JSON.stringify(moveParams));
    return cmsAPI.moveAsset(moveParams)
}


function generateNewParentFolderPath(startDate) {
    var newFolderPath = "news/";
    const year = parseInt(startDate.substring(0, 4));
    newFolderPath = newFolderPath + year + "/images";
    return newFolderPath;
}

readCSV();

