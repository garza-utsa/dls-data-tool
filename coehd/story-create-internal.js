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
const CSV_FILE = "./csv/articles-coehd.csv";
const BASE_ARTICLE_ASSET = "1acc755581736a1b76f225b37f74e19f";
var JSSoup = require('jssoup').default;
var outstandingImages = [];
var outstandingLinks = [];

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
            const id = p.id;
            const path = p.path;
            const type = p.type;
            console.log("processing page: " + id);
            if (type == "page") {
                const oldAsset = await cmsAPI.readAsset({
                    id: id,
                    type: type,
                    siteName: oldSiteName
                }).then(function(result){
                    if (result.read_status == "Success") {
                        return result.apiReturn.asset.page;
                    }
                });
                //datafields we need to populate
                var source = "COEHD News";
                var image1AssetFileId = "";
                var image2AssetFileId = "";
                //metadata
                var startDate = "";
                var title =""; //same as headline
                var author = ""; //if it exists
                var parentFolderPath = ""; //compute based off startDate "/news/YYYY/MM"
                var name = ""; //asset name

                const oldMeta = oldAsset.metadata;
                startDate = oldMeta.startDate;
                parentFolderPath = generateNewParentFolderPath(startDate);
                name = oldAsset.name.toLowerCase();
                name = name.replace(/_/g, "-");
                name = name.replace(/\s/g, "");
                console.log("new name: " + name);
                author = oldMeta.author;
                title = oldMeta.title;
                const dynaFields = oldMeta.dynamicFields;
                var tags = [];
                tags.push({ name: "news"});
                for (const f of dynaFields) {
                    if (f.name =='tags') {
                        console.log("tags to parse:");
                        console.dir(f.fieldValues);
                        const fieldVals = f.fieldValues;
                        for (const v of fieldVals) {
                            if (v != "News") {
                                tags.push({ name: v.value.toLowerCase() });
                            }
                        }
                    }
                }
                console.log("new tags generated are:");
                console.dir(tags);

                const data = oldAsset.structuredData.structuredDataNodes;
                const imageData = data[2].structuredDataNodes;
                const image1 = imageData[1];
                const image2 = imageData[3];

                if (image1.fileId != undefined) {
                    image1AssetFileId = image1.fileId;
                }

                if (image2.fileId != undefined) {
                    image2AssetFileId = image2.fileId;
                }

                if (image2AssetFileId != "" && image1AssetFileId == ""){
                    image1AssetFileId = image2AssetFileId;
                    image2AssetFileId = undefined;
                }
                if (image2AssetFileId == "") {
                    image2AssetFileId = undefined;
                }

                //collect all WYSIWYG data
                var htmlContent = "";
                for (const group of oldAsset.structuredData.structuredDataNodes) {
                    if (group.identifier == "ROW") {
                        for (const groupChildren of group.structuredDataNodes) {
                            if (groupChildren.identifier == "HTML") {
                                if (groupChildren.text != "") {
                                    htmlContent = htmlContent + groupChildren.text;
                                }
                            }
                        }
                    }
                }

                const copyParams = {
                    type: "page",
                    id: BASE_ARTICLE_ASSET,
                    copyParameters: {
                        newName: name,
                        destinationContainerIdentifier: {
                            type: "folder",
                            path: {
                                path: parentFolderPath,
                                siteName: newSiteName
                            }
                        }
                    }
                }
                // console.dir(copyParams);

                // create copy of external link template
                // const copyOp = await cmsAPI.copyAsset(copyParams).then(function(result){
                //     console.log("CREATE: " + result.copy_status);
                //     // console.dir(result);
                // }).catch(function (error) {
                //     console.log("CREATE ERROR:");
                //     console.log(error);
                // });

                const newAsset = await cmsAPI.readAsset({
                    path: parentFolderPath + "/" + name,
                    type: "page",
                    siteName: newSiteName
                }).then(function(result){
                    if (result.read_status == "Success") {
                        return result.apiReturn.asset.page;
                    }
                }).catch(function (error){
                    console.log("POST CREATE READ ERROR:");
                    console.log(error);
                });

                htmlContent = updateContent(htmlContent, newAsset.id);

                //edit values
                // console.log("READ:");
                // console.dir(newAsset);
                var newMeta = {
                    "title": title,
                    "startDate": startDate,
                    "author": author,
                    "teaser": ""
                };
                newAsset.metadata = newMeta;
                newAsset.tags = tags;
                console.log("new edited asset metadata:");
                console.log(JSON.stringify(newAsset.metadata));
                if (image1AssetFileId != undefined) {
                    newAsset.structuredData.structuredDataNodes[1].structuredDataNodes[0].fileId = image1AssetFileId;
                    newAsset.structuredData.structuredDataNodes[1].structuredDataNodes[1].text = "";
                } else {
                    //remove placeholder image from template asset
                    delete newAsset.structuredData.structuredDataNodes[1].structuredDataNodes[0].fileId;
                    delete newAsset.structuredData.structuredDataNodes[1].structuredDataNodes[0].filePath;
                }
                if (image2AssetFileId != undefined) {
                    newAsset.structuredData.structuredDataNodes[2].structuredDataNodes[0].fileId = image2AssetFileId;
                }
                newAsset.structuredData.structuredDataNodes[3].text = "custom";

                newAsset.structuredData.structuredDataNodes[6].text = htmlContent;
                //post edit
                const editedAsset = await cmsAPI.editAsset({
                    asset: { "asset": {"page": newAsset} }
                });
                console.log("NEW ASSET UPDATED: " + editedAsset.edit_status);

                // console.log("create new external link type article from page: " + path);

                // console.dir(JSON.stringify(imageData));
            }
        };

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

function updateContent(html, assetid) {
    //HTML tidy?
    //output list of images that will need to be moved?
    //output list of all local anchors (to documents that may need to be moved)
    var soup = new JSSoup(html, false);
    var images = soup.findAll('img');
    var anchors = soup.findAll('a');
    var imageClasses = "w-50 p-3 ";
    //update to float-start and float-end for left/right
    for (const i of images) {
        outstandingImages.push({
            "image": i.attrs.src,
            "parentId": assetid
        });
        if (i.attrs.class != undefined) {
            if (i.attrs.class.includes('image-left')) {
                imageClasses = imageClasses + "float-start";
            }
            if (i.attrs.class.includes('image-right')) {
                imageClasses = imageClasses + "float-end";
            }
            if (i.attrs.width != undefined) {
                delete i.attrs.width;
            }
            if (i.attrs.height != undefined) {
                delete i.attrs.height;
            }
        }
        i.attrs.class = imageClasses;
    }

    for (const a of anchors) {
        if (a.attrs.href != undefined) {
            if (a.attrs.href.includes("education.utsa.edu") || a.attrs.href.startsWith("/")) {
                outstandingLinks.push({
                    "anchor": a.attrs.href,
                    "parentId": assetid
                });
            }
        }
    }
    return soup.prettify(' ', '');
    // return html;
}

function outputOutstanding() {
    csv = Papa.unparse(outstandingImages);
    fs.writeFileSync('csv/outstanding-images.csv', csv, 'utf8');

    csv = Papa.unparse(outstandingLinks);
    fs.writeFileSync('csv/outstanding-links.csv', csv, 'utf8');
}

readCSV();

