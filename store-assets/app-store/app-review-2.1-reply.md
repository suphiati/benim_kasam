# App Review — Guideline 2.1 Information Needed (11 Eylül 2026)

**Gönderim:** afd9d804-44cf-4ced-b595-788c8802e1a8 · iOS 1.3.1 (6.1) · Durum: Rejected — "2.1.0 Performance: App Completeness"

Uygulamada hata bulunmadı. Hesabın App Review geçmişi kısa olduğu için Apple ek bilgi istiyor:

1. Gerçek bir iPhone'da (en güncel iOS) çekilmiş, uygulamanın açılışıyla başlayıp tipik kullanımı gösteren ekran kaydı
2. Uygulamanın amacı ve hedef kitlesi
3. Kurulum ve ana özelliklere erişim talimatı
4. Kullanılan dış servisler
5. Bölgesel farklılıklar
6. Düzenlemeye tabi bir alandaysa yetki belgesi

Cevap App Store Connect'te **Reply to App Review** ile (video ekli) gönderilir; aynı bilgiler **App Review Information → Notes** alanına da yazılır; sonra **Resubmit to App Review**.

## Ekran kaydı senaryosu (yaklaşık 90 saniye)

Hazırlık: iPhone'da Kontrol Merkezi'nde "Ekran Kaydı" olsun, Rahatsız Etmeyin açık olsun (kayda bildirim düşmesin). Uygulama TestFlight'tan yüklü, kasa boş.

1. Kaydı başlat, ana ekrandan BenimKasam'ı aç. Cihazda parola varsa Face ID istemi gelir, doğrula.
2. **Ekle** → **Alım** → **Gram Altın** → miktar `10`, birim fiyat alanına güncel fiyatı yaz → kaydet.
3. **Kasam**: toplam değer, maliyet ve kâr/zarar görünsün. Kasa kartında **₺ → $ → €** dokun, sonra ₺'ye dön.
4. **Ekle** → **Alım** → **Amerikan Doları** → `500` → kaydet.
5. **İşlemler**: liste, üstte **Amerikan Doları** filtresi, sonra **Tümü**. Bir işlemde düzenle simgesine dokun, kaydetmeden kapat.
6. **Ayarlar**: **Dil** → English (arayüz değişir) → tekrar Türkçe. **Biyometrik Kilit** anahtarını göster. **Verileri Dışa Aktar** → paylaşım ekranı açılır → kapat.
7. **Kasam** → **QR Oluştur** → QR görünür → kapat. (İkinci cihaz olmadan eşleşme olmaz; bu normal.)
8. Ana ekrana dön, kaydı durdur. Video Fotoğraflar'da; buradan bilgisayara aktar.

## Reply to App Review (İngilizce — gönderilecek metin)

```
Hello App Review team,

Thank you for reviewing BenimKasam. Please find the requested information below. The same information has been added to the Notes field of the App Review Information section.

1. Screen recording
Attached is a screen recording captured on a physical iPhone running the latest iOS, starting from app launch and showing the typical user flow: unlocking the app, adding transactions, viewing the vault in ₺, $ and €, the transaction list, settings, data export and the optional QR pairing screen. BenimKasam has no account registration or login, no user-generated content shared with others, and no paid content or in-app purchases.

2. Purpose and target audience
BenimKasam is a personal record-keeping app for people who keep their savings in foreign currency and physical gold, for example at home or in a safe deposit box. It is aimed at individuals in Türkiye and the Turkish diaspora who hold US dollars, euros, Turkish gold coins (gram gold, quarter, half and full coins, Cumhuriyet and Ata coins, 14K and 22K gold) and silver.
Such holdings are bought over time at different prices, so their current worth and profit are hard to follow. The user records each purchase and sale; the app shows the current value using public market prices, the average cost and the realized and unrealized profit or loss, in Turkish lira, US dollars or euros. Data stays on the device, no account is required and the app works offline.

3. Setup and main features
No login, account or sample file is needed; every feature is available right after launch.
- App lock: if the device has a passcode, the app asks for Face ID, Touch ID or the device passcode at launch (on by default to protect financial records). It can be turned off in "Ayarlar" (Settings) > "Biyometrik Kilit".
- Add a transaction: "Ekle" (Add) tab > "Alım" (Buy) or "Satım" (Sell) > choose an asset such as "Gram Altın" > enter the amount and unit price > save.
- Vault: the "Kasam" tab shows total value, cost and profit/loss. The ₺ / $ / € switch on the vault card changes the reporting currency.
- Transactions: the "İşlemler" tab lists, filters, edits and deletes records.
- Settings: the "Ayarlar" tab has language, app lock, JSON export/import and deleting all data.
- Optional sync: "QR Oluştur" (Generate QR) on one device and "QR Oku" (Scan QR) on a second device pair them. Pairing needs two devices and is entirely optional.

4. External services
- Our own server on Vercel (benim-kasam.vercel.app/api/rates) returns current market prices. It aggregates public data from Truncgil Finans (finans.truncgil.com), GenelPara (api.genelpara.com) and ExchangeRate-API (api.exchangerate-api.com). If our server cannot be reached, the app reads Truncgil Finans directly.
- Frankfurter (api.frankfurter.dev, European Central Bank reference rates) provides historical exchange rates for showing costs in US dollars or euros.
- Google Firebase Realtime Database and Firebase Anonymous Authentication are used only for the optional QR sync.
- Apple's iTunes Search API is used to check whether a newer version is available on the App Store.
No payment processors, advertising, analytics or AI services are used, and no user data is sent to the price sources.

5. Regional differences
There are no regional differences; features and content are the same in all regions. Prices are Turkish market quotes in Turkish lira and can be viewed in US dollars or euros. The interface is available in Turkish and English.

6. Regulated industry and third-party material
BenimKasam is not a financial service. It does not provide banking, brokerage, trading, payments, lending, custody of funds or investment advice, and it does not move real money. Users manually record holdings they already own. Market prices come from free public data sources and are shown for information only. It contains no protected third-party material.

Best regards,
Suphi Atılım Çeliköz
```

## App Review Information → Notes (İngilizce — mevcut notun yerine)

```
BenimKasam is a personal record-keeping app for savings held in foreign currency and physical gold. No account or login is required; every feature is available right after launch. A screen recording from a physical iPhone was attached to our App Review reply for submission afd9d804-44cf-4ced-b595-788c8802e1a8.

PURPOSE AND AUDIENCE
For individuals in Türkiye and the Turkish diaspora who hold US dollars, euros, Turkish gold coins (gram, quarter, half, full, Cumhuriyet, Ata, 14K/22K) and silver, bought over time at different prices. The user records each purchase and sale; the app shows current value from public market prices, average cost and realized/unrealized profit or loss in Turkish lira, US dollars or euros. Data stays on the device and the app works offline.

HOW TO REVIEW
1. App lock: on a device with a passcode, the app asks for Face ID / Touch ID or the passcode at launch (on by default). It can be turned off in "Ayarlar" (Settings) > "Biyometrik Kilit".
2. "Ekle" (Add) tab > "Alım" (Buy) > pick an asset such as "Gram Altın" > enter amount and unit price > save. The "Kasam" (Vault) tab then shows value and profit/loss; the ₺ / $ / € switch changes the reporting currency.
3. "İşlemler" (Transactions) lists, filters, edits and deletes records. "Ayarlar" (Settings) has language (Turkish/English), app lock, JSON export/import and delete all data.
4. Optional sync: "QR Oluştur" (Generate QR) on one device and "QR Oku" (Scan QR) on a second device pair them. It needs two devices and is optional.

EXTERNAL SERVICES
- Our server on Vercel (benim-kasam.vercel.app/api/rates): current prices aggregated from Truncgil Finans, GenelPara and ExchangeRate-API; the app falls back to Truncgil Finans directly.
- Frankfurter (European Central Bank reference rates): historical exchange rates.
- Google Firebase Realtime Database + Anonymous Authentication: only for optional QR sync.
- Apple iTunes Search API: new version check.
No payments, advertising, analytics or AI services. No user data is sent to price sources.

REGIONS
Same features and content in all regions. Prices are Turkish market quotes in lira, viewable in US dollars or euros. Turkish and English interface.

REGULATION
Not a financial service: no banking, brokerage, trading, payments, lending, custody or investment advice, and no real money movement. Users record holdings they already own; prices are public reference data shown for information only. No protected third-party material.
```
