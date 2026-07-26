// ==========================================================
// ORDER SERVICE - Port 3002
// Membuat pesanan. Berkomunikasi antar-service:
//   1. Memanggil MENU SERVICE untuk validasi menu & ambil harga
//   2. Memanggil PAYMENT SERVICE untuk memproses pembayaran
// ==========================================================
const express = require("express");
const app = express();
app.use(express.json());

const PORT = 3002;
const MENU_SERVICE_URL = "http://localhost:3001";
const PAYMENT_SERVICE_URL = "http://localhost:3003";

// Data pesanan in-memory
let orders = [];

// POST /orders - buat pesanan baru
// Body: { "pelanggan": "Budi", "items": [ { "menuId": 1, "jumlah": 2 } ] }
app.post("/orders", async (req, res) => {
  const { pelanggan, items } = req.body;
  if (!pelanggan || !items || items.length === 0) {
    return res.status(400).json({ error: "pelanggan dan items wajib diisi" });
  }

  try {
    // 1. Validasi setiap menu ke MENU SERVICE (komunikasi antar service)
    let total = 0;
    const detailItems = [];
    for (const item of items) {
      const response = await fetch(`${MENU_SERVICE_URL}/menus/${item.menuId}`);
      if (!response.ok) {
        return res
          .status(404)
          .json({ error: `Menu id ${item.menuId} tidak ditemukan` });
      }
      const hasil = await response.json();
      const menu = hasil.data;

      if (!menu.tersedia) {
        return res
          .status(400)
          .json({ error: `Menu '${menu.nama}' sedang tidak tersedia` });
      }

      const subtotal = menu.harga * item.jumlah;
      total += subtotal;
      detailItems.push({
        nama: menu.nama,
        harga: menu.harga,
        jumlah: item.jumlah,
        subtotal,
      });
    }

    // 2. Buat pesanan
    const order = {
      id: orders.length + 1,
      pelanggan,
      items: detailItems,
      total,
      status: "MENUNGGU_PEMBAYARAN",
    };

    // 3. Proses pembayaran ke PAYMENT SERVICE (komunikasi antar service)
    const bayar = await fetch(`${PAYMENT_SERVICE_URL}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, total: order.total }),
    });
    const hasilBayar = await bayar.json();
    order.status = "SELESAI";
    order.pembayaran = hasilBayar.data;

    orders.push(order);
    console.log(
      `[ORDER SERVICE] Pesanan #${order.id} dari ${pelanggan} berhasil dibuat`,
    );
    res.status(201).json({ service: "order-service", data: order });
  } catch (err) {
    // Terjadi jika service lain mati -> menunjukkan sifat sistem terdistribusi
    res.status(503).json({
      error:
        "Gagal menghubungi service lain. Pastikan menu-service & payment-service berjalan.",
      detail: err.message,
    });
  }
});

// GET /orders - lihat semua pesanan
app.get("/orders", (req, res) => {
  res.json({ service: "order-service", data: orders });
});

app.listen(PORT, () => {
  console.log(`[ORDER SERVICE] berjalan di http://localhost:${PORT}`);
});
