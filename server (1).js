const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const COURIER_BASE = process.env.COURIER_BASE_URL || "https://yaadpost.com/rpc";

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Logis-Auth, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "YaadPost proxy running", courier: COURIER_BASE });
});

// Proxy all POST requests to the Sethwan Logis API
app.post("/rpc/:service/:method", async (req, res) => {
  const { service, method } = req.params;
  const apiKey = req.headers["x-logis-auth"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing X-Logis-Auth header" });
  }

  const targetUrl = `${COURIER_BASE}/${service}/${method}`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Logis-Auth": apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Proxy error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Forwarding requests to: ${COURIER_BASE}`);
});
