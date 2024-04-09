const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
// var { tidy } = require('htmltidy2')
var libtidy = require("node-libtidy");
var doc = libtidy.TidyDoc();

cmsAPI.init();
var Papa = require('papaparse');
const siteName = "TEACHING-VPAA-ASC-HALSTORE";
const CSV_FILE = "./csv/tldt.csv"; // fill in

const FOLDER_BASE_ID = "5db2337d81736a1b39636f4e5ac4336a";
const PAGE_BASE_ID = "5dc2b81381736a1b39636f4e08f2faf4";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

function createFolderFromRow(result) {
    result.data.forEach(function(f, i) {
        setTimeout(function() {
            var type = f.Type;
            if (type == "folder") {
                console.log("processing row: ");
                console.log(f);
                var path = f.URI;
                var title = f.Title;
                const lastslash = path.lastIndexOf("/");
                console.log("last index of / is: " + lastslash);
                var parentFolder = "/images" + path.substr(0, path.lastIndexOf("/"));
                var folderName = path.substring(path.lastIndexOf("/") + 1);
                if (parentFolder == "") { parentFolder = "/"; }
                console.log("parentFolder: " + parentFolder);
                console.log("folderName: " + folderName);
                console.log("type: " + type);
                /* Note: using the path of the new folder we separate the folder name and the parent folder of that folder
                    you'll want to make sure any parent folder needed for sub folders are created first by having parent folders listed before sub folders in the csv
                    EVEN THEN, for one reason or another, some operations finish faster then others even though they started later
                    a simple workaround is to add a delay to the loop  */

                // #1 first we copy
                cmsAPI.copyAsset({
                    type: "folder",
                    id: FOLDER_BASE_ID,
                    siteName: siteName,
                    debug: true,
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
                        result.apiReturn.asset.folder.metadata.displayName = f.Title;
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
            }


        }, i * 400);
    });
}

function createFolders() {
    papaConfig.complete = createFolderFromRow;
    Papa.parse(fs.createReadStream(CSV_FILE), papaConfig);
}

function createPageFromRow(result) {
    console.log(result);
    result.data.forEach(function(p, i) {
        setTimeout(function() {
            // console.log(p);
            const type = p.Type;
            if (type == "page") {
                var path = p.URI;
                var parentFolder = path.substr(0, path.lastIndexOf("/"));
                var pageName = path.substring(path.lastIndexOf("/") + 1);
                pageName = pageName.replace('.html', '');
                // #1 first we copy
                cmsAPI.copyAsset({
                    type: "page",
                    id: PAGE_BASE_ID,
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
                        result.apiReturn.asset.page.metadata.displayName = p.Title;
                        result.apiReturn.asset.page.metadata.title = p.Title;

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
            }

        }, i * 400);
    });
}

function editPageFromRow(result) {
    console.log(result);
    result.data.forEach(function(p, i) {
        setTimeout(function() {
            // console.log(p);
            const type = p.Type;
            if (type == "page") {
                var path = p.URI;
                var parentFolder = path.substr(0, path.lastIndexOf("/"));
                var pageName = path.substring(path.lastIndexOf("/") + 1);
                pageName = pageName.replace('.html', '');
                // #1 first we copy

                cmsAPI.readAsset({
                    type: "page",
                    path: parentFolder + "/" + pageName,
                    siteName: siteName,
                    // Note: the copy operation does NOT return a new asset ID so we use the same global vars we used to create the copy to read the copy
                }).then(function(result) {
                    console.log(result);
                    // #3 then we edit
                    result.apiReturn.asset.page.metadata.displayName = p.Title;
                    result.apiReturn.asset.page.metadata.title = p.Title;

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

            }

        }, i * 400);
    });
}

function setSourceFromRow(result) {
    // console.log(result);
    result.data.forEach(function(p, i) {
        setTimeout(function() {
            // console.log(p);
            const type = p.Type;

            if (type == "page") {
                var path = p.URI;
                var parentFolder = path.substr(0, path.lastIndexOf("/"));
                var pageName = path.substring(path.lastIndexOf("/") + 1);
                pageName = pageName.replace('.html', '');
                // #1 first we copy
                const pageContent = {
                    "type": "group",
                    "identifier": "pageContent",
                    "structuredDataNodes": [
                        {
                            "type": "text",
                            "identifier": "wysiwyg",
                            "text": p.Source + " - " + p.SourceType,
                        }
                    ]
                };

                cmsAPI.readAsset({
                    type: "page",
                    path: parentFolder + "/" + pageName,
                    siteName: siteName,
                    // Note: the copy operation does NOT return a new asset ID so we use the same global vars we used to create the copy to read the copy
                }).then(function(result) {
                    // console.log(result);
                    // #3 then we edit
                    result.apiReturn.asset.page.structuredData.structuredDataNodes[1] = pageContent;
                    cmsAPI.editAsset({
                        asset: result.apiReturn,
                    }).then(function(result) {
                        console.log("Edit: " + result.edit_status + " - " + p.URI);
                    }).catch(function(error) {
                        console.log("ERROR");
                        console.log(error);
                    });
                    // Note: using the edit function, we send back the edited object 
                }).catch(function(error) {
                    console.log("CATCH: ");
                    console.log(error);
                });

            }

        }, i * 400);
    });
}

async function setSourceFromWordPress(rows) {
    // console.log(result);
    for (const p of rows.data) {
        // console.log(p);
        const type = p.Type;
        const stype = p.SourceType;

        if ((type == "page") & (stype == "WordPress")) {
            var path = p.URI;
            var parentFolder = path.substr(0, path.lastIndexOf("/"));
            var pageName = path.substring(path.lastIndexOf("/") + 1);
            var sourceURL = p.Source;
            pageName = pageName.replace('.html', '');
            //parse our base url and slug from sourceURL

            const urlParts = sourceURL.trim().split('/');
            // console.log(sourceURL);
            // console.dir(urlParts);
            const site = urlParts[0] + "//" +  urlParts[2];
            const partsSize = urlParts.length;
            var slug = "";
            for (let i = 3; i < partsSize; ++i) {
                if (urlParts[i] != '') {
                    slug = urlParts[i];
                }
            }
            // console.log(sourceURL);
            // console.log(p.URI);
            // console.log("site: " + site + "\t slug: " + slug);2

            try {
                var wpcontent = await getWPContentFromSlug(site, slug);
                if (wpcontent.read_status == "Success") {
                    const content = wpcontent.apiReturn.content.rendered;
                    console.log("content found size: " + content.length + "\t\t\t" + slug);
                    const newContentRow = {
						"type": "group",
						"identifier": "row",
						"structuredDataNodes": [
							{
								"type": "text",
								"identifier": "type",
								"text": "wysiwyg"
							},
							{
								"type": "text",
								"identifier": "wysiwyg",
								"text": content
							}
						]
					};

                    const pageAsset = await cmsAPI.readAsset({
                        type: "page",
                        path: parentFolder + "/" + pageName,
                        siteName: siteName
                    });

                    pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2] = newContentRow;
                    cmsAPI.editAsset({
                        asset: pageAsset.apiReturn,
                    }).then(function(result) {
                        console.log("Edit: " + result.edit_status + " - " + p.URI);
                    }).catch(function(error) {
                        console.log("ERROR");
                        console.log(error);
                    });
                }
            } catch (e) {
                console.log("*** ERROR while fetching: " + sourceURL);
                console.log("slug: " + slug);
            }
        }
    }
}

async function cleanContentFromRow(rows) {
    var i = 0;
    for (const p of rows.data) {
        await sleep(100);
        const type = p.Type;
        const stype = p.SourceType;

        if ((type == "page") & (stype == "WordPress")) {
            var path = p.URI;
            var parentFolder = path.substr(0, path.lastIndexOf("/"));
            var pageName = path.substring(path.lastIndexOf("/") + 1);
            pageName = pageName.replace('.html', '');
            // #1 first we copy

            var pageAsset = await cmsAPI.readAsset({
                type: "page",
                path: parentFolder + "/" + pageName,
                siteName: siteName,                
            });
            if (pageAsset.read_status == "Success") {
                //  #2 then we copy
                var dirtyContent = pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes[2];
                doc.options = {
                    "show-body-only": "yes",
                    "hide-comments": "yes",
                    "indent": "yes",
                    "drop-empty-elements": "yes",
                    "drop-empty-paras": "yes",
                    "drop-proprietary-attributes": "yes",
                    "merge-divs": "yes",
                    "numeric-entities": "yes",
                    "output-xhtml": "yes"
                };
                if (dirtyContent.text != undefined) {
                    var buf = Buffer.from(dirtyContent.text, 'utf8');
                    doc.parseBufferSync(buf);
                    doc.cleanAndRepairSync();
                    doc.runDiagnosticsSync()
                    var cleanText = doc.saveBufferSync().toString();
                    // console.log(cleanText);
                    pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes[2].text = cleanText
                    console.log("updating page: " + p.URI);

                    // const optList = doc.getOptionList();
                    // for (const o of optList) {
                    //     console.log(o.name + "\t" + o.pickList);
                    // }

                    cmsAPI.editAsset({
                        asset: pageAsset.apiReturn,
                    }).then(function(result) {
                        console.log("Edited: " + result.edit_status + " - " + p.URI);
                        // console.log(result);
                    }).catch(function(error) {
                        console.log(error);
                    });
                }
            }
        }

    }

}

function createPages() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: createPageFromRow
    });
}

function editPages() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: editPageFromRow
    });
}

function setSource() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: setSourceFromRow
    });
}

async function importWordPressContent() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: setSourceFromWordPress
    });
}

async function cleanContent() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: cleanContentFromRow
    });
}

// createFolders();
// createPages();
// editPages();
// setSource();
// importWordPressContent();
cleanContent();

function getWPContentFromSlug(site, slug) {
    //https://teaching.utsa.edu/wp-json/wp/v2/pages?slug=faculty-learning-communities
    var url = site + "/wp-json/wp/v2/pages?slug=" + slug;
    return new Promise(function(resolve, reject){
        fetch(url)
        .then((r) => r.json())
        .then((data) => {
            if (data.length > 0) {
                resolve({ read_status: "Success", sent: slug, apiReturn: data[0], url: url });
            } else {
                reject({ read_status: "Error", error: data.message, sent: slug, apiReturn: data, url: url });
            }
        });       
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }