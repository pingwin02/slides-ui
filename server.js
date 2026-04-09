const process = require("node:process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { exec } = require("child_process");

process.on("SIGINT", () => {
  console.warn("Interrupted");
  process.exit(0);
});

const port = parseInt(process.argv[2]) || 3000;
const srcDir = "./src";

const server = http
  .createServer(function (request, response) {
    const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);
    const url = decodeURI(requestUrl.pathname);
    let filePath = srcDir + url;

    if (filePath === srcDir + "/slides" || filePath === srcDir + "/slides/") {
      response.writeHead(301, { Location: "/" });
      response.end();
      return;
    }

    try {
      if (fs.statSync(filePath).isDirectory()) {
        const directoryName = path.basename(path.resolve(filePath));
        const defaultMarkdown = path.join(filePath, `${directoryName}.md`);

        if (fs.existsSync(defaultMarkdown)) {
          response.writeHead(302, {
            Location: `${url.replace(/\/?$/, "/")}${directoryName}.md#1`
          });
          response.end();
          return;
        }
      }
    } catch {
      // Fall through to normal file handling.
    }

    if (filePath === srcDir + "/") {
      filePath += "index.html";
    }

    const extension = path.extname(filePath);
    const accept = request.headers.accept || "";
    let contentType;

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

    if (extension === ".md" && !accept.includes("text/markdown")) {
      filePath = srcDir + "/index.html";
      contentType = "text/html";
    }

    fs.readFile(filePath, function (error, content) {
      if (error) {
        console.error(error);
        if (error.code === "ENOENT") {
          response.writeHead(404);
          response.end();
        } else {
          response.writeHead(500);
          response.end();
        }
      } else {
        const headers = { "Content-Type": contentType };
        if (extension === ".md") {
          headers["Vary"] = "Accept";
          headers["Cache-Control"] = "no-store";
        }
        response.writeHead(200, headers);
        response.end(content, "utf-8");
      }
    });
  })
  .listen(port, "0.0.0.0");

console.warn(`Server running at http://127.0.0.1:${port}/`);
console.warn("To stop use: CTRL+C");

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
      console.warn(`File changed: ${filename}`);

      if (filename.includes("slides") && !filename.includes("Materials.md")) {
        exec("bash utils/scan.sh", (error) => {
          if (error) {
            console.error(`Error running scan.sh: ${error}`);
          }
          broadcastReload();
        });
      } else {
        broadcastReload();
      }
    }, DEBOUNCE_DELAY);
  }
});
