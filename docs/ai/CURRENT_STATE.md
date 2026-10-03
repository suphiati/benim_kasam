# Current state
Updated 2026-10-03 · origin/main · Android 1.3.3 (versionCode 19) live; iOS 1.3.3 (16.1) ready in App Store Connect, waiting for a physical-iPhone recording

## Where we left off
- Android: 1.3.3 (versionCode 19) live on Play production since 2026-10-03, full rollout (the public store page shows 1.3.3). Next versionCode: 20.
- Firebase RTDB config: latestVersionCode 19, minVersionCode 0. Member-only vault rules live since 2026-10-03 (rollback file database.rules.phase1-rollback.json).
- Rates come straight from Truncgil with a no-store fetch; Vercel is gone entirely. Privacy policy: https://suphiati.github.io/benim_kasam/gizlilik.html (GitHub Pages, .github/workflows/pages.yml), also used for Play privacy, data deletion and website.
- iOS: App Store Connect version 1.3.3 is "Prepare for Submission" with build 1.3.3 (16.1), Support URL https://suphiati.github.io/benim_kasam/ and App Privacy policy URL on GitHub Pages; auto-release after approval. NOT submitted: Apple's 2.1 rejection of 1.3.1 (2026-09-11, submission afd9d804-44cf-4ced-b595-788c8802e1a8) asks for a screen recording on a physical iPhone. The owner will provide it.
- Repo clean and pushed; artifacts on the owner's Desktop: BenimKasam-1.3.3-19.aab, BenimKasam-1.3.2-test.apk (side-by-side debug build).

## Missing work
1. iOS resubmission, in order, once the owner has an iPhone:
   1. Install BenimKasam 1.3.3 (16.1) on the iPhone through TestFlight (owner's Apple ID as internal tester). The build expires about 90 days after upload (≈2027-01-01); after that, push a new ios-v1.3.x tag and attach the new build.
   2. Record on the latest iOS following the scenario in store-assets/app-store/app-review-2.1-reply.md: app launch, unlock, add a transaction, vault in ₺/$/€, transaction list, settings and export, QR pairing screen, back to the home screen. Move the video to the PC.
   3. App Store Connect → App Review → the rejected submission → Reply to App Review with the English reply from the draft and the video.
   4. Paste the same text into App Review Information → Notes on the 1.3.3 page.
   5. Press Update Review (owner confirms the final click). After approval, check the App Store page and sync on iOS.
2. Owner tests phone-to-phone sync on the live Android build.
3. Raise minVersionCode later (production write, owner go-ahead) so v17 devices that never registered update and pair again.
4. Rules: enum validation for type/assetType once v18+ is widespread.
5. Play edge-to-edge recommendations (not blockers): EdgeToEdge.enable() for Android 14 and older; deprecated window APIs from @capacitor/status-bar, Material Components and the AdMob SDK. Needs a visual check on an Android 14 or older phone.
6. Optional: delete the unused VITE_API_BASE_URL line from .env/.env.example and the GitHub secret.

## Done 2026-10-03
- Sync fix (persisted outbox, reconcile on connect, reconnect on resume) and hardening; rates freeze fixed (Truncgil sends a 10-year cache header); R8 on for release; manual price kept, QR camera no longer restarts, "Delete all" warns about paired devices.
- 1.3.2 (versionCode 18) and 1.3.3 (versionCode 19) shipped the same day; the AD_ID declaration error (an older active build) was ignored for both releases, as for 17.

Verification and history: TEST_STATUS.md, DECISIONS.md, git log.
