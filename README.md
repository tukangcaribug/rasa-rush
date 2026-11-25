# RASA RUSH — Game Memasak

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/tukangcaribug/rasa-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/tukangcaribug/rasa-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Game memasak top-down 2D yang dibuat untuk bounty **best-cooking-game-20261125-0137** di make.fun.
Kamu koki di dapur paling sibuk di kota: ambil bahan di pantry, potong di talenen, masak di
kompor, rakit hidangan di meja, sajikan lewat jendela saji — sebelum pelanggan kabur dan
sebelum masakan gosong. Satu shift 3 menit, 3 bintang, combo menaikkan tip.

## Run it

```sh
node serve.ts            # lalu buka http://localhost:8080
```

---
## Cara main

- **WASD / Panah** — gerakkan koki. **Klik mouse** — jalan ke titik itu.
- **E / Spasi** — ambil / taruh / interaksi di stasiun terdekat.
- **P** — jeda. **M** — bisu. **R** — mulai ulang shift.

Alur: Pantry → Talenen (potong) / Kompor (masak, awas gosong!) → Meja Rakit →
ambil Piring → ambil hidangan jadi → Jendela Saji. Bahan yang salah atau gosong bisa
dibuang di Tempat Sampah.

## Resep

| Hidangan | Bahan |
| --- | --- |
| Nasi Goreng Kilat | nasi matang + telur matang + cabai potong |
| Mie Ayam Rasa | mie matang + ayam matang + sayur potong |
| Sate Bakar | ayam matang + tusuk + sambal |
| Gado-Gado Ceria | sayur potong + telur matang + kacang matang |
| Es Teh Melati | teh panas + es |

Pesanan datang makin cepat sepanjang shift. Sajikan tepat waktu untuk koin + tip;
terlambat atau salah sajian membuat bintang hilang.

## Menjalankan

```sh
node serve.ts            # lalu buka http://localhost:8080
```

`?seed=N` memakai RNG deterministik; `?shot=start|play|end` menggambar satu scene
statis (dipakai untuk screenshot). Semua art digambar lewat canvas dan semua suara
adalah synth WebAudio — tanpa aset eksternal, tanpa network request.

## Menyerahkan (build dossier)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Struktur

- `game/index.html` — canvas + garis status
- `game/src/config.js` — konstanta, stasiun, bahan, resep, tuning
- `game/src/random.js` — RNG deterministik (mulberry32)
- `game/src/audio.js` — SFX + musik synth WebAudio
- `game/src/world.js` — state dan rules permainan
- `game/src/input.js` — keyboard + mouse
- `game/src/render.js` — gambar dapur, koki, makanan, HUD, layar
- `game/src/shots.js` — scene `?shot=`, autopilot yang memainkan rules sungguhan
- `game/src/main.js` — game loop dan wiring

Lisensi: MIT (lihat `LICENSE`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=h0jgxf53&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>