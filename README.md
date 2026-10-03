# Lentera

Lentera adalah aplikasi React/Vite untuk pembelajaran literasi dan numerasi. Data akun, progres, konten, pengaturan portal, dan leaderboard dikelola oleh REST API Laravel dengan MySQL. Endpoint AI tips dan chatbot tetap memakai handler Node.js yang sudah ada.

## Persyaratan

- Node.js dan npm
- PHP 8.3 atau lebih baru
- Composer
- MySQL

## Menjalankan secara lokal

1. Buat database MySQL bernama `lentera`.
2. Siapkan Laravel:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   cd backend
   composer install
   php artisan key:generate
   ```

3. Edit `backend\.env` dengan kredensial MySQL dan set `ADMIN_PASSWORD` dengan kata sandi kuat. `ADMIN_USERNAME` default-nya `guru`.
4. Buat tabel dan akun guru:

   ```powershell
   php artisan migrate --seed
   ```

5. Jalankan API di terminal pertama:

   ```powershell
   php artisan serve --host=127.0.0.1 --port=8000
   ```

6. Di terminal kedua, jalankan frontend:

   ```powershell
   npm install
   npm run dev
   ```

Tips belajar AI, chatbot Endzi, serta generator bacaan/soal guru menggunakan DeepSeek. Atur `DEEPSEEK_API_KEY` aktif pada file `.env` di root proyek, lalu mulai ulang server Vite/Node agar konfigurasi dimuat kembali. Di ruang kerja guru, editor Literasi membuat bacaan, kosakata, empat kuis pilihan ganda, kunci jawaban, dan pembahasan; editor Numerasi membuat stimulus, opsi, kunci, petunjuk, dan langkah penyelesaian. Tab Latihan Membaca Fase A mengelola materi suku kata, pencocokan kata dengan gambar/emoji, dan kalimat pendek; materi disimpan di database dan dimuat pada latihan siswa. Periksa hasil AI sebelum menyimpannya ke Database. Jika DeepSeek bermasalah, fitur Tips menampilkan tips cadangan; generator materi menampilkan pesan kegagalan agar konten yang tidak lengkap tidak tersimpan.

### Multi-sekolah

Isi `PLATFORM_ADMIN_USERNAME` dan `PLATFORM_ADMIN_PASSWORD` pada `backend\.env` untuk akun Admin Platform. Isi juga `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `SCHOOL_NAME` untuk akun guru pertama pada sekolah awal. Jalankan `cd backend; php artisan migrate:fresh --seed` hanya pada database baru atau setelah memastikan data lama memang boleh dihapus. Perintah ini menghapus seluruh tabel aplikasi sebelum membuat skema multi-sekolah dan akun awal. Admin Platform dapat membuat sekolah dan akun guru pertamanya; guru dapat menambah guru serta siswa untuk sekolahnya. Setiap siswa yang dibuat guru atau mendaftar sendiri dengan username guru akan terhubung ke guru tersebut; daftar, pengubahan, dan penghapusan siswa hanya tersedia bagi guru pemilik. Siswa yang dibuat sebelum pembagian per-guru akan otomatis dikaitkan saat migrasi jika sekolahnya hanya memiliki satu guru; data di sekolah dengan beberapa guru memerlukan penetapan manual sebelum muncul di daftar guru. Kode sekolah dan username guru dibagikan kepada siswa untuk pendaftaran. Materi, pengaturan, dan papan peringkat tetap dibatasi berdasarkan sekolah di API.

Vite meneruskan `/api/v1` ke Laravel di `http://127.0.0.1:8000`. Untuk deployment yang menyajikan frontend melalui `npm start`, set `LARAVEL_API_URL` ke origin Laravel. Jika frontend dan API di-host pada origin berbeda, atur `VITE_API_BASE_URL` saat build frontend dan `FRONTEND_URL` pada `backend\.env`.

## REST API

Semua endpoint aplikasi menggunakan prefix `/api/v1`.

| Metode                         | Endpoint                                  | Akses                               |
| ------------------------------ | ----------------------------------------- | ----------------------------------- |
| `POST`                         | `/auth/register`                          | Publik; membuat akun siswa          |
| `POST`                         | `/auth/login`                             | Publik; mengembalikan token Sanctum |
| `GET`                          | `/auth/me`                                | Token                               |
| `POST`                         | `/auth/logout`                            | Token                               |
| `GET`                          | `/content/passages`, `/content/questions`, `/content/reading-practice` | Token; materi sekolah |
| `GET`                          | `/schools/lookup/{code}`                 | Publik; validasi kode sekolah        |
| `POST`, `PUT`, `DELETE`        | `/content/{type}[/{id}]`                  | Guru                                |
| `GET`, `PUT`                   | `/me/progress`                            | Siswa pemilik akun                  |
| `GET`, `POST`, `PUT`, `DELETE` | `/admin/students[/{id}]`                  | Guru                                |
| `POST`                         | `/admin/students/import`                  | Guru; maksimum 100 siswa per batch  |
| `GET`, `PUT`                   | `/settings`                               | Token sekolah; PUT guru              |
| `GET`                          | `/leaderboard`                            | Token; papan peringkat sekolah      |
| `GET`, `POST`, `PUT`           | `/platform/schools[/{id}]`                | Admin Platform                      |
| `GET`                          | `/platform/fcm-devices`                   | Admin Platform; token untuk Firebase |

Endpoint terautentikasi menggunakan header `Authorization: Bearer <token>`. Password disimpan dengan hash Laravel; token API dikelola oleh Sanctum.

Guru dapat mengimpor daftar siswa dari file `.xlsx` atau `.csv` melalui tab Siswa pada Ruang Kerja Guru. Unduh template CSV dari panel, isi kolom `Nama Siswa`, `Username`, `Password`, dan `Kelas/Fase`, lalu unggah berkasnya. Username harus unik dan kata sandi awal minimal 8 karakter. Maksimal 100 siswa per unggahan; baris valid disimpan dan baris yang gagal menampilkan nomor serta alasan agar dapat diperbaiki. Simpan kolom username dan password sebagai teks di Excel agar nol di depan tidak hilang.

Admin Platform dapat melihat username, platform, waktu pembaruan, dan token FCM perangkat Tirta pada dashboard. Token didekripsi hanya pada endpoint khusus admin agar dapat disalin ke Firebase Console; jangan membagikannya di luar operator tepercaya.

Gunakan HTTPS saat deployment. Perhitungan skor masih berasal dari aplikasi frontend dan disimpan oleh API, sehingga leaderboard belum cocok untuk penilaian berisiko tinggi tanpa validasi jawaban dan pemberian skor di server.

## Catatan migrasi Firebase

Firebase tidak lagi digunakan oleh frontend. Data yang telah tersimpan di proyek Firebase **tidak otomatis dipindahkan** ke MySQL. Ekspor data Firebase yang diperlukan dan lakukan impor terpisah sebelum beralih ke produksi. Akun siswa lama perlu dibuat ulang atau diimpor dengan proses pemberian/reset kata sandi yang aman.

Konten kurikulum lokal dapat disalin ke MySQL dari Panel Guru menggunakan menu sinkronisasi konten standar setelah API dan akun guru siap.
