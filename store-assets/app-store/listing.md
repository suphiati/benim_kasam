# BenimKasam — App Store Connect metinleri

İlk iOS sürümü (1.3.1) için App Store Connect'e girilecek metinler ve beyanlar.
Metinler Play mağaza metninden uyarlandı; iOS'a özgü ifadeler (Face ID / Touch ID) düzeltildi.
App Store açıklamada emoji kabul etmiyor ("invalid characters"), bölüm başlıkları bu yüzden büyük harfle yazıldı.

## Uygulama bilgileri

| Alan | Değer |
|---|---|
| Ad | BenimKasam |
| Alt başlık (TR, ≤30) | Altın, döviz, kâr/zarar takibi |
| Alt başlık (EN, ≤30) | Track gold, FX & profit/loss |
| Birincil dil | Türkçe |
| Paket kimliği | com.suphiatilim.benimkasam |
| SKU | benimkasam-ios |
| Birincil kategori | Finans |
| Telif hakkı | 2026 RiskManage Studio |
| Destek URL'si | https://benim-kasam.vercel.app |
| Gizlilik politikası URL'si | https://benim-kasam.vercel.app/gizlilik.html |
| Fiyat | Ücretsiz, tüm ülkeler |

## Türkçe

### Tanıtım metni (≤170)

Altın ve döviz birikiminizi canlı kurlarla takip edin. Üyelik gerektirmez, verileriniz cihazınızda kalır; kasanızı ₺, $ veya € cinsinden görün.

### Açıklama

BenimKasam, döviz ve altın varlıklarınızı tek yerden takip etmenizi sağlayan sade ve güvenli bir kişisel kasa uygulamasıdır.

NELER YAPABİLİRSİNİZ?
• Dolar, Euro ve diğer dövizler ile gram, çeyrek, yarım, tam, Cumhuriyet ve Ata altını, 14/22 ayar altın ve gümüş alım-satımlarınızı kaydedin
• Canlı kurlarla varlıklarınızın güncel değerini ve kâr/zarar durumunu anında görün
• Ortalama maliyet ile gerçekleşen ve gerçekleşmemiş kâr/zarar otomatik hesaplansın
• Kasanızın toplam değerini Türk lirası, dolar veya euro cinsinden görüntüleyin

GİZLİLİK VE GÜVENLİK ÖNCE GELİR
• Verileriniz öncelikle kendi cihazınızda saklanır
• Face ID / Touch ID veya cihaz parolası ile uygulama kilidi
• Ad, e-posta veya kişisel bilgi istemez; üyelik gerektirmez

KOLAYLIKLAR
• QR kod ile cihazlar arası senkronizasyon (isteğe bağlı)
• Verilerinizi dosya olarak yedekleyin ve geri yükleyin
• İnternet olmadan da kayıtlarınıza erişin
• Türkçe ve İngilizce arayüz

Not: BenimKasam bir yatırım danışmanlığı hizmeti değildir; kişisel kayıt ve takip aracıdır. Gösterilen fiyatlar bilgi amaçlıdır.

### Anahtar kelimeler (≤100)

kur,çeyrek,gram,dolar,euro,gümüş,kasa,portföy,birikim,yatırım,ayar,cumhuriyet,ata,bilezik,sterlin

## English (U.S.)

### Promotional text (≤170)

Track your gold and currency savings with live prices. No sign-up, your data stays on your device, and you can view your vault in ₺, $ or €.

### Description

BenimKasam is a simple and secure personal vault app for tracking your currency and gold holdings in one place.

WHAT YOU CAN DO
• Record purchases and sales of US dollars, euros and other currencies, gram gold, Turkish gold coins (Çeyrek, Yarım, Tam, Cumhuriyet, Ata), 14K/22K gold and silver
• See the current value and profit/loss of your holdings instantly with live prices
• Average cost plus realized and unrealized profit/loss are calculated automatically
• View your vault's total value in Turkish lira, US dollars or euros

PRIVACY AND SECURITY FIRST
• Your data is stored primarily on your own device
• App lock with Face ID / Touch ID or device passcode
• No name, email or personal information required; no sign-up

CONVENIENCE
• Optional sync between devices with a QR code
• Back up and restore your data as a file
• Access your records even without an internet connection
• Turkish and English interface

Note: BenimKasam is not an investment advisory service; it is a personal record-keeping and tracking tool. Prices shown are for information purposes only.

### Keywords (≤100)

gold,currency,exchange rate,turkish lira,portfolio,savings,dollar,euro,silver,tracker,coin,expat

## App Review bilgileri

- **Oturum açma gerekli mi:** Hayır
- **İletişim:** Suphi Atılım Çeliköz · suphi.celikoz@gmail.com · telefon numarası kullanıcı tarafından girilecek
- **Notlar (İngilizce):**

```
BenimKasam is a personal record-keeping app for currency and gold holdings. No account or login is required; every feature is available immediately.

How to review:
1. Open the "Ekle" (Add) tab, pick an asset (e.g. "Gram Altın" / Gram Gold), enter an amount and a unit price, and save. The "Kasam" (Vault) tab then shows the current value and profit/loss using live market prices.
2. The ₺ / $ / € switch on the vault card changes the reporting currency. The interface language can be switched to English in "Ayarlar" (Settings).
3. Optional multi-device sync: "QR Oluştur" (Generate QR) shows a pairing QR code and "QR Oku" (Scan QR) scans it with the camera on a second device. Pairing needs two devices and is entirely optional; the app is fully functional without it.
4. App lock: on a device with a passcode, the app asks for Face ID / Touch ID or the device passcode at launch (enabled by default to protect financial records). It can be turned off in "Ayarlar" (Settings) → "Biyometrik Kilit".

Data: transactions are stored on the device. Only if the user explicitly pairs devices via QR are transactions synced through Firebase Realtime Database under a random vault ID with anonymous authentication. No personal information is collected.

Market prices are fetched from public sources through our own server (benim-kasam.vercel.app) for information only. The app provides no investment advice, trading, brokerage or other financial services.
```

## App Gizliliği (gizlilik etiketi)

- **Veri topluyor musunuz?** Evet — yalnızca isteğe bağlı QR senkronu açıldığında cihaz dışına veri çıkar.
- **Finansal Bilgiler → Diğer Finansal Bilgiler** (varlık alım-satım kayıtları): amaç *Uygulama İşlevselliği* · kullanıcının kimliğine bağlı değil · takip için kullanılmıyor
- **Tanımlayıcılar → Kullanıcı Kimliği** (anonim Firebase kimliği): amaç *Uygulama İşlevselliği* · kimliğe bağlı değil · takip için kullanılmıyor
- **Takip (tracking):** Hayır

## Diğer beyanlar

- **Yaş derecelendirmesi:** tüm sorular "Yok / Hayır" → 4+
- **Şifreleme (export compliance):** Info.plist'te `ITSAppUsesNonExemptEncryption = NO` → ek belge gerekmez
- **İçerik hakları:** Üçüncü taraf içeriğe erişiyor (kamuya açık piyasa fiyatları) → Evet, kullanım hakkına sahibim
- **Reklam tanımlayıcısı (IDFA):** Kullanılmıyor (iOS derlemesinde reklam SDK'sı yok)

## Ekran görüntüleri

`store-assets/app-store/screenshots/` — gerçek arayüzden, örnek veriyle 6 ekran (PNG):

- `6.5-inch/` — 1284 × 2778 px. **App Store Connect'e yüklenen set bu**; Apple 6,5" seti tüm iPhone boyutlarında kullanıyor. Sıra önemli (ilk 3'ü kurulum ekranında görünür): tr-1 → tr-6.
- `6.9-inch/` — 1320 × 2868 px (kaynak çekimler; 6,5" set bunlardan küçültüldü).
