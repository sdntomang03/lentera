# Pengiriman Notifikasi FCM

Panel Admin Platform Lentera dapat mengirim notifikasi ke semua perangkat FCM
terdaftar atau ke perangkat milik satu username. Backend mengirim pesan melalui
Firebase Admin SDK; kredensial Firebase tidak pernah dikirim ke browser.

## Konfigurasi server

1. Unduh kunci JSON service account dari Firebase Console untuk project Firebase
   yang sama dengan aplikasi Android Tirta (project ID `siakad-ada65`).
   Service account harus memiliki izin untuk mengirim pesan Firebase Cloud
   Messaging.
2. Simpan file JSON di server pada lokasi privat di luar direktori publik
   aplikasi. Jangan commit atau unggah file ini ke frontend.
3. Isi variabel berikut pada environment backend:

   ```dotenv
   FIREBASE_CREDENTIALS=/absolute/private/path/firebase-service-account.json
   ```

4. Pastikan user proses PHP dapat membaca file tersebut, lalu segarkan konfigurasi
   Laravel di lingkungan deployment, misalnya dengan `php artisan config:cache`.

Jika kredensial belum dikonfigurasi atau Firebase gagal mengirim, endpoint
mengembalikan respons error generik tanpa menampilkan detail kredensial.

## Endpoint

`POST /api/v1/platform/fcm-notifications` memerlukan autentikasi dan role Admin
Platform. Batas permintaan: 10 per menit.

Untuk mengirim ke semua perangkat:

```json
{
  "recipient": "all",
  "title": "Informasi",
  "body": "Pesan untuk semua perangkat"
}
```

Untuk mengirim ke username tertentu:

```json
{
  "recipient": "username",
  "username": "nama_pengguna",
  "title": "Informasi",
  "body": "Pesan untuk pengguna ini"
}
```

Respons sukses mencakup jumlah penerima, pesan berhasil/gagal, dan perangkat
dengan token invalid yang dibersihkan dari daftar. Pengiriman diproses dalam
batch maksimal 500 token.
