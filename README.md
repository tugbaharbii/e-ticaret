# Hibrit E‑Ticaret Backend

> **Hibrit kalıcılık katmanlı (MySQL + MongoDB) bir Node.js + Express REST API**. Çekirdek veriler için ilişkilisel veritabanının ACID garantilerini, oturum benzeri veriler için belge tabanlı depolamanın esnekliğiyle birleştirmek isteyen çevrimiçi mağazalar için tasarlandı.

---

## İçindekiler

1. [Mimari](#mimari)
2. [Özellikler](#özellikler)
3. [Teknoloji Yığını](#teknoloji-yığını)
4. [Ön Koşullar](#ön-koşullar)
5. [Hızlı Başlangıç](#hızlı-başlangıç)
6. [Ortam Değişkenleri](#ortam-değişkenleri)
7. [Veritabanı Kurulumu](#veritabanı-kurulumu)
8. [Yerel Çalıştırma](#yerel-çalıştırma)
9. [Proje Yapısı](#proje-yapısı)
10. [API Referansı](#api-referansı)
11. [Test](#test)
12. [Dağıtım](#dağıtım)
13. [Katkıda Bulunma](#katkıda-bulunma)
14. [Lisans](#lisans)
15. [Sürdürümcüler](#sürdürümcüler)

---

## Mimari

```
┌──────────────────────┐        ┌──────────────────────┐
│   İstemci (Postman)  │──────▶ │  Node.js / Express   │
└──────────────────────┘        │  ├─ Auth Denetleyici  │
                                │  ├─ Ürün Rotaları     │
                                │  └─ Sepet Rotaları    │
                                └─────────┬────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
           ┌────────────────────────┐        ┌────────────────────────┐
           │        MySQL           │        │        MongoDB         │
           │ kullanıcı, ürün tabl.  │        │   carts koleksiyonu    │
           └────────────────────────┘        └────────────────────────┘
```

* **İlişkisel Çekirdek (MySQL)** – kullanıcılar ve ürünler için katı şema.
* **Esnek Sepet Katmanı (MongoDB)** – sepetler belge modeliyle hafif ve uyarlanabilir.
* **JWT Tabanlı Kimlik Doğrulama** – stateless, rol bilgili (`customer`, `supplier`, `admin`).
* **Servis Katmanı** – çapraz veritabanı tutarlılığı (ör. ürün silindiğinde MySQL ➜ MongoDB’deki tüm sepetlerden `$pull`).

---

## Özellikler

* Hibrit veritabanı tasarımı: çekirdek verilerde **ACID**, sepet verilerinde **şemasız** esneklik
* **RESTful API** (Express 5)
* **Bcrypt** ile parola karma + e‑posta ile sıfırlama akışı (Nodemailer)
* **Rol Tabanlı Erişim Kontrolü** (RBAC)
* Winston & morgan ile modüler loglama
* nodemon ile canlı yeniden yükleme
* Swagger belgeleri için hazır şablon (`docs/`)

---

## Teknoloji Yığını

| Katman               | Teknoloji                            |
| -------------------- | ------------------------------------ |
| Çalışma Zamanı       | Node.js ≥ 18, npm ≥ 10               |
| Çatı                 | Express 5                            |
| Veritabanları        | MySQL 8 · MongoDB 6                  |
| Kimlik Doğrulama     | JSON Web Tokens (JWT)                |
| E‑posta              | Nodemailer (SMTP / Gmail)            |
| Geliştirici Araçları | nodemon · dotenv · ESLint · Prettier |
| Test                 | Jest · Supertest                     |

---

## Ön Koşullar

* **Node.js** 18 veya üzeri
* **MySQL** 8.x
* **MongoDB** 6.x (yerel veya Atlas)
* npm / yarn
* E‑posta özellikleri için Gmail veya SMTP bilgileri

---

## Hızlı Başlangıç

```bash
# 1 | Klonla & bağımlılıkları kur
$ git clone https://github.com/your-org/ecommerce-hybrid.git
$ cd ecommerce-hybrid
$ npm install

# 2 | Ortam dosyası oluştur
$ cp .env.example .env
# → değişkenleri doldur

# 3 | MySQL şemasını başlat
$ mysql -u root -p < scripts/mysql/schema.sql

# 4 | Sunucuyu çalıştır (geliştirme)
$ npm run dev
# → http://localhost:5000
```

---

## Ortam Değişkenleri

| Anahtar          | Açıklama                                 |
| ---------------- | ---------------------------------------- |
| `PORT`           | Express sunucu portu (varsayılan `5000`) |
| `MYSQL_HOST`     | MySQL sunucusu                           |
| `MYSQL_USER`     | MySQL kullanıcısı                        |
| `MYSQL_PASSWORD` | MySQL parolası                           |
| `MYSQL_DATABASE` | MySQL şeması                             |
| `MONGO_URI`      | MongoDB bağlantı dizesi                  |
| `JWT_SECRET`     | Token imzalama anahtarı                  |
| `EMAIL_USER`     | SMTP kullanıcı adı / Gmail               |
| `EMAIL_PASS`     | SMTP parolası / Gmail uygulama parolası  |

> **İpucu:** `.env` dosyasını sürüm kontrolüne eklemeyin.

---

## Veritabanı Kurulumu

### MySQL

```sql
CREATE DATABASE ecommerce;
USE ecommerce;

SOURCE scripts/mysql/schema.sql;
```

### MongoDB

```bash
# yerel
$ mongod --dbpath /data/db
# veya bulut
MONGO_URI="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/ecommerce"
```

---

## Yerel Çalıştırma

| Mod        | Komut         | Not               |
| ---------- | ------------- | ----------------- |
| Geliştirme | `npm run dev` | nodemon + loglama |
| Üretim     | `npm start`   |                   |
| Test       | `npm test`    | Jest + Supertest  |

Swagger dokümanı için: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## Proje Yapısı

```
scripts/
  mysql/schema.sql
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
tests/
.env.example
server.js
README.md
```

---

## API Referansı (özet)

| Yöntem   | Uç Nokta             | Korumalı       | Amaç                  |
| -------- | -------------------- | -------------- | --------------------- |
| `GET`    | `/`                  | ✗              | Sağlık testi          |
| `POST`   | `/api/auth/register` | ✗              | Kayıt                 |
| `POST`   | `/api/auth/login`    | ✗              | JWT al                |
| `POST`   | `/api/products`      | supplier/admin | Ürün oluştur          |
| `GET`    | `/api/products`      | ✗              | Ürünleri listele      |
| `DELETE` | `/api/products/:id`  | supplier/admin | Sil + sepet temizliği |
| `POST`   | `/api/cart`          | customer       | Sepete ekle           |
| `GET`    | `/api/cart`          | customer       | Sepeti görüntüle      |

Tam dokümantasyon için [`docs/`](docs/) klasörüne ve Postman koleksiyonuna (`postman/ecommerce-demo.json`) bakabilirsiniz.

---

## Test

```bash
$ npm test
```

* **Jest** ve **Supertest** ile birim + entegrasyon testleri.

---

## Dağıtım

| Platform | Rehber                                                  |
| -------- | ------------------------------------------------------- |
| Docker   | `docker compose up --build` (bkz. `docker-compose.yml`) |
| Railway  | Push → env değişkenlerini panelden ekle                 |
| Render   | Web Service · Build `npm run build` · Start `npm start` |

> **Not:** Her iki veritabanının da platformdan erişilebilir olduğundan emin olun (yönetilen MySQL & Mongo eklentileri veya harici kümeler).

---

## Katkıda Bulunma

1. Repo'yu çatallayın
2. Bir özellik dalı oluşturun (`git checkout -b feat/özellik`)
3. Commit & push (`git commit -am "feat: özellik"`)
4. Pull Request açın

Kod stili **ESLint** & **Prettier** ( `npm run lint` ) ile denetlenir.

---

## Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Ayrıntılar için `LICENSE` dosyasına bakın.

---

