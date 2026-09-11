# Appshop Publication Readiness Prompt

You are an expert software engineer and release automation specialist.
Your goal is to prepare this repository for 1-click publication and automated distribution on **Appshop** (the modern macOS & cross-platform app store).

Appshop automatically reads repository metadata, release binaries, icons, and visual assets directly from GitHub without requiring manual file uploads or custom hosting buckets.

Follow the instructions below to organize the repository files, artwork, metadata, and release automation.

---

## 1. Directory Structure & Visual Assets

Ensure the repository contains the following standard folder structure and asset conventions:

### A. App Icon
Appshop requires a high-resolution PNG icon:
- **For native macOS / Xcode projects**:
  - Keep your `AppIcon.appiconset` containing `icon_512x512@2x.png` (1024×1024) or `icon_512x512.png`.
- **For other projects (Electron, Tauri, Flutter, Go, Python, Web/PWA)**:
  - Place a 512×512 or 1024×1024 PNG at `docs/icon.png` or `assets/icon.png` (or `art/icon.png`).

### B. Showcase Banner
Appshop uses this banner for your store card header and the hero spotlight:
- **Recommended location**: `art/banner.png` (also accepts `assets/banner.png`, `media/banner.png`, or `cover.png`).
- **Recommended dimensions**: **1200 × 630 px** (or 16:9 ratio, min 1000px wide).
- **Format**: PNG, WebP, or high-quality JPG.
- **Content**: Showcase UI preview, clean branding typography, or key product screenshot with ambient background.

### C. Screenshot Gallery
Appshop displays up to 6 gallery screenshots on your app details page:
- **Recommended location**: `screenshots/` (also accepts `docs/screenshots/` or `assets/screenshots/`).
- **Filename convention**: Number them sequentially so they display in order:
  - `screenshots/01-main.png` (Main application window / core workflow)
  - `screenshots/02-feature.png` (Key features / secondary view)
  - `screenshots/03-preferences.png` (Settings / customizations)
  - `screenshots/04-darkmode.png` (Alternative themes or states)
- **Format**: High-resolution PNG or WebP screenshots.

---

## 2. Release Asset Naming Scheme

Appshop's download router automatically resolves user architecture and platform from your GitHub Release asset filenames:

| Target Platform / Architecture | Recommended Asset Filename Pattern |
| :--- | :--- |
| **macOS Universal (Intel + Apple Silicon)** | `<AppName>-<Version>-universal.dmg` *(Recommended)* |
| **macOS Apple Silicon (M1/M2/M3/M4)** | `<AppName>-<Version>-arm64.dmg` (or `-apple-silicon.dmg`) |
| **macOS Intel** | `<AppName>-<Version>-x86_64.dmg` (or `-intel.dmg`) |
| **macOS Archive / PKG** | `<AppName>-<Version>-universal.zip` or `.pkg` |
| **Windows** | `<AppName>-<Version>-setup.exe` or `.msi` |
| **Linux** | `<AppName>-<Version>-amd64.AppImage` or `.deb` |

> **Important**: Tag releases semantically (e.g. `v1.0.0` or `1.0.0`). Ensure the latest release is published as a public release (not draft) with binary assets attached.

---

## 3. Repository Metadata & README

Appshop automatically pulls your listing text from GitHub:
1. **Repository Description**:
   - Set a punchy 1-line description (under 100 characters). This becomes your app's tagline in Appshop cards.
2. **Repository Topics / Tags**:
   - Add up to 6 relevant GitHub topics:
     - Platform: `macos`, `pwa`, `cross-platform`
     - Category: `productivity`, `developer-tools`, `utilities`, `menu-bar`, `audio`, `design`
     - Technology: `swift`, `rust`, `electron`, `tauri`, `react`
3. **README.md**:
   - Make sure your `README.md` begins with an H1 app title, a clear paragraph explaining what the app does, and bullet points of key features.
   - Appshop renders your README on the app listing page with relative image paths automatically resolved.

---

## 4. GitHub Actions Release Automation (Optional)

If this repository does not already have automated release publishing, create `.github/workflows/release.yml`:
- Trigger on tag pushes (`v*.*.*`).
- Build the binary.
- Attach the notarized/signed `.dmg`, `.pkg`, or `.zip` to the GitHub Release.

---

## 5. Verification Checklist

Before publishing on Appshop, verify:
- [ ] Icon is located at `AppIcon.appiconset`, `docs/icon.png`, or `assets/icon.png`.
- [ ] Banner is located at `art/banner.png` or `assets/banner.png`.
- [ ] Screenshots are placed in `screenshots/` (e.g. `01-overview.png`).
- [ ] Latest release has tagged assets matching the architecture naming scheme.
- [ ] Repo has a clear description and relevant topics.

Ready! Go to your Appshop instance and connect your repository.
