const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
cmsAPI.init();
var Papa = require('papaparse');
const siteName = "VPGI-VPAA-HALSTORE"; // fill in
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

function generateSlug(data) {
    var newSlug = data.toLowerCase().trim();
    newSlug = newSlug.replace(/[^a-z -]/gi, '');
    newSlug = newSlug.replaceAll(' ', '-');
    newSlug = newSlug.replaceAll(',', '-');
    return newSlug;
  }

function createBlockFromRow(result) {
    console.log(result);
    console.log("attempting create block from row");
    if (result.question != "") {
        result.data.forEach(function(p, i) {
            setTimeout(function() {
                // console.log(p);
                var question = p.question;
                var answer = p.answer;
                var parentFolder = "education-abroad/faq/questions";
                var blockName = i + "-" + generateSlug(question);
                var baseAssetPath = "_cascade/base-assets/_faq-base-asset";
                var destinationContainerIdentifier = {
                    type: "folder",
                    path: {
                        path: parentFolder,
                        siteName: siteName,
                    }
                };
                // console.dir(destinationContainerIdentifier);

                // #1 first we copy
                cmsAPI.copyAsset({
                    type: "block",
                    path: baseAssetPath,
                    siteName: siteName,
                    copyParameters: {
                        newName: blockName,
                        destinationContainerIdentifier: destinationContainerIdentifier
                    }
                }).then(function(result) {
                    console.log(result);
                    // #2 then we read
                    cmsAPI.readAsset({
                        type: "block",
                        path: parentFolder + "/" + blockName,
                        siteName: siteName,
                        // Note: the copy operation does NOT return a new asset ID so we use the same global vars we used to create the copy to read the copy
                    }).then(function(result) {
                        console.log(result);
                        // #3 then we edit
                        result.apiReturn.asset.xhtmlDataDefinitionBlock.structuredData.structuredDataNodes = [
                            {
                                "type": "text",
                                "identifier": "question",
                                "text": p.question + "?",
                            },{
                                "type": "text",
                                "identifier": "answer",
                                "text": p.answer,
                            }
                        ]
                        // result.apiReturn.asset.page.metadata.startDate = p.startDate; // required format: MMM DD, YYYY hh:mm:ss A
                        // result.apiReturn.asset.page.metadata.endDate = p.endDate; // required format: MMM DD, YYYY hh:mm:ss A
                        // result.apiReturn.asset.page.metadata.reviewDate = p.reviewDate; // required format: MMM DD, YYYY hh:mm:ss A
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
}

function createBlocks() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream("./csv/test-faq-import.csv"), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: createBlockFromRow
    });
}

// createFolders();
createBlocks();