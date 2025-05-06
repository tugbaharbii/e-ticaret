# Hibrit E‑Ticaret Backend

> **Node.js + Express tabanlı, MySQL & MongoDB kombinasyonunu kullanan tam işlevli REST API.** Çekirdek veriler için ACID güvenceli bir ilişkisel veritabanı (MySQL) ve oturum/sepet verileri için esnek bir belge deposu (MongoDB) tasarımının birleşimi.

---

## 📚 Bu README Neyi Kapsar?

| Bölüm                                     | Ne Öğrenirsiniz?                    |
| ----------------------------------------- | ----------------------------------- |
| [Proje Hakkında](#proje-hakkında)         | Sistem hangi problemi çözüyor?      |
| [Canlı Senaryo](#canlı-senaryo)           | 3 dakikalık uçtan‑uca demo akışı    |
| [Mimari](#mimari)                         | Katman şeması & veri akışı          |
| [Özellikler](#özellikler)                 | Kilit yetenekler                    |
| [Teknoloji Yığını](#teknoloji-yığını)     | Kullanılan kütüphane & araçlar      |
| [Kurulum](#kurulum)                       | Ortam hazırlığı + ilk çalıştırma    |
| [Kullanım Örnekleri](#kullanım-örnekleri) | İstek‑yanıt JSON örnekleri          |
| [Test & CI](#test--ci)                    | Birim & entegrasyon testleri        |
| [Dağıtım](#dağıtım)                       | Docker, Railway, Render talimatları |
| [SSS](#sss)                               | Sık sorulan sorular                 |
| [Katkıda Bulunma](#katkıda-bulunma)       | PR akışı                            |

---

## Proje Hakkında

Geleneksel e‑ticaret projelerinde **"hepsi tek veritabanı"** yaklaşımı ya katı şema (SQL) esnekliği kısıtlar ya da tam tersi (NoSQL) güçlü ilişkileri zorlaştırır. Bu repo, **"kritik veriler → MySQL"**, **"oturum / sepet / geçici veriler → MongoDB"** yaklaşımını örnekleyerek hibrit modelin pratik bir uygulamasını gösterir.

> **Hedef Kitle**: Öğrenciler, demo amaçlı POC'ler, düşük/orta trafikli butik mağazalar.

### Temel Fayda

* **En iyi nokta**: Bir ürün silindiğinde MySQL'den düşer, **tek satır kodla** ( `$pull` ) tüm sepetlerden kaybolur. Veri bütünlüğü + esneklik = 💖

---

## Canlı Senaryo

Aşağıdaki akışı sunumda 3 dakikada gösterebilirsiniz:

1. **Sağlık Testi** – `GET /` → `200 OK` "API ayakta!"
2. **Tedarikçi Kaydı** – `POST /api/auth/register` (rol: `supplier`)
3. **Ürün Ekle** – `POST /api/products` "T‑Shirt"
4. **Müşteri Kaydı / Giriş** – token al
5. **Ürünleri Listele** – `GET /api/products`
6. **Sepete Ekle** – `POST /api/cart`
7. **Ürünü Sil** (tedarikçi) – `DELETE /api/products/:id`
8. **Sepeti Yeniden Görüntüle** – ürün artık yok → otomatik temizlik 🎉

Her adımda Postman çıktısının solunda log'ları göstererek çift taraflı etkiyi kanıtlayın.

---

## Mimari

```
                                      HTTP
┌──────────┐   token   ┌───────────────┴───────────────┐
│  İstemci │──────────▶│        Express API           │
└──────────┘           │                               │
                      │ Auth   │ Product   │ Cart      │
                      └──────┬─┴───────┬───┴───────┬──┘
                             │          │           │
            ACID garanti     │          │           │  Şemasız esneklik
┌────────────────────────┐  │  ┌────────────────────────┐
│        MySQL           │◀─┘  │        MongoDB         │
│ users, products tabl.  │     │   carts koleksiyonu    │
└────────────────────────┘     └────────────────────────┘
```

---

## Özellikler

* 🗄️ **Hibrit Veri Katmanı** – kritik veriler SQL, geçici veriler NoSQL
* 🔐 **JWT + RBAC** – roller: müşteri · tedarikçi · admin
* 🔒 **Bcrypt** – tuzlu parola şifreleme
* 📧 **Nodemailer** – şifre sıfırlama e‑postaları (SMTP & Gmail desteği)
* 🌐 **RESTful uç noktalar** – Swagger/OpenAPI betiği hazır
* 🛠️ **Geliştirici Deneyimi** – nodemon, ESLint, Prettier, Jest, Supertest

---

## Teknoloji Yığını

| Katman           | Teknoloji                 |
| ---------------- | ------------------------- |
| Çalışma Zamanı   | Node.js 18+               |
| Framework        | Express 5                 |
| Veritabanı       | MySQL 8 · MongoDB 6       |
| Kimlik Doğrulama | JSON Web Tokens           |
| Mail             | Nodemailer (SMTP/Gmail)   |
| Test             | Jest & Supertest          |
| DevOps           | Docker, GitHub Actions CI |

---

## Kurulum

### 1 | Depoyu Çek

```bash
git clone https://github.com/your‑org/ecommerce-hybrid.git
cd ecommerce-hybrid
```

### 2 | Bağımlılıkları Kur

```bash
npm install
```

### 3 | Ortam Değişkenleri

`cp .env.example .env` ➜ `.env` dosyasını doldurun.

### 4 | MySQL Şeması

```bash
mysql -u root -p < scripts/mysql/schema.sql
```

### 5 | MongoDB

* **Yerel**: `mongod --dbpath /data/db`
* **Atlas**: URI'yi `.env` → `MONGO_URI` alanına yapıştır.

### 6 | Uygulamayı Çalıştır

```bash
npm run dev   # nodemon ile sıcak yeniden yükleme
```

> **Sonuç**: `Server listening on http://localhost:5000` + `MongoDB connected` logu.

---

## Kullanım Örnekleri

### Kayıt

```http
POST /api/auth/register
{
  "email": "demo@shop.com",
  "password": "1234",
  "role": "customer"
}
```

Yanıt:

```json
{
  "token": "eyJhbGci...",
  "user": { "userId": 7, "role": "customer" }
}
```

### Ürün Ekleme (Tedarikçi)

```http
POST /api/products
Authorization: Bearer <token>
{
  "name": "T‑Shirt",
  "description": "%100 pamuk",
  "price": 199.90,
  "stock": 50
}
```

### Sepete Ekleme (Müşteri)

```http
POST /api/cart
Authorization: Bearer <token>
{
  "productId": 1,
  "quantity": 2
}
```

### Ürün Silme

```http
DELETE /api/products/1
Authorization: Bearer <supplier‑or‑admin‑token>
```

**Otomatik İşlem** → API arka planda:

```js
await Cart.updateMany({}, { $pull: { items: { productId } } });
```

Sonraki `GET /api/cart` isteğinde ürün artık görünmez.

---

## Test & CI

```bash
npm test        # Jest + Supertest
npm run lint    # ESLint
```

GitHub Actions; push edildiğinde tüm testler otomatik çalışır.

---

## Dağıtım

| Platform    | Adım                                                              |
| ----------- | ----------------------------------------------------------------- |
| **Docker**  | `docker compose up --build`                                       |
| **Railway** | Repo'yu bağla → Ortam değişkenlerini gir → Deploy                 |
| **Render**  | "Web Service" oluştur → Build `npm run build` → Start `npm start` |

---

## SSS

> **Ürün stok senkronizasyonunu nasıl yapıyorsunuz?**
> MySQL'deki `stock` sütunu güncellendiğinde ilgili sepetlerdeki miktar kontrol edilmiyor — gerçek zamanlı stok senkronizasyonu bu demo kapsamı dışında. İhtiyaç halinde `Change Streams` (Mongo) + `MySQL triggers` ile genişletilebilir.

> **Bu yapıyı TypeScript ile kullanabilir miyim?**
> Evet. `tsconfig.json`, `src/**/*.ts` ve `npm run build` (ts‑node) ekleyin. Jest konfigürasyonunu ts‑jest ile güncellemek yeterli.

---

## Katkıda Bulunma

1. Fork ➜ `git checkout -b feat/yeni-özellik`
2. Değiştir ➜ `npm test`
3. PR oluştur (açıklayıcı başlık + ekran görüntüsü 🖼️)

ESLint & Prettier commit hook (husky) çalıştırılır. Hatalı format PR'ı engeller.

---


