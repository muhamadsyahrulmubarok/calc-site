# Kalkulator

Kalkulator web di [calc.syahrul.web.id](https://calc.syahrul.web.id).

Static HTML/CSS/JS. Nginx serve dari `public/`.

## Fitur

- Operasi dasar: tambah, kurang, kali, bagi, persen
- Mode ilmiah: x², akar, 1/x, xʸ, sin/cos/tan, ln, log, π, e, n!
- Deg / Rad
- Riwayat di browser (localStorage)
- Keyboard: angka, `+ - * /`, Enter, Backspace, Esc
- Format angka Indonesia (`1.234,56`)

## Deploy

File live ada di `/home/calc-site/public` di VPS. Nginx: `deploy/nginx.conf` → `calc.syahrul.web.id`.
