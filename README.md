# Kalkulator

Kalkulator web di [calc.syahrul.web.id](https://calc.syahrul.web.id).

Static HTML/CSS/JS. Nginx serve dari `public/`.

## Fitur

- Operasi dasar: tambah, kurang, kali, bagi, persen
- Mode ilmiah: x², akar, 1/x, xʸ, sin/cos/tan, ln, log, π, e, n!
- **PPh 21** (Pasal 17 + PTKP), **PPh 23** (potong / gross-up), **PPh Final 4(2)**
- **Diskon** berlapis + cari persen dari dua harga
- **Konversi satuan**: panjang, berat, volume, luas, data, suhu
- Deg / Rad, riwayat, format angka Indonesia

## Deploy

**Live (native Traefik):** `docker compose` di folder ini → container `calc-site` di network `coolify`, domain `calc.syahrul.web.id` (VPN-only via middleware `vpn-only@file`).

```bash
cd /home/calc-site && docker compose up -d --build
```

Update konten: edit `public/`, lalu `docker compose up -d --build`.
