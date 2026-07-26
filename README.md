# Sistem Pemesanan Makanan — Microservices (Sistem Terdistribusi)

Mini project aplikasi sederhana berbasis **arsitektur microservices**. Terdiri dari 4 service independen yang berjalan di port berbeda dan saling berkomunikasi lewat HTTP (REST API).

## Arsitektur

```
Client (Browser / Postman)
        |
        v
API Gateway (:3000)  --> pintu masuk tunggal + menyajikan FRONTEND (folder public/)
        |
        +--> Menu Service    (:3001)  data menu makanan
        +--> Order Service   (:3002)  membuat pesanan
        +--> Payment Service (:3003)  memproses pembayaran

Order Service --> Menu Service    (validasi menu & ambil harga)
Order Service --> Payment Service (proses pembayaran)
```

## Cara Menjalankan

Install dependency di tiap service (sekali saja):

```powershell
cd menu-service; npm install; cd ..
cd order-service; npm install; cd ..
cd payment-service; npm install; cd ..
cd api-gateway; npm install; cd ..
```

Jalankan **4 terminal terpisah** (satu per service):

```powershell
# Terminal 1
cd menu-service; npm start

# Terminal 2
cd payment-service; npm start

# Terminal 3
cd order-service; npm start

# Terminal 4
cd api-gateway; npm start
```

> **[SCREENSHOT 1]** Ambil screenshot 4 terminal yang menampilkan tiap service berjalan di port masing-masing (3000–3003). Ini bukti sistemnya terdistribusi.

## Frontend (Web UI)

Buka browser ke **http://localhost:3000** — frontend "Warung Mamang Golek" disajikan oleh API Gateway ([api-gateway/public](api-gateway/public)).

Fitur:

- Indikator status keempat service (hijau = hidup, merah = mati) — dicek berkala tiap 10 detik.
- Daftar menu (diambil dari menu-service lewat gateway).
- Keranjang + form nama pelanggan → tombol **Pesan & Bayar** memicu alur antar service (order → menu → payment) dan menampilkan struk `LUNAS • SELESAI`.
- Riwayat pesanan (order-service) dan riwayat pembayaran (payment-service), masing-masing menampilkan label service sumbernya.

> **[SCREENSHOT UI-1]** Halaman utama dengan 4 indikator service hijau dan daftar menu.
>
> **[SCREENSHOT UI-2]** Struk pesanan `LUNAS • SELESAI` setelah klik Pesan & Bayar + riwayat terisi.
>
> **[SCREENSHOT UI-3]** (Nilai plus) Matikan salah satu service → indikator chip berubah merah.

## Cara Uji (lewat API Gateway)

### 1. Lihat semua menu

```powershell
curl http://localhost:3000/api/menus
```

> **[SCREENSHOT 2]** Respons daftar menu dari `menu-service` (perhatikan field `"service": "menu-service"`).

### 2. Buat pesanan (komunikasi antar service)

```powershell
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d "{\"pelanggan\":\"Budi\",\"items\":[{\"menuId\":1,\"jumlah\":2},{\"menuId\":3,\"jumlah\":1}]}"
```

Alur yang terjadi: Gateway → Order Service → Menu Service (validasi) → Payment Service (bayar).

> **[SCREENSHOT 3]** Respons pesanan berstatus `SELESAI` beserta detail pembayaran, dan log yang muncul di ke-4 terminal (menunjukkan request mengalir antar service).

### 3. Lihat riwayat pesanan & pembayaran

```powershell
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/payments
```

> **[SCREENSHOT 4]** Respons riwayat pesanan dan pembayaran.

### 4. (Opsional, nilai plus) Uji toleransi kegagalan

Matikan `payment-service` (Ctrl+C di terminalnya), lalu coba buat pesanan lagi — Order Service akan merespons error `503` bahwa service lain tidak dapat dihubungi.

> **[SCREENSHOT 5]** Respons error 503 saat salah satu service mati — bukti antar service independen.

## Ringkasan Endpoint

| Method | Endpoint (via Gateway) | Keterangan         |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/menus`           | Semua menu         |
| GET    | `/api/menus/:id`       | Detail menu        |
| POST   | `/api/menus`           | Tambah menu        |
| POST   | `/api/orders`          | Buat pesanan       |
| GET    | `/api/orders`          | Semua pesanan      |
| GET    | `/api/payments`        | Riwayat pembayaran |
# food-ordering-microservices
