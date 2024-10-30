let process = require("node:process");
let http = require("http");
let fs = require("fs");
let path = require("path");
let WebSocket = require("ws");

// Support CTRL+C for terminating HTTP server.
process.on("SIGINT", () => {
  console.info("Interrupted");
  process.exit(0);
});

// CMD arguments.
const portIndex = process.argv.indexOf("--port");
const srcDirIndex = process.argv.indexOf("--src");

// Default values for CMD arguments.
let port = 8080;
let srcDir = "./src";

// Check CMD arguments.
if (portIndex !== -1 && process.argv.length > portIndex + 1) {
  port = parseInt(process.argv[portIndex + 1]);
}

// Check CMD arguments.
if (srcDirIndex !== -1 && process.argv.length > srcDirIndex + 1) {
  srcDir = process.argv[srcDirIndex + 1];
}

// Create HTTP server.
const server = http
  .createServer(function (request, response) {
    let url = decodeURI(request.url);

    // Requests are made relatively to source directory.
    let filePath = srcDir + url;

    // If requests is made to root, forward to index.html.
    if (filePath === srcDir + "/") {
      filePath += "index.html";
    }

    // Check extension of requested resource.
    let extension = path.extname(filePath);

    // Get accept header from the request.
    let accept = request.headers.accept;

    let contentType;

    // Assign response content type based on requested resource extension.
    switch (extension) {
      case ".js":
        contentType = "text/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
      case ".jpg":
        contentType = "image/jpg";
        break;
      case ".md":
        contentType = "text/markdown; charset=utf-8";
        break;
      default:
        contentType = "text/html";
    }

    // If markdown resource was requested but accept was not set to text/markdown, forward to index.html where requested
    // markdown resource will be rendered as slides.
    if (extension === ".md" && !accept.includes("text/markdown")) {
      filePath = srcDir + "/index.html";
      contentType = "text/html";
    }

    // Read requested resource and write it to HTTP response.
    fs.readFile(filePath, function (error, content) {
      if (error) {
        console.log(error);
        if (error.code === "ENOENT") {
          response.writeHead(404);
          response.end();
        } else {
          response.writeHead(500);
          response.end();
        }
      } else {
        response.writeHead(200, { "Content-Type": contentType });
        response.end(content, "utf-8");
      }
    });
  })
  .listen(port, "0.0.0.0");

console.log(`Server running at http://127.0.0.1:${port}/`);
console.log("To stop use: CTRL+C");

import("open")
  .then((open) => open.default(`http://127.0.0.1:${port}/`))
  .catch(console.error);

const wss = new WebSocket.Server({ server });

function broadcastReload() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("reload");
    }
  });
}

let reloadTimeout;
const DEBOUNCE_DELAY = 100;

fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
  if (filename) {
    clearTimeout(reloadTimeout);

    reloadTimeout = setTimeout(() => {
      console.log(`File changed: ${filename}`);
      broadcastReload();
    }, DEBOUNCE_DELAY);
  }
});
