// =====================================================
// Frontend Warung Mamang Golek
// Semua request menuju API Gateway (origin yang sama),
// lalu gateway meneruskan ke microservice terkait.
// =====================================================
const API = "/api";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

let menus = [];
let cart = {}; // { menuId: jumlah }

// ---------- Toast ----------
let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast" + (isError ? " err" : "");
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

// ---------- Status service ----------
async function checkServices() {
  const set = (name, up) => {
    const chip = document.querySelector(`.chip[data-name="${name}"]`);
    if (chip) chip.className = "chip " + (up ? "up" : "down");
  };
  try {
    await fetch("/api/info");
    set("gateway", true);
  } catch {
    ["gateway", "menu", "order", "payment"].forEach((n) => set(n, false));
    return;
  }
  const cek = [
    ["menu", `${API}/menus`],
    ["order", `${API}/orders`],
    ["payment", `${API}/payments`],
  ];
  for (const [name, url] of cek) {
    try {
      const r = await fetch(url);
      set(name, r.ok);
    } catch {
      set(name, false);
    }
  }
}

// ---------- Menu ----------
async function loadMenus() {
  const grid = document.getElementById("menuGrid");
  try {
    const res = await fetch(`${API}/menus`);
    const json = await res.json();
    menus = json.data;
    document.getElementById("menuSource").textContent =
      `sumber: ${json.service}`;
    grid.innerHTML = menus
      .map(
        (m) => `
      <article class="card">
        <span class="badge ${m.tersedia ? "ok" : "off"}">
          ${m.tersedia ? "Tersedia" : "Habis"}
        </span>
        <h3>${m.nama}</h3>
        <span class="price">${rupiah(m.harga)}</span>
        <button class="btn-add" data-id="${m.id}" ${m.tersedia ? "" : "disabled"}>
          ${m.tersedia ? "+ Tambah" : "Tidak tersedia"}
        </button>
      </article>`,
      )
      .join("");
    grid
      .querySelectorAll(".btn-add")
      .forEach((b) =>
        b.addEventListener("click", () => addToCart(parseInt(b.dataset.id))),
      );
  } catch {
    grid.innerHTML = `<p class="empty">Gagal memuat menu — pastikan menu-service berjalan.</p>`;
  }
}

// ---------- Keranjang ----------
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
}
function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}
function renderCart() {
  const list = document.getElementById("cartList");
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    list.innerHTML = `<p class="empty">Keranjang kosong.<br/>Pilih menu di sebelah kiri.</p>`;
    document.getElementById("cartTotal").textContent = rupiah(0);
    return;
  }
  let total = 0;
  list.innerHTML = ids
    .map((id) => {
      const m = menus.find((x) => x.id === parseInt(id));
      const sub = m.harga * cart[id];
      total += sub;
      return `
      <div class="cart-item">
        <span class="nm">${m.nama}</span>
        <button class="qty-btn" data-id="${id}" data-d="-1">−</button>
        <span>${cart[id]}</span>
        <button class="qty-btn" data-id="${id}" data-d="1">+</button>
        <span>${rupiah(sub)}</span>
      </div>`;
    })
    .join("");
  document.getElementById("cartTotal").textContent = rupiah(total);
  list
    .querySelectorAll(".qty-btn")
    .forEach((b) =>
      b.addEventListener("click", () =>
        changeQty(parseInt(b.dataset.id), parseInt(b.dataset.d)),
      ),
    );
}

// ---------- Pesan & bayar ----------
async function submitOrder() {
  const nama = document.getElementById("customerName").value.trim();
  const ids = Object.keys(cart);
  if (!nama) return toast("Isi nama pelanggan dulu.", true);
  if (ids.length === 0) return toast("Keranjang masih kosong.", true);

  const body = {
    pelanggan: nama,
    items: ids.map((id) => ({ menuId: parseInt(id), jumlah: cart[id] })),
  };

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return toast(json.error || "Pesanan gagal.", true);

    const o = json.data;
    const box = document.getElementById("receipt");
    box.hidden = false;
    box.innerHTML = `
      <h4>Struk Pesanan #${o.id} — ${o.pelanggan}</h4>
      <table>
        ${o.items
          .map(
            (i) =>
              `<tr><td>${i.nama} × ${i.jumlah}</td><td>${rupiah(i.subtotal)}</td></tr>`,
          )
          .join("")}
        <tr class="grand"><td>Total</td><td>${rupiah(o.total)}</td></tr>
      </table>
      <span class="paid">${o.pembayaran.status} • ${o.status}</span>`;

    cart = {};
    renderCart();
    toast(`Pesanan #${o.id} berhasil — pembayaran ${o.pembayaran.status}.`);
    loadHistory();
  } catch {
    toast("Gagal menghubungi gateway/order-service.", true);
  }
}

// ---------- Riwayat ----------
async function loadHistory() {
  try {
    const [oRes, pRes] = await Promise.all([
      fetch(`${API}/orders`),
      fetch(`${API}/payments`),
    ]);
    const oJson = await oRes.json();
    const pJson = await pRes.json();

    document.getElementById("orderSource").textContent =
      `sumber: ${oJson.service}`;
    document.getElementById("paymentSource").textContent =
      `sumber: ${pJson.service}`;

    const oBox = document.getElementById("orderHistory");
    oBox.innerHTML =
      oJson.data.length === 0
        ? `<p class="empty">Belum ada pesanan.</p>`
        : oJson.data
            .map(
              (o) => `
        <div class="row">
          <span class="id">#${o.id}</span>
          <span>${o.pelanggan}</span>
          <span>${o.items.map((i) => `${i.nama}×${i.jumlah}`).join(", ")}</span>
          <span class="tag">${o.status}</span>
          <span class="money">${rupiah(o.total)}</span>
        </div>`,
            )
            .join("");

    const pBox = document.getElementById("paymentHistory");
    pBox.innerHTML =
      pJson.data.length === 0
        ? `<p class="empty">Belum ada pembayaran.</p>`
        : pJson.data
            .map(
              (p) => `
        <div class="row">
          <span class="id">#${p.id}</span>
          <span>Order #${p.orderId}</span>
          <span>${new Date(p.waktu).toLocaleString("id-ID")}</span>
          <span class="tag">${p.status}</span>
          <span class="money">${rupiah(p.total)}</span>
        </div>`,
            )
            .join("");
  } catch {
    /* dibiarkan; chip status sudah menunjukkan service mati */
  }
}

// ---------- Init ----------
document.getElementById("btnOrder").addEventListener("click", submitOrder);
checkServices();
loadMenus();
loadHistory();
setInterval(checkServices, 10000);
