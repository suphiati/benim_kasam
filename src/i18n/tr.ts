/**
 * Türkçe sözlük - i18n'in KAYNAK tablosu.
 *
 * Anahtar eklerken/silerken burası tek doğru kaynak: `TKey` buradan türer ve
 * `en.ts` `Record<TKey, string>` olduğu için eksik İngilizce karşılık DERLEME
 * hatası verir. Sadece burada anahtar eklemek yetmez, en.ts'i de doldur.
 *
 * Çoğul: `x_one` / `x_other` çifti + tp('x', n). Türkçe sayıdan sonra çoğul
 * yapmadığı için iki form da AYNI metindir - CLDR yine de tr'ye one/other
 * verdiği için mekanizma çalışır, İngilizcede formlar ayrışır.
 *
 * Cümle parçası anahtarı YAPMA. 'Alış' + ' Fiyatı' gibi birleştirmeler
 * İngilizcede kelime sırası değiştiği için bozulur; her dal için TAM anahtar aç.
 */
export const tr = {
  // ---- Sekmeler ----
  'nav.vault': 'Kasam',
  'nav.add': 'Ekle',
  'nav.transactions': 'İşlemler',
  'nav.settings': 'Ayarlar',

  // ---- Başlık çubuğu ----
  'header.refresh': 'Kurları Güncelle',
  'header.ratesUnavailable': 'Kur verileri alınamadı',
  'header.retry': 'Tekrar dene',
  // {timeAgo} Intl.RelativeTimeFormat'tan hazır gelir - burada birleştirme yok.
  'header.market': 'Piyasa: {timeAgo}',
  'header.marketStale': 'Piyasa: {timeAgo} (piyasalar kapalı)',

  // ---- Ortak ----
  'common.loading': 'Yükleniyor...',
  'common.cancel': 'İptal',
  'common.delete': 'Sil',
  'common.edit': 'Düzenle',
  'common.close': 'Kapat',
  'common.ok': 'Tamam',
  'common.error': 'Hata',

  // ---- Kasa sayfası ----
  'vault.synced': 'Senkron',
  'vault.notConnected': 'Bağlantı yok',
  'vault.empty': 'Kasanız Boş',
  // {tab} = sekme adı (nav.add). Sekme adı çevrilince bu cümle de takip etsin diye
  // enterpolasyon; sabit "Ekle" yazsaydık ikisi sessizce desenkron olurdu.
  'vault.emptyHint': 'İlk varlığınızı eklemek için "{tab}" sekmesine gidin.',
  'vault.qrGenerate': 'QR Oluştur',
  'vault.qrScan': 'QR Oku',
  'vault.myAssets_one': 'Varlıklarım ({n} kalem)',
  'vault.myAssets_other': 'Varlıklarım ({n} kalem)',
  'vault.liveRates': 'Güncel Kurlar',
  // Piyasa kapalıyken (hafta sonu / kapanış) canlı fiyat gelmez; değerler kapanış
  // öncesi son TAM veriye göredir. Bu uyarı yalnızca o durumda gösterilir.
  'vault.marketClosedNotice': 'Piyasalar kapalı. Değerler, piyasa kapanmadan önceki son verilere göredir.',
  'vault.totalValue': 'Toplam Kasa Değeri',
  'vault.currencyLabel': 'Kasa para birimi',
  'vault.totalCost': 'Toplam Maliyet',
  'vault.totalPL': 'Toplam K/Z',
  'vault.realizedPL': 'Gerçekleşen K/Z',
  'vault.unrealizedPL': 'Gerçekleşmemiş K/Z',
  'vault.realizedInline': 'Gerçekleşen: {value}',
  'vault.unrealizedInline': 'Gerçekleşmemiş: {value}',
  'vault.avgCost': 'Ort. Maliyet',
  'vault.currentPrice': 'Güncel Fiyat',
  'vault.currentValue': 'Güncel Değer',

  // ---- Birimler ----
  // SADECE ekranda görünen birim. Rozet (Au/Ag/$/CH...) ASSET_CONFIG.unit'ten
  // türer ve ÇEVRİLMEZ. Semboller ve 'gr' evrensel - anahtara gerek yok.
  'unit.pcs': 'adet',

  // ---- Varlık adları (AssetType ile birebir) ----
  'asset.USD': 'Amerikan Doları',
  'asset.EUR': 'Euro',
  'asset.GBP': 'İngiliz Sterlini',
  'asset.CHF': 'İsviçre Frangı',
  'asset.CAD': 'Kanada Doları',
  'asset.AUD': 'Avustralya Doları',
  'asset.JPY': 'Japon Yeni',
  'asset.SAR': 'Suudi Riyali',
  'asset.AED': 'BAE Dirhemi',
  'asset.RUB': 'Rus Rublesi',
  'asset.CNY': 'Çin Yuanı',
  'asset.NOK': 'Norveç Kronu',
  'asset.SEK': 'İsveç Kronu',
  'asset.KWD': 'Kuveyt Dinarı',
  'asset.BGN': 'Bulgar Levası',
  'asset.GEL': 'Gürcistan Larisi',
  'asset.GRAM_ALTIN': 'Gram Altın',
  'asset.CEYREK_ALTIN': 'Çeyrek Altın',
  'asset.YARIM_ALTIN': 'Yarım Altın',
  'asset.TAM_ALTIN': 'Tam Altın',
  'asset.CUMHURIYET_ALTINI': 'Cumhuriyet Altını',
  'asset.ATA_ALTIN': 'Ata Altın',
  'asset.AYAR14_ALTIN': '14 Ayar Altın',
  'asset.AYAR22_BILEZIK': '22 Ayar Bilezik',
  'asset.GUMUS': 'Gümüş',

  // ---- İşlemler ----
  'tx.title': 'İşlemlerim ({n})',
  'tx.filterAll': 'Tümü',
  'tx.filterBuys': 'Alımlar',
  'tx.filterSells': 'Satımlar',
  'tx.summary_one': 'Filtrelenmiş Özet ({n} işlem)',
  'tx.summary_other': 'Filtrelenmiş Özet ({n} işlem)',
  // Miktarlı/miktarsız ayrı TAM anahtar: parantezli eki koşullu birleştirmek
  // İngilizcede tekil/çoğul ile birlikte bozulur.
  'tx.buyCount_one': '{n} alım',
  'tx.buyCount_other': '{n} alım',
  'tx.buyCountWithAmount_one': '{n} alım ({amount} {unit})',
  'tx.buyCountWithAmount_other': '{n} alım ({amount} {unit})',
  'tx.sellCount_one': '{n} satım',
  'tx.sellCount_other': '{n} satım',
  'tx.sellCountWithAmount_one': '{n} satım ({amount} {unit})',
  'tx.sellCountWithAmount_other': '{n} satım ({amount} {unit})',
  'tx.badge.buy': 'ALIM',
  'tx.badge.sell': 'SATIM',
  'tx.amount': 'Miktar',
  'tx.priceLabel.buy': 'Alış Fiyatı',
  'tx.priceLabel.sell': 'Satış Fiyatı',
  'tx.total': 'Toplam',
  'tx.approxTitle': 'Kur damgası yok, bugünkü kurla yaklaşık gösteriliyor',
  'tx.empty': 'Henüz İşlem Yok',
  'tx.emptyHint': 'İlk işleminizi eklemek için "{tab}" sekmesine gidin.',
  'tx.noMatch': 'Bu filtrelere uygun işlem bulunmuyor.',
  'tx.deleteTitle': 'İşlemi Sil',
  'tx.deleteMessage': 'Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  'tx.editTitle': 'İşlemi Düzenle',

  // ---- Form ----
  'form.pageTitle': 'Yeni İşlem Ekle',
  'form.buy': 'Alım',
  'form.sell': 'Satım',
  'form.assetType': 'Varlık Tipi',
  'form.date': 'Tarih',
  'form.amount': 'Miktar',
  // {sym} = CURRENCY_META.TRY.symbol. Giriş her zaman ₺ (taban para sadece raporlama).
  'form.priceLabel.buy': 'Alış Fiyatı ({sym})',
  'form.priceLabel.sell': 'Satış Fiyatı ({sym})',
  'form.total.buy': 'Toplam Maliyet:',
  'form.total.sell': 'Toplam Gelir:',
  'form.note': 'Not (opsiyonel)',
  'form.notePlaceholder': "Ör: Vakıfbank'tan alındı",
  'form.submit.buy': 'Alımı Kaydet',
  'form.submit.sell': 'Satımı Kaydet',
  'form.submit.update': 'Güncelle',
  'form.clear': 'Temizle',
  'form.group.currencies': 'Dövizler',
  'form.group.gold': 'Altın',
  'form.group.commodity': 'Değerli Maden',
  'form.group.frequent': 'Sık Kullanılanlar',

  // ---- Ayarlar ----
  'settings.title': 'Ayarlar',
  'settings.installTitle': 'Uygulamayı Yükle',
  'settings.installDesc': 'Ana ekranınıza ekleyerek daha hızlı erişin',
  'settings.currency': 'Para Birimi',
  // {sym} düz metne gömülü değil: CURRENCY_META.TRY.symbol'den gelir.
  'settings.currencyDesc': 'Kasanızın raporlanacağı para birimi. İşlem girişi {sym} olarak kalır.',
  'settings.language': 'Dil',
  'settings.languageDesc': 'Uygulama dili',
  'settings.biometric': 'Biyometrik Kilit',
  'settings.biometricDesc': 'Uygulamayı açarken parmak izi / yüz veya PIN iste',
  'settings.sync': 'Senkronizasyon',
  'settings.syncConnected': 'Bağlı - Otomatik senkronizasyon aktif',
  'settings.syncDisconnected': 'Bağlantı kurulamadı',
  'settings.vaultId': 'Kasa ID',
  'settings.unpair': 'Eşleştirmeyi Kaldır',
  'settings.unpairDesc': 'Cihazlar arası senkronizasyonu durdur',
  'settings.unpairMessage': 'Cihazlar arası otomatik senkronizasyon durdurulacak. Yerel verileriniz silinmez.',
  'settings.unpairConfirm': 'Kaldır',
  'settings.data': 'Veri Yönetimi',
  'settings.dataCount_one': 'Toplam {n} işlem kaydı',
  'settings.dataCount_other': 'Toplam {n} işlem kaydı',
  'settings.export': 'Verileri Dışa Aktar',
  'settings.exportDesc': 'Tüm işlemlerinizi JSON dosyası olarak kaydedin',
  'settings.import': 'Verileri İçe Aktar',
  'settings.importDesc': 'Daha önce dışa aktarılmış JSON dosyasını yükleyin',
  'settings.importOk': 'Başarıyla içe aktarıldı!',
  'settings.importError': 'Hata: Dosya okunamadı veya geçersiz format.',
  'settings.exportError': 'Hata: Dışa aktarma tamamlanamadı.',
  'settings.clear': 'Tüm Verileri Sil',
  'settings.clearDesc': 'Bu işlem geri alınamaz',
  'settings.clearMessage': 'Tüm işlem kayıtlarınız kalıcı olarak silinecek. Bu işlem geri alınamaz!',
  'settings.clearConfirm': 'Hepsini Sil',
  'settings.tagline': 'Kişisel Kasa Takip Uygulaması',

  // ---- QR / eşleştirme ----
  'qr.pairTitle': 'QR ile Eşleştir',
  'qr.uploading': 'Veriler yükleniyor...',
  'qr.synced_one': '{n} işlem senkronize edildi',
  'qr.synced_other': '{n} işlem senkronize edildi',
  'qr.scanHint': "Diğer telefondaki BenimKasam'dan bu QR'ı okutun",
  'qr.share': 'Paylaş',
  'qr.showToCamera': 'QR kodu kameraya gösterin',
  'qr.connecting': 'Bağlanıyor...',
  'qr.connectingDesc': 'Veriler senkronize ediliyor',
  'qr.successTitle': 'Eşleştirme Başarılı!',
  'qr.successDesc': 'Cihazlar senkronize edildi. Artık yapılan değişiklikler otomatik olarak diğer cihaza aktarılacak.',
  'qr.errorOldFormat': 'Bu eski formatta bir QR kodu. Lütfen diğer cihazda yeni QR oluşturun.',
  'qr.errorInvalid': 'Geçersiz QR kodu. BenimKasam QR kodu olduğundan emin olun.',
  'qr.errorCamera': 'Kamera açılamadı. Tarayıcı ayarlarından kamera iznini kontrol edin.',

  // ---- Kilit (BiometricLock + native dialog metinleri) ----
  'lock.subtitle': 'Kasanız kilitli',
  'lock.verifying': 'Doğrulanıyor...',
  'lock.unlock': 'Kilidi Aç',
  'lock.failed': 'Doğrulama başarısız. Tekrar deneyin.',
  'lock.reason': 'Kasanıza erişmek için kimliğinizi doğrulayın',
  'lock.iosFallback': 'Şifre kullan',
  'lock.androidSubtitle': 'Kimliğinizi doğrulayın',

  // ---- PWA yükleme rehberi ----
  // DİKKAT: adım metinleri GERÇEK işletim sistemi buton adlarını alıntılar.
  // İngilizcesi birebir çeviri DEĞİL, iOS/Android'in kendi İngilizce metnidir.
  'install.title': 'Uygulamayı Telefonuna Yükle',
  'install.subtitleAuto': 'Ana ekrandan hızlıca aç',
  'install.subtitleIos': '3 kolay adımda kur',
  'install.subtitleAndroid': '2 kolay adımda kur',
  'install.action': 'Yükle',
  'install.ios.step1': "Safari'de alttaki paylaş butonuna bas",
  'install.ios.step2': '"Ana Ekrana Ekle" seçeneğini bul',
  'install.ios.step3': '"Ekle" butonuna bas',
  'install.android.step1Samsung': 'Tarayıcı menüsünden (≡)',
  'install.android.step1Other': 'Sağ üstteki 3 noktaya (⋮) bas',
  'install.android.step2': '"Ana ekrana ekle" veya "Uygulamayı yükle" seçeneğine bas',

  // ---- Uygulama güncelleme (native in-app update) ----
  'update.optionalTitle': 'Güncelleme mevcut',
  'update.optionalDesc': 'Uygulamanın yeni bir sürümü var. Daha iyi bir deneyim için güncelleyin.',
  'update.forcedTitle': 'Güncelleme gerekli',
  'update.forcedDesc': 'Devam edebilmek için uygulamayı en son sürüme güncellemeniz gerekiyor.',
  'update.action': 'Güncelle',
  'update.later': 'Daha sonra',
  'update.updating': 'Güncelleniyor...',
} as const;

export type TKey = keyof typeof tr;
