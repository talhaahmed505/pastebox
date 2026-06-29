const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = 2002;
let currentText = "";
let cliEnabled = false;

const httpServer = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("index.html not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });

  } else if (req.url === "/cli" && req.method === "GET") {
    if (!cliEnabled) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(currentText);

  } else if (req.url === "/cli" && req.method === "POST") {
    if (!cliEnabled) { res.writeHead(404); res.end("Not found"); return; }
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      currentText = body;
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "update", text: currentText }));
        }
      });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok\n");
    });

  } else if (req.url === "/docker.sh") {
    if (!cliEnabled) { res.writeHead(404); res.end("Not found"); return; }
    const filePath = path.join(__dirname, "docker.sh");
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("docker.sh not found"); return; }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(data);
    });

  } else if (req.url === "/admin/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ cliEnabled }));

  } else if (req.url === "/admin/toggle" && req.method === "POST") {
    cliEnabled = !cliEnabled;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ cliEnabled }));

  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "init", text: currentText }));

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "update") {
        currentText = msg.text;
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: "update", text: currentText }));
          }
        });
      }
    } catch {}
  });

  ws.on("close", () => {
    if (wss.clients.size === 0) {
      currentText = "";
      cliEnabled = false;
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
