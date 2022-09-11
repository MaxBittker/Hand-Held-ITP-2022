const fetch = require("node-fetch");
const fs = require("fs");
const https = require("https");
const AdmZip = require("adm-zip");
const { cookies } = require("./cookie.js");

let zipName = "export.zip";
let pageURL =
  "https://www.notion.so/Hand-Held-Creative-Tools-for-Phones-03187d072d6344eab9a7d065e1f9ae2d"
  
fetch("https://www.notion.so/api/v3/enqueueTask", {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "notion-client-version": "23.9.2.9",
    pragma: "no-cache",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-notion-active-user-header": "d9ea804d-bca9-4be1-904d-0c809b81fb50",
    cookie: cookies
  },
  referrer: pageURL,
  referrerPolicy: "same-origin",
  body: "{\"task\":{\"eventName\":\"exportBlock\",\"request\":{\"blockId\":\"03187d07-2d63-44ea-b9a7-d065e1f9ae2d\",\"recursive\":false,\"exportOptions\":{\"exportType\":\"html\",\"timeZone\":\"America/New_York\",\"locale\":\"en\"}}}}",
  method: "POST",
  mode: "cors"
}).then(response => {
  response.json().then(data => {
    console.log(data);
    let { taskId } = data;
    getTasks(taskId);
  });
});
function getTasks(task_id) {
  fetch("https://www.notion.so/api/v3/getTasks", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "notion-client-version": "23.2.3",
      pragma: "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-notion-active-user-header": "d9ea804d-bca9-4be1-904d-0c809b81fb50",
      cookie: cookies
    },
    referrer: pageURL,
    referrerPolicy: "same-origin",
    body: `{"taskIds":["${task_id}"]}`,
    method: "POST",
    mode: "cors"
  }).then(response => {
    response.json().then(data => {
      let { results } = data;
      console.log(results.length);

      if (results.length == 0) {
        getTasks(task_id);
      } else {
        let { state, status } = results[0];
        console.log(state);
        if (state == "in_progress") {
          getTasks(task_id);
        } else {
          console.log(status.exportURL);
          downloadZip(status.exportURL, zipName);
        }
      }
    });
  });
}

function downloadZip(url, localPath) {
  console.log("downloading zip");
  var file = fs.createWriteStream(localPath);
  var request = https.get(url, function(response) {
    response.pipe(file);
  });
  file.on("finish", () => {
    file.close();
    console.log("unzipping");
    var zip = new AdmZip("./" + zipName);

    zip.getEntries().forEach(function(entry) {
      var entryName = entry.entryName;
      var decompressedData = zip.readFile(entry); // decompressed buffer of the entry
      console.log(entryName);
      if (entryName.endsWith(".html") && entryName != "index.html") {
        let currentHTML = zip.readAsText(entry);
        const charset = `<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>`;
        const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1">`;
        let fontTag = `<link href="//fonts.googleapis.com/css?family=Merriweather&subset=latin" rel="stylesheet" type="text/css">`;

        const style = `
        <style>
        body{
          padding: 1em !important;
        }
        html{
          overflow-x: hidden;
        }
        h1, h2, h3, h4, h5 {
        font-family: 'Merriweather', sans-serif;
        }
        </style>`;
        let payload = charset + viewportMeta + fontTag + style;
        let newHTML = currentHTML.replace(charset, payload);
        // zip.updateFile(entry, newHTML);
        zip.deleteFile(entry);
        zip.addFile("index.html", newHTML);
      }
    });
    zip.extractAllTo("../", /*overwrite*/ true);
  });
}
