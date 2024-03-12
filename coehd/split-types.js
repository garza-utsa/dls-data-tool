/** 
Objective: 
- for each article, read asset
- determine if we have a utsa today article or a homegrown COEHD article
- spit out two seperate lists accordingly: articles-today.csv articles-coehd.csv
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
var todayArticles = [];
var articles = [];

var papaConfig = {
    header: true,
    download: false,
    skipEmptyLines: true,
    transformHeader: function(h) {
        return h.replace(/[\W_]+/g, "").trim();
    }
};

async function readCSV() {
    const readFile = await Papa.parse(fs.createReadStream("./csv/articles.csv"), {
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
            const id = p.id;
            const path = p.path;
            const type = p.type;
            console.log("processing page: " + path);
            if (type == "page") {
                const req = await cmsAPI.readAsset({
                    id: id,
                    type: type,
                    siteName: oldSiteName
                }).then(function(result){
                    if (result.read_status == "Success") {
                        var data = [];
                        data = result.apiReturn.asset.page.structuredData.structuredDataNodes;
                        const currentPage = result.apiReturn.asset.page.path;
                        const currentPageID = result.apiReturn.asset.page.id;
                        var todayLink = undefined;
                        data.forEach(function(d) {
                            if (d.identifier == "ROW") {
                                // console.log("group: " + d.identifier);
                                // console.dir(d);
                                const rowData = d.structuredDataNodes;
                                rowData.forEach(function(rd){
                                    if (rd.identifier == "BUTTON") {
                                        try {
                                            todayLink = rd.structuredDataNodes[3].text;
                                            // console.dir(rd);
                                            console.log("\t today link:  " + todayLink);
                                            if (!todayLink.includes("today")) {
                                                todayLink = undefined;
                                            }
                                        } catch (e) {
                                            todayLink = undefined;
                                        }
                                    }
                                });
                            }
                        });
                        var pcopy = p;

                        if (todayLink != undefined) {
                            console.log(currentPage + " is a UTSA Today article");
                            // console.log("\t today link:  " + todayLink);
                            pcopy["today"] = todayLink;
                            todayArticles.push(pcopy);
                        } else {
                            console.log(currentPage + " is NOT a UTSA Today article");
                            articles.push(pcopy);
                        }
                        // console.dir(JSON.stringify(imageData));
                    }
                });
            }           
        }
                
        console.log("todayArticles: " + todayArticles.length)
        console.log("articles: " + articles.length);

        console.dir(todayArticles);
        var csv = Papa.unparse(articles);
        fs.writeFileSync('csv/articles-coehd.csv', csv, 'utf8');

        csv = Papa.unparse(todayArticles);
        fs.writeFileSync('csv/articles-today.csv', csv, 'utf8');

    }
}

readCSV();

