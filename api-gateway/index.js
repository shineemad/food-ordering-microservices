// ==========================================================
// API GATEWAY - Port 3000
// Pintu masuk tunggal. Client cukup akses gateway ini,
// lalu request diteruskan (proxy) ke service yang sesuai.
// ==========================================================
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

// Sajikan frontend (folder public) dari gateway
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

const SERVICES = {
  menu: "http://localhost:3001",
  order: "http://localhost:3002",
  payment: "http://localhost:3003",
};

// Fungsi bantu untuk meneruskan request ke service tujuan
async function forward(req, res, targetUrl) {
  try {
    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };
    if (req.method !== "GET") {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    console.log(
      `[API GATEWAY] ${req.method} ${req.originalUrl} -> ${targetUrl} (${response.status})`,
    );
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({
      error: "Service tujuan tidak dapat dihubungi",
      detail: err.message,
    });
  }
}

// Routing gateway
app.use("/api/menus", (req, res) =>
  forward(req, res, `${SERVICES.menu}/menus${req.url === "/" ? "" : req.url}`),
);
app.use("/api/orders", (req, res) =>
  forward(
    req,
    res,
    `${SERVICES.order}/orders${req.url === "/" ? "" : req.url}`,
  ),
);
app.use("/api/payments", (req, res) =>
  forward(
    req,
    res,
    `${SERVICES.payment}/payments${req.url === "/" ? "" : req.url}`,
  ),
);

// Endpoint info gateway
app.get("/api/info", (req, res) => {
  res.json({
    service: "api-gateway",
    keterangan: "Pintu masuk sistem pemesanan makanan terdistribusi",
    routes: ["/api/menus", "/api/orders", "/api/payments"],
  });
});

app.listen(PORT, () => {
  console.log(`[API GATEWAY] berjalan di http://localhost:${PORT}`);
});
