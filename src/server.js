const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { CONFIG, calculateQuote } = require("../calculator");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const publicDir = path.resolve(__dirname, "..");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/config") {
    sendJson(response, 200, CONFIG);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/calculate") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      sendJson(response, 200, calculateQuote(payload));
    } catch (error) {
      sendJson(response, 400, {
        error: error.message || "Unable to calculate quote."
      });
    }

    return true;
  }

  return false;
}

function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" || pathname === "/admin" ? "/index.html" : pathname;
  const filePath = path.resolve(publicDir, `.${requestedPath}`);

  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(file);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  const handled = await handleApi(request, response, url.pathname);
  if (!handled) {
    serveStatic(response, url.pathname);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BBQ catering calculator is running on ${HOST}:${PORT}`);
});
