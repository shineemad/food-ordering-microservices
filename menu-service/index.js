// ===============================
// MENU SERVICE - Port 3001
// Mengelola data menu makanan
// ===============================
const express = require("express");
const app = express();
app.use(express.json());

const PORT = 3001;

// Data menu disimpan in-memory (sederhana, tanpa database)
let menus = [
  { id: 1, nama: "Nasi Goreng", harga: 15000, tersedia: true },
  { id: 2, nama: "Mie Ayam", harga: 12000, tersedia: true },
  { id: 3, nama: "Es Teh Manis", harga: 5000, tersedia: true },
  { id: 4, nama: "Ayam Geprek", harga: 18000, tersedia: false },
];

// GET /menus - ambil semua menu
app.get("/menus", (req, res) => {
  res.json({ service: "menu-service", data: menus });
});

// GET /menus/:id - ambil 1 menu berdasarkan id
app.get("/menus/:id", (req, res) => {
  const menu = menus.find((m) => m.id === parseInt(req.params.id));
  if (!menu) {
    return res.status(404).json({ error: "Menu tidak ditemukan" });
  }
  res.json({ service: "menu-service", data: menu });
});

// POST /menus - tambah menu baru
app.post("/menus", (req, res) => {
  const { nama, harga } = req.body;
  if (!nama || !harga) {
    return res.status(400).json({ error: "nama dan harga wajib diisi" });
  }
  const menuBaru = {
    id: menus.length + 1,
    nama,
    harga,
    tersedia: true,
  };
  menus.push(menuBaru);
  res.status(201).json({ service: "menu-service", data: menuBaru });
});

app.listen(PORT, () => {
  console.log(`[MENU SERVICE] berjalan di http://localhost:${PORT}`);
});
