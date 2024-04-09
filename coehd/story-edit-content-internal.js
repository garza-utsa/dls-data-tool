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
const CSV_FILE = "./csv/outstanding-images.csv";
const BASE_ARTICLE_ASSET = "1acc755581736a1b76f225b37f74e19f";
var JSSoup = require('jssoup').default;
var outstandingImages = [];
var outstandingLinks = [];
const { basename, dirname } = require('path');

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

function readCSV() {
    Papa.parse(fs.createReadStream(CSV_FILE), {
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
        for (const p of rows.data) {
            console.dir(p); 
            const id = p.parentId;
            const image = p.image;
            console.log("processing page: " + id);
            const currentAsset = await cmsAPI.readAsset({
                id: id,
                type: "page",
                siteName: newSiteName
            }).then(function(result){
                if (result.read_status == "Success") {
                    return result.apiReturn.asset.page;
                }
            });
            // console.log(JSON.stringify(currentAsset));
            var filename = basename(image);
            filename = filename.toLowerCase();
            filename = filename.replace(/\s/g, "");
            var parentFolderPath = dirname(image);
            // console.log("filename: " + filename);
            // console.log("parentFolderPath: " + parentFolderPath);
            var opath = image;
            if (opath.startsWith("/")) {
                opath = opath.substring(1, opath.length);
                console.log(opath);
            }
            if (parentFolderPath.startsWith("/")) {
                parentFolderPath = parentFolderPath.substring(1, parentFolderPath.length);
                console.log("parent folder path: " + parentFolderPath);
            }
        
            const fileAsset = await cmsAPI.readAsset({
                type: "file",
                path: opath,
                siteName: oldSiteName
            }).then(function(result){
                if (result.read_status == "Success") {
                    return result.apiReturn.asset;
                }
            });
        
            const ofileId = fileAsset.file.id;
            // console.log("asset to copy: " + ofileId);
        
            const copyParams = {
                type : "file",
                id : ofileId,
                copyParameters: {
                    newName: filename,
                    destinationContainerIdentifier: {
                        type: "folder",
                        path: {
                            path: parentFolderPath,
                            siteName: newSiteName,
                        }
                    }
                }
            };
        
            // console.log("copy params: ");
            // console.log(JSON.stringify(copyParams));
            const copyOp = await cmsAPI.copyAsset(copyParams).then(function(result){
                console.log("CREATE: " + result.copy_status);
                return result.copy_status;
                // console.dir(result);
            }).catch(function (error) {
                console.log("CREATE ERROR:");
                console.log(error);
            });
            
        }
        console.log("readCSV::readPageFromRow COMPLETE"); 
        // outputOutstanding();
    }
}



function generateNewParentFolderPath(startDate) {
    // console.log(startDate);
    var newFolderPath = "news/";
    const year = parseInt(startDate.substring(0, 4));
    const month = startDate.substring(5, 7);
    newFolderPath = newFolderPath + year + "/" + month;
    // console.log("new folder path for article: " + newFolderPath);
    return newFolderPath
}

async function fixImage(image, startDate) {
    //given an image, use copy to place a copy at the same path on newSitename
    var filename = basename(image);
    filename = filename.toLowerCase();
    filename = filename.replace(/\s/g, "");
    var parentFolderPath = dirname(image);
    // console.log("filename: " + filename);
    // console.log("parentFolderPath: " + parentFolderPath);
    var opath = image;
    if (opath.startsWith("/")) {
        opath = opath.substring(1, opath.length);
        console.log(opath);
    }
    if (parentFolderPath.startsWith("/")) {
        parentFolderPath = parentFolderPath.substring(1, parentFolderPath.length);
        console.log("parent folder path: " + parentFolderPath);
    }

    const readFile = await cmsAPI.readAsset({
        type: "file",
        path: opath,
        siteName: oldSiteName
    }).then(function(result){
        if (result.read_status == "Success") {
            return result.apiReturn.asset;
        }
    });

    const ofileId = readFile.file.id;
    // console.log("asset to copy: " + ofileId);

    const copyParams = {
        type : "file",
        id : ofileId,
        copyParameters: {
            newName: filename,
            destinationContainerIdentifier: {
                type: "folder",
                path: {
                    path: parentFolderPath,
                    siteName: newSiteName,
                }
            }
        }
    };

    // console.log("copy params: ");
    // console.log(JSON.stringify(copyParams));
    const copyOp = await cmsAPI.copyAsset(copyParams).then(function(result){
        console.log("CREATE: " + result.copy_status);
        // console.dir(result);
    }).catch(function (error) {
        console.log("CREATE ERROR:");
        console.log(error);
    });
}



function outputOutstanding() {
    csv = Papa.unparse(outstandingImages);
    fs.writeFileSync('csv/outstanding-images.csv', csv, 'utf8');

    csv = Papa.unparse(outstandingLinks);
    fs.writeFileSync('csv/outstanding-links.csv', csv, 'utf8');
}

readCSV();

