/** 
Objective: 
- read yearly news folders
- find children news article pages
- output csv with asset id to use as article (articles.csv)
- output csv with asset ids to be moved (images.csv)
**/
const fs = require('fs')
var cmsAPI = require('../lib/cascade-restapi.js');
cmsAPI.init();
var Papa = require('papaparse');
const siteName = "COEHD-VPAA-OLD"; // fill in
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

async function readYears() {
    var currentYear = START_YEAR;
    var pages = [];

    while (currentYear <= END_YEAR) {
        const folderPath = "news/" + currentYear.toString();
        const request = await cmsAPI.readAsset({
            type: "folder",
            path: folderPath,
            siteName: siteName,
            debug: true
        }).then(function(result){
            var pagesInYear = [];
            pagesInYear = result.apiReturn.asset.folder.children;
            console.dir(pagesInYear);
            pagesInYear.forEach(function(p){
                console.dir(p);
                p.path = p.path.path;
                delete p.recycled;
                // console.dir(p);
                if (!p.path.includes("index")) {
                    pages.push(p);
                }
            })
            // console.dir(result.apiReturn.asset.folder.children);
        }).catch(function(error){
            console.log(error);
        })
        currentYear = currentYear + 1;
    }
    console.dir(pages.length);
    var csv = Papa.unparse(pages);
    fs.writeFileSync('csv/articles.csv', csv, 'utf8');
}

readYears();

