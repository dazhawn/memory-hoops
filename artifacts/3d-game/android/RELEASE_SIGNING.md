# Release signing (Android)

Google Play only accepts a signed app bundle. This project reads signing
credentials from `android/keystore.properties` (gitignored) or from environment
variables, so nothing secret is ever committed.

**The upload key is not recoverable.** If you lose the `.jks` or forget its
password, you cannot publish another update to the same listing — you would have
to ship a new app with a new package name and lose your installs and reviews.
Back it up somewhere durable before you upload anything.

---

## 1. Generate the upload key (once)

Run this **outside the repository** — for example in a `keys` folder you back up
separately.

```
keytool -genkeypair -v ^
  -keystore memory-hoops-upload.jks ^
  -alias memory-hoops ^
  -keyalg RSA -keysize 2048 -validity 10000 ^
  -dname "CN=Your Name, O=Millionaire Blueprint, L=Your City, S=IN, C=US"
```

`keytool` ships with any JDK. On this machine it is at
`C:\Program Files\Eclipse Adoptium\jre-17.0.8.101-hotspot\bin\keytool.exe`, and
Android Studio's bundled JDK has one too
(`C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`).

It will prompt for a password twice — use a strong one and store it in your
password manager, not in a note beside the file. `-validity 10000` is about 27
years; Play requires a key valid past 2033.

## 2. Point the build at it

Copy `keystore.properties.example` to `keystore.properties` and fill in the four
values:

```
storeFile=C:/Users/you/keys/memory-hoops-upload.jks
storePassword=...
keyAlias=memory-hoops
keyPassword=...
```

Use forward slashes even on Windows. `keystore.properties`, `*.jks`,
`*.keystore` and `*.p12` are all gitignored — verify with
`git check-ignore -v android/keystore.properties` if you want to be sure.

For CI, skip the file and set these environment variables instead:

| Variable | Meaning |
| --- | --- |
| `MH_KEYSTORE_FILE` | Path to the `.jks` |
| `MH_KEYSTORE_PASSWORD` | Keystore password |
| `MH_KEY_ALIAS` | Key alias |
| `MH_KEY_PASSWORD` | Key password |
| `MH_VERSION_CODE` | Optional — overrides `versionCode` |
| `MH_VERSION_NAME` | Optional — overrides `versionName` |

If none of the four credentials are present, the release build still runs but
produces an **unsigned** bundle and prints a warning saying so. Play will reject
that file.

## 3. Build the bundle

From `artifacts/3d-game`:

```
VITE_API_ORIGIN=https://your-api-host pnpm run build:mobile
npx cap sync android
cd android
gradlew bundleRelease
```

The bundle lands at `android/app/build/outputs/bundle/release/app-release.aab`.

Check it is really signed:

```
jarsigner -verify -verbose:summary app-release.aab
```

## 4. Version numbers

Play rejects an upload whose `versionCode` it has already seen, so bump it for
every upload. Either edit `defaultConfig` in `app/build.gradle` or pass
`MH_VERSION_CODE` / `MH_VERSION_NAME` in the environment. `versionCode` is an
integer that only ever goes up; `versionName` is the string users see.

## 5. Play App Signing

Play will offer to manage the app signing key for you. If you accept — which is
the default and generally the right choice — the key you made above becomes your
*upload* key: you sign with it, Play verifies it, then re-signs with the key it
holds. If you ever lose the upload key you can ask Google to reset it, which is
the one escape hatch that exists. Without Play App Signing there is no reset.

## Notes

- `minifyEnabled` is `false` on release. Turning R8 on shrinks the download but
  can break a WebView app in ways that only show at runtime, so test on a device
  before changing it.
- The `.aab` is for Play. For sideloading or a direct download, build
  `gradlew assembleRelease` instead and distribute the `.apk`.
- Never commit the keystore, the properties file, or a screenshot of either.
