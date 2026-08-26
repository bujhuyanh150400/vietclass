iKit App Icon Generator — https://appicon.ikit.app
Generated entirely in your browser. Your source image was never uploaded.

==================================================
 INSTALL INSTRUCTIONS
==================================================

— iOS / iPadOS —
1. Open your project in Xcode.
2. In the Project navigator, open Assets.xcassets.
3. Delete the existing AppIcon set, then drag the whole
   "AppIcon.appiconset" folder from this ZIP into Assets.xcassets.
   (Contents.json is included, so every slot fills automatically.)

— Android —
1. Copy the folders inside "android/res/" into your module's
   src/main/res/ directory (merge mipmap-* and values/).
2. Adaptive icons (Android 8.0+) are wired via
   mipmap-anydpi-v26/ic_launcher.xml using foreground + background
   + monochrome (Android 13+ themed icons) layers.
3. Legacy ic_launcher.png in each mipmap-* covers Android 7.1 and older.
4. Reference it in AndroidManifest.xml:
     android:icon="@mipmap/ic_launcher"
     android:roundIcon="@mipmap/ic_launcher_round"

— Web / PWA —
1. Copy everything in "web/" to your site root.
2. Paste the contents of "web/head-snippet.html" into your <head>.
3. site.webmanifest references icon-192/512 plus a maskable icon
   for installable PWAs.

==================================================
Need a different size? Re-run at https://appicon.ikit.app