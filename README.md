# Zakovat — Prezentatsiya platformasi

Zakovat (viktorina) o'yinlarini loyihalash va **taqdimotchi** sifatida boshqarish uchun
minimal, tez va chiroyli veb-ilova. Bu ilova ishtirokchilarning o'z telefonidan javob
berishi uchun emas — faqat proyektor/katta ekranda savollarni chiroyli tarzda
ko'rsatish uchun (Apple Keynote uslubida).

## Texnologiyalar

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Framer Motion (animatsiyalar), Zustand (holat boshqaruvi)
- Tiptap (ko'p tilli rich-text muharrir), react-dnd (drag & drop)
- **Backend yo'q.** Barcha ma'lumot brauzerda saqlanadi: matn/tuzilma —
  `localStorage`, rasm/video/audio fayllar — `IndexedDB`. Bu Vercel'ga
  serverless sifatida joylashtirish uchun juda mos (ma'lumotlar bazasi shart emas),
  lekin ma'lumotlar faqat shu brauzer/kompyuterda saqlanadi — boshqa qurilmaga
  ko'chmaydi.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:3000` oching.

## Vercel'ga joylashtirish

```bash
npm i -g vercel
vercel
```

yoki GitHub'ga push qilib Vercel dashboard orqali repo'ni ulang. Qo'shimcha
environment variable yoki backend sozlash shart emas — loyiha to'liq
client-side ishlaydi.

## Qanday ishlaydi

1. Bosh sahifada **"Yangi Zakovat"** tugmasi bilan viktorina yarating.
2. Tahrirlash rejimida chap tomondan bosqichlar (Stage) va har bir bosqich
   ichida savollar qo'shasiz. 6 xil savol turi mavjud: matnli, variantli,
   rasmli, ko'p-rasmli (avtomatik kollaj), musiqali va videoli.
3. Har bir bosqich uchun javob ochilish rejimini tanlang: har savoldan keyin,
   bosqich oxirida, yoki qo'lda (taqdimotchi xohlagan payt Space bosadi).
4. **"Taqdimotni boshlash"** tugmasi orqali to'liq ekran taqdimot rejimiga
   o'ting.

### Klaviatura tugmalari (taqdimot rejimida)

| Tugma | Amal |
|---|---|
| → | Keyingi slayd |
| ← | Oldingi slayd |
| Space | Javobni ochish / davom etish |
| F | To'liq ekran |
| Esc | To'liq ekrandan chiqish |
| 1-9 | Joriy bosqichdagi N-savolga o'tish |

Barcha ma'lumot avtomatik saqlanadi — alohida "Saqlash" tugmasi yo'q.
