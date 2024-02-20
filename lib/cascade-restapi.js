const dotenv = require('dotenv')

var config = {}
var headers = {}
var cmsUrl = ""

module.exports = {
    init: function(params) {
        // Set module configurations
        config = params || process.env;
        console.log("Initialized with configuration:");
        console.log(config.cmsUrl);
        headers = { "Authorization": "Bearer " + config.cmsAPI };
        cmsUrl = config.cmsUrl;
        // console.dir(headers);
    },

    readAsset: function(a) {
        if (a.type == "user") {
            var url = cmsUrl + "api/v1/read/" + a.type + "/" + a.path;
        } else if (a.path) {
            var url = cmsUrl + "api/v1/read/" + a.type + "/" + a.siteName + "/" + a.path;
        } else if (a.id) {
            var url = cmsUrl + "api/v1/read/" + a.type + "/" + a.id;
        }
        url = url.replace(/\\\\/g, "\\");
        if (a.debug) {
            console.log("Fetch URL " + url);
        }
        return new Promise(function(resolve, reject) {
            fetch(url, { headers: headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ read_status: "Success", sent: a, apiReturn: data, url: url });
                    } else {
                        reject({ read_status: "Error", error: data.message, sent: a, apiReturn: data, url: url });
                    }
                });
        });
    },
    
    editAsset: function(a) {
        return new Promise(function(resolve, reject) {
            fetch(cmsUrl + "api/v1/edit", { method: "POST", headers: headers, body: JSON.stringify({ asset: a.asset.asset }), })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ edit_status: "Success", sent: a, apiReturn: data });
                    } else {
                        reject({ edit_status: "Error", error: data.message, sent: a, apiReturn: data });
                    }
                });
        });
    },
    
    copyAsset: function(a) {
        if (a.path) {
            var url = cmsUrl + "api/v1/copy/" + a.type + "/" + a.siteName + "/" + a.path;
        } else if (a.id) {
            var url = cmsUrl + "api/v1/copy/" + a.type + "/" + a.id;
        }
        url = url.replace(/\\\\/g, "\\");
        return new Promise(function(resolve, reject) {
            fetch(url, { method: "POST", headers: headers, body: JSON.stringify({ copyParameters: a.copyParameters }), })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ copy_status: "Success", sent: a, apiReturn: data, url: url });
                    } else {
                        reject({ copy_status: "Error", error: data.message, sent: a, apiReturn: data, url: url });
                    }
                });
        });
    },
    
    moveAsset: function(a) {
        if (a.path) {
            var url = cmsUrl + "api/v1/move/" + a.type + "/" + a.siteName + "/" + a.path;
        } else if (a.id) {
            var url = cmsUrl + "api/v1/move/" + a.type + "/" + a.id;
        }
        url = url.replace(/\\\\/g, "\\");
        return new Promise(function(resolve, reject) {
            fetch(url, { method: "POST", headers: headers, body: JSON.stringify({ moveParameters: a.moveParameters }), })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ move_status: "Success", sent: a, apiReturn: data, url: url });
                    } else {
                        reject({ move_status: "Error", error: data.message, sent: a, apiReturn: data, url: url });
                    }
                });
        });
    },

    deleteAsset: function(a) {
        if (a.path) {
            var url = cmsUrl + "api/v1/delete/" + a.type + "/" + a.siteName + "/" + a.path;
        } else if (a.id) {
            var url = cmsUrl + "api/v1/delete/" + a.type + "/" + a.id;
        }
        url = url.replace(/\\\\/g, "\\");
        return new Promise(function(resolve, reject) {
            fetch(url, { method: "POST", headers: headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ delete_status: "Success", sent: a, apiReturn: data, url: url });
                    } else {
                        reject({ delete_status: "Error", error: data.message, sent: a, apiReturn: data, url: url });
                    }
                });
        });
    },

    createAsset: function(a) {
        return new Promise(function(resolve, reject) {
            fetch(cmsUrl + "api/v1/create", { method: "POST", headers: headers, body: JSON.stringify({ asset: a.asset }), })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ create_status: "Success", sent: a, apiReturn: data });
                    } else {
                        reject({ create_status: "Error", error: data.message, sent: a, apiReturn: data });
                    }
                });
        });
    },

    listSubscribers: function(a) {
        if (a.path) {
            var url = cmsUrl + "api/v1/listSubscribers/" + a.type + "/" + a.siteName + "/" + a.path;
        } else if (a.id) {
            var url = cmsUrl + "api/v1/listSubscribers/" + a.type + "/" + a.id;
        }
        url = url.replace(/\\\\/g, "\\");
        if (a.debug) {
            console.log("Fetch URL " + url);
        }
        return new Promise(function(resolve, reject) {
            fetch(url, { headers: headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ listSubscribers_status: "Success", sent: a, apiReturn: data, url: url });
                    } else {
                        reject({ listSubscribers_status: "Error", error: data.message, sent: a, apiReturn: data, url: url });
                    }
                });
        });
    },
    listSites: function(a) {
        return new Promise(function(resolve, reject) {
            fetch(cmsUrl + "api/v1/listSites", { headers: headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ listSites_status: "Success", sent: a, apiReturn: data });
                    } else {
                        reject({ listSites_status: "Error", error: data.message, sent: a, apiReturn: data });
                    }
                });
        });
    },
    copySite: function(a) {
        return new Promise(function(resolve, reject) {
            fetch(cmsUrl + "api/v1/siteCopy", { method: "POST", headers: headers, body: JSON.stringify(a), })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) {
                        resolve({ edit_status: "Success", sent: a, apiReturn: data });
                    } else {
                        reject({ edit_status: "Error", error: data.message, sent: a, apiReturn: data });
                    }
                });
        });
    }
};

// Load configurations from .env file
dotenv.config();