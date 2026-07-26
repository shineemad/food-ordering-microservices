// ===============================
// PAYMENT SERVICE - Port 3003
// Memproses pembayaran pesanan
// ===============================
const express = require("express");
const app = express();
app.use(express.json());

const PORT = 3003;

// Riwayat pembayaran in-memory
let payments = [];

// POST /pay - proses pembayaran
app.post("/pay", (req, res) => {
  const { orderId, total } = req.body;
  if (!orderId || !total) {
    return res.status(400).json({ error: "orderId dan total wajib diisi" });
  }

  const pembayaran = {
    id: payments.length + 1,
    orderId,
    total,
    status: "LUNAS",
    waktu: new Date().toISOString(),
  };
  payments.push(pembayaran);

  console.log(
    `[PAYMENT SERVICE] Pembayaran order #${orderId} sebesar Rp${total} berhasil`,
  );
  res.status(201).json({ service: "payment-service", data: pembayaran });
});

// GET /payments - lihat semua riwayat pembayaran
app.get("/payments", (req, res) => {
  res.json({ service: "payment-service", data: payments });
});

app.listen(PORT, () => {
  console.log(`[PAYMENT SERVICE] berjalan di http://localhost:${PORT}`);
});
