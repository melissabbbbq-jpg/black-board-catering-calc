const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {
  calculateQuote,
  getCurrentConfig,
  resetCalculatorConfig,
  saveCalculatorConfig
} = require("./calculator");
const { sendQuoteRequest } = require("./quote-mailer");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const publicDir = path.resolve(__dirname, "..", "public");

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
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      resolve(body);
    });

    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "bbq-catering-calculator"
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/config") {
    sendJson(response, 200, getCurrentConfig());
    return true;
  }

  if (request.method === "PUT" && pathname === "/api/config") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      sendJson(response, 200, saveCalculatorConfig(payload));
    } catch (error) {
      sendJson(response, 400, {
        error: error.message || "Unable to save config."
      });
    }

    return true;
  }

  if (request.method === "POST" && pathname === "/api/config/reset") {
    try {
      sendJson(response, 200, resetCalculatorConfig());
    } catch (error) {
      sendJson(response, 400, {
        error: error.message || "Unable to reset config."
      });
    }

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

  if (request.method === "POST" && pathname === "/api/quote-request") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const quoteData = calculateQuote(payload.quotePayload || {});
      const result = await sendQuoteRequest({
        config: getCurrentConfig(),
        quoteData,
        contact: payload.contact || {},
        notes: String(payload.notes || "").trim()
      });

      sendJson(response, 200, {
        message: "Your quote has been submitted. We will be in touch soon!",
        delivery: result.mode
      });
    } catch (error) {
      sendJson(response, 400, {
        error: error.message || "Unable to submit quote request."
      });
    }

    return true;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(response, 404, {
      error: "API route not found."
    });
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

  try {
    const handled = await handleApi(request, response, url.pathname);
    if (!handled) {
      serveStatic(response, url.pathname);
    }
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || "Server error."
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BBQ catering calculator is running at http://${HOST}:${PORT}`);
});
