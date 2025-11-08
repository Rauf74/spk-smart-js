# SuperApp Full-Stack Decision Support System (SMART)  
# for University Program Recommendations (V2)  
*(SPK Sistem Rekomendasi Program Studi Perkuliahan)*

Saya membangun ulang sistem SMART untuk SMK Muhammadiyah 3 Tangerang Selatan ke stack Node.js + Express. Versi sebelumnya dibuat dengan PHP MVC, dan proyek ini adalah versi “revamp”-nya: backend modular, front-end interaktif, dan proses pengambilan keputusan yang tetap bisa diverifikasi seperti perhitungan manual konselor.

---

## Kenapa Aplikasi Ini Penting

- **Metode SMART transparan** — semua langkah (normalisasi bobot, utility Benefit/Cost, hingga ranking) bisa dilihat kembali sehingga keputusan mudah dipertanggungjawabkan.
- **Konselor & Siswa punya alur masing-masing** — konselor mengelola kriteria, subkriteria, dan kuesioner; siswa fokus mengisi penilaian dan langsung melihat rekomendasi personal.
- **UI terasa familiar** — DataTables untuk pencarian, modal CRUD, SweetAlert untuk konfirmasi, layout Bootstrap yang ringan dipakai guru maupun siswa.
- **Keamanan tetap diperhatikan** — JWT cookie, role-based guard, dan respons API konsisten supaya front-end gampang memprosesnya.

---

## Fitur Utama

| Modul               | Guru BK                         | Siswa |
|---------------------|----------------------------------|-------|
| Dashboard & statistik | ✅                              | ✅     |
| Kelola Kriteria       | ✅ (CRUD + validasi bobot)       | ❌     |
| Kelola Subkriteria    | ✅                              | ❌     |
| Kelola Pertanyaan     | ✅                              | ❌     |
| Perhitungan SMART     | ✅ (per siswa)                  | ✅ (hasil pribadi) |
| Lihat Ranking         | ✅ (semua siswa)                | ✅ (ranking pribadi) |
| Kelola Akun           | ✅                              | ✅     |
| Ekspor PDF            | ✅ (templated & branded)        | segera |

---

## Teknologi yang Saya Pakai

### Backend
- **Node.js + Express** – REST API per domain (kriteria, penilaian, perangkingan, dll).
- **Auth** – JWT disimpan sebagai cookie HTTP-only. Middleware `requireAuth` dan `requireRole(s)` memastikan hak akses.
- **Database** – PostgreSQL via `pg` (dikonfigurasi untuk Neon/Supabase tanpa perubahan kode tambahan).
- Struktur modul:
  - `server/functions` – tempat logika bisnis (perhitungan SMART, perangkingan siswa, dsb).
  - `server/api` – router Express dengan error handling terstandarisasi.
  - `server/middleware` – autentikasi, guard per role.

### Frontend
- **Bootstrap 5 Modernize Template** – layout admin yang responsif.
- **jQuery + DataTables + SweetAlert2** – sudah terbukti nyaman dipakai guru di versi sebelumnya, jadi saya pertahankan dengan kode yang lebih bersih (async/await).
- **ES6 Modules** – auth guard, komponen sidebar/header custom, helper `fetchJSON`.

---

## Alur Perhitungan SMART (versi guru BK)

1. Masukkan kriteria dan bobot (sistem menolak jika total > 100%).
2. Atur subkriteria dan mapping pertanyaan.
3. Kumpulkan jawaban (oleh siswa atau dibantu konselor).
4. Jalankan perhitungan:
   - Normalisasi bobot.
   - Hitung utility Benefit/Cost menggunakan nilai tiap subkriteria.
   - Kalikan utility × bobot normalisasi → nilai akhir per alternatif.
5. Tinjau tabel hasil, simpan, atau ekspor keputusan.

---

## Catatan Keamanan

- Cookie JWT bertipe `httpOnly` dan `sameSite` untuk meminimalkan risiko XSS/CSRF.
- Middleware role memastikan API hanya diakses pengguna yang berhak.
- Semua endpoint mengembalikan struktur JSON seragam (`success`, `data`, `error`) supaya front-end mudah memproses error/sukses.

---

## Cara Menjalankan (Local)

```bash
git clone https://github.com/yourusername/spk-smart-js.git
cd spk-smart-js
npm install
```

Buat file `.env`:
```
# pilih salah satu pendekatan koneksi
DATABASE_URL=postgres://user:password@host:5432/spk_smart
# atau gunakan parameter terpisah
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=spk_smart
# DB_USER=postgres
# DB_PASS=yourpassword
# DB_SSL=false          # set true jika koneksi butuh SSL (Neon/Supabase)

JWT_SECRET=yourjwtsecret
PORT=3000
```

> Untuk Neon/Supabase cukup tempel `DATABASE_URL` yang mereka berikan. Aplikasi otomatis memakai SSL di production atau jika `DB_SSL=true`.

Jalankan:
```bash
npm run dev
```

Buka `http://localhost:3000/views/login.html`, login dengan akun seed, atau buat akun baru lewat halaman register.

---

## Deployment

- Backend tanpa state → bisa ditempatkan di Vercel, Render, atau Fly.io.
- Database tinggali di cloud PostgreSQL (Neon, Supabase, Railway) dan isi environment variable di platform deploy.
- Saat sudah HTTPS, set cookie `secure: true` agar lebih aman.

---

## Apa yang Saya Pelajari

- Refactor aplikasi PHP menjadi Node.js sambil menjaga logika SMART yang digunakan guru di sekolah.
- Membuat API yang jelas membedakan peran dan mencegah data antar-siswa tercampur.
- Menulis module front-end yang reusable (sidebar, auth guard, helper fetch) tapi masih nyaman dipakai dengan jQuery/DataTables.
- Mengerti kembali detail SMART: bagaimana normalisasi, utility Benefit vs Cost, dan bagaimana memastikan hasil sistem sama dengan Excel manual.

---

## Kontak

- LinkedIn: [linkedin.com/in/your-profile](https://www.linkedin.com/in/your-profile)  
- Email: [email@example.com](mailto:email@example.com)

Saya siap berdiskusi kalau Anda tertarik melihat lebih dalam bagaimana sistem ini bekerja, atau jika ada kebutuhan serupa di sekolah/organisasi Anda.
