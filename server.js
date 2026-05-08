const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const COURIER_BASE = process.env.COURIER_BASE_URL || "https://yaadpost.com/rpc";

app.use(cors());
app.use(express.json());

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
