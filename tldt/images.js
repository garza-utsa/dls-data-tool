const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
cmsAPI.init();
var Papa = require('papaparse');
const siteName = "TEACHING-VPAA-ASC-HALSTORE";
const CSV_FILE = "./csv/tldt.csv"; // fill in
const IMG_FILE = "./csv/images.csv";
const MOVED_FILE = "./csv/images-moved.csv";

var JSSoup = require('jssoup').default;
const url = require('node:url');
const path = require('path');

const FOLDER_BASE_ID = "5db2337d81736a1b39636f4e5ac4336a";
const PAGE_BASE_ID = "5dc2b81381736a1b39636f4e08f2faf4";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const ODL = "odl.utsa.edu";
const TLD = "teaching.utsa.edu";
const ODL_LOCAL = "./odl/";
const TLD_LOCAL = "./teaching/";

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

//TODO: PRESERVE original image src, don't save http: > https:

async function imageAuditFromRow(rows) {
    var images = [];

    for (const p of rows.data) {
        const type = p.Type;
        const stype = p.SourceType;

        if ((type == "page") & (stype == "WordPress")) {
            var path = p.URI;
            var parentFolder = path.substr(0, path.lastIndexOf("/"));
            var pageName = path.substring(path.lastIndexOf("/") + 1);
            pageName = pageName.replace('.html', '');

            var pageAsset = await cmsAPI.readAsset({
                type: "page",
                path: parentFolder + "/" + pageName,
                siteName: siteName,                
            });
            if (pageAsset.read_status == "Success") {
                //  #2 then we copy
                console.log("Page read: " + pageAsset.apiReturn.asset.page.path)
                var content = pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes[2];
                var soup = new JSSoup(content.text, false);
                var imgs = soup.findAll('img');
                // console.log(images);
                const isize = imgs.length;
                if (isize > 0) {
                    for (const i of imgs) {
                        console.log(i.attrs.src);
                        const imgSrc = i.attrs.src;
                        const emit = {
                            "image": imgSrc,
                            "id": pageAsset.apiReturn.asset.page.id,
                            "uri": p.URI
                        }
                        images.push(emit);
                    }
                }
            }
        }
    }

    //papa parse output images
    var csv = Papa.unparse(images);
    fs.writeFileSync('csv/images.csv', csv, 'utf8');
}

async function imageUpdateFromRow(rows) {
    //get asset id
    //get new image src
    //get old image src
    //get asset
    //search for <img with old image src
    //update with new image src
    //perform any other <img tag clean up
    //edit asset with new content
    for (const p of rows.data) {
        await sleep(200);

        const assetID = p.id;
        const newImageSrc = p.newurl;
        const oldImageSrc = p.image;
        console.log("looking for: " + oldImageSrc);
        console.log("\t new src: " + newImageSrc);
        if (newImageSrc != undefined) {
            pageAsset = await cmsAPI.readAsset({
                type: "page",
                id: assetID,
                siteName: siteName
            });
            if (pageAsset.read_status == "Success") {
                var content = pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes[2];
                var soup = new JSSoup(content.text, false);
                var imgs = soup.findAll('img');
                const isize = imgs.length;
                if (isize > 0) {
                    for (const i of imgs) {
                        const imgSrc = i.attrs.src;
                        // console.log("\tchecking: " + imgSrc);
                        if (imgSrc == oldImageSrc) {
                            // console.log("FOUND MATCH TO REPLACE");
                            i.attrs.src = newImageSrc;
                            delete i.attrs.sizes;
                            delete i.attrs.srcset;
                            delete i.attrs.loading;
                            delete i.attrs.width;
                            delete i.attrs.height;
                            i.attrs.class = "w-50";
                        }
                    }
                }
                const newContent = soup.prettify(' ', '')
                // console.log(newContent);
                
                pageAsset.apiReturn.asset.page.structuredData.structuredDataNodes[2].structuredDataNodes[2].text = newContent;
                const editResults = await cmsAPI.editAsset({
                    asset: pageAsset.apiReturn,
                });
    
                if (editResults.edit_status == "Success") {
                    console.log("edited asset: " + assetID + "\t" + pageAsset.apiReturn.asset.page.path);
                }
            }
        }
    }
}

async function imageMoveFromRow(rows) {
    var imagesMoved = [];

    for (const p of rows.data) {
        var newImage = {};
        var url = p.image;
        url = url.replace('http://', 'https://');
        const assetId = p.id;
        newImage.image = url;
        newImage.id = p.id;
        newImage.uri = p.uri;


        var newurl = "";

        newImage.newurl = relocate(url, newImage.uri);
        
        if (newurl != "") {
            newImage.newurl = "";
        }
        // console.log("new image:");
        imagesMoved.push(newImage);
    }

    //papa parse output images
    // console.dir(imagesMoved);

    var csvMoved = Papa.unparse(imagesMoved);
    // console.dir(csvMoved);
    fs.writeFileSync('csv/images-moved.csv', csvMoved, 'utf8');
}

function relocate(imageurl, newpath) {
    var newurl = "foo";
    console.log("given url: " + imageurl);
    const iurl = new URL(imageurl);
    const hostname = iurl.hostname;
    console.log("hostname: " + hostname);
    var localpath = iurl.pathname.replace('/wp-content/uploads/', '/');
    const filename = path.basename(localpath);
    var newfilename = filename.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
    const newparentfolder = path.dirname(newpath);
    const newfullpath = "images" + newparentfolder + "/" + newfilename;
    if (hostname == ODL) {
        localpath = "odl" + localpath;
    }
    if (hostname == TLD) {
        localpath = "teaching" + localpath;
    }

    console.log("path: " + localpath);
    console.log("file: " + filename);
    console.log("\tpath: " + newfilename);
    console.log("\tfile: " + newfullpath);

    try {
        fs.copyFileSync(localpath, newfullpath);
    } catch(e) {
        console.log("\t unable to copy file, see error:");
        console.dir(localpath);
        console.dir(newfullpath);
        console.log(e);
      }
    return newfullpath;
}

async function imageAudit() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(CSV_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: imageAuditFromRow
    });
}

async function imageMove() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(IMG_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: imageMoveFromRow
    });
}

async function updateImage() {
    // Note: you'll want to make sure 
    Papa.parse(fs.createReadStream(MOVED_FILE), {
        header: true,
        download: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
            return h.replace(/[\W_]+/g, "").trim();
        },
        complete: imageUpdateFromRow
    });
}

// imageAudit(); 

// imageMove();

updateImage();

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }