# 🌿 CarbonVision— O'zbekiston Karbon Kredit Platformasi

## Loyiha haqida

G'arbda Tesla milliardlab dollar ishlatayotgan karbon kredit tizimini O'zbekistonda oddiy aholiga — fermerlar, o'quvchilar, bog'bonlarga ochiq qilamiz.

---

## Arxitektura

```
sabzcredit/
├── backend/          # Node.js + Express API
│   ├── server.js     # Barcha API endpointlar
│   └── package.json
└── frontend/
    └── sabzcredit-app.html  # Yagona HTML fayl (React-siz)
```

---

## Backend API Endpointlari

### Auth
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | /api/auth/register | Email/parol bilan ro'yxat |
| POST | /api/auth/login | Kirish |
| POST | /api/auth/google | Google OAuth |
| GET  | /api/auth/me | Joriy foydalanuvchi |

### Daraxtlar
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | /api/trees | Yangi daraxt qo'shish |
| GET  | /api/trees | Mening daraxtlarim |
| GET  | /api/trees/all | Barcha daraxtlar (xarita) |
| GET  | /api/trees/:id | Bitta daraxt |
| DELETE | /api/trees/:id | Daraxtni o'chirish |

### Boshqa
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET  | /api/species | Daraxt turlari |
| GET  | /api/dashboard | Dashboard statistikasi |
| GET  | /api/stats/global | Global statistika |
| POST | /api/calculate | Kredit hisoblash |
| GET  | /api/leaderboard | Top-10 foydalanuvchilar |

---

## Formulalar

```
CO₂ yutish (kg/yil) = daraxt_turi_koeffitsienti × soni
Karbon Kredit = CO₂_kg × yosh / 1000
Daromad ($) = kredit × $40–$80
Daromad (so'm) = daromad_usd × 12,700
```

---

## Xususiyatlar

### Xavfsizlik (Anti-Fraud)
- **Double-counting oldini olish**: 10m ichidagi takroriy joylashuvni bloklash
- **Blockchain hash**: Har bir kredit uchun noyob ID (UZ-CC-...)
- **JWT autentifikatsiya**: 7 kunlik token
- **Parol shifrlash**: bcryptjs

### Sertifikatlash jarayoni
1. Foydalanuvchi daraxt ma'lumotlarini kiritadi
2. Tizim koordinatalarni tekshiradi (anti-duplicate)
3. Kredit hisoblash formulasi qo'llaniladi
4. Blockchain hash yaratiladi
5. "Pending" holat → 2 soniya ichida "Verified" (demo uchun; haqiqiy loyihada satellite API)

### Joylashuv usullari
- ✏️ Qo'lda koordinata kiritish
- 📍 GPS / Geolokatsiya (brauzer orqali)
- 🗺️ Xaritadan bosib tanlash (Leaflet.js)

---

## Ishga tushirish

### Backend
```bash
cd backend
npm install
npm start
# http://localhost:5000 da ishlaydi
```

### Frontend
```bash
# Oddiy HTML faylni brauzerda oching
open sabzcredit-app.html

# Yoki http-server bilan:
npx http-server . -p 3000
```

> **Eslatma**: Backend http://localhost:5000 da ishlayotgan bo'lishi kerak.

---

## Daraxt turlari va CO₂ koeffitsientlari

| Tur | CO₂/yil | Kredit (1 dona, 1 yil) |
|-----|---------|----------------------|
| Archa | 22 kg | 0.000022 |
| Terak | 48 kg | 0.000048 |
| Chinor | 56 kg | 0.000056 |
| Eman | 48 kg | 0.000048 |
| Yong'oq | 40 kg | 0.000040 |
| To'l | 35 kg | 0.000035 |

---

## Kelajakdagi rivojlantirish

- [ ] Google OAuth haqiqiy integratsiya (Firebase/Google Cloud)
- [ ] Satellite API (Planet Labs, Sentinel Hub)
- [ ] Real Blockchain (Ethereum/Polygon)
- [ ] Mobile app (React Native)
- [ ] Kredit bozori (C2C savdo)
- [ ] Davlat organlari bilan integratsiya
- [ ] SMS bildirishnomalar (Eskiz.uz)
- [ ] To'lov tizimi (Payme, Click)

---

## Hakaton uchun taqdimot matni

> "G'arbda Tesla milliardlab dollar ishlayotgan tizimni, biz O'zbekistonda oddiy aholiga — o'z hovlisidagi daraxtidan pul ishlash imkonini beradigan platformaga aylantirdik."
