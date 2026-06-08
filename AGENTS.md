# AGENTS.md - Shumoukh Roof ERP

## Quick Reference
```bash
npm run dev          # Start dev server
npm run build        # TypeScript compile + Vite build
npm run build:mobile # Build + Capacitor sync
npm run lint         # ESLint check
```

## Project Structure
- `shumoukh-roof/` - Main application
  - `src/` - React source (components, features, hooks, services, store, utils)
  - `dist/` - Build output (serves as Capacitor webDir)
  - `android/`, `ios/` - Native Capacitor projects

## Key Tech Stack
- React 19 + TypeScript 6 + Vite 8
- Capacitor 8 (mobile deployment)
- Firebase (auth, Firestore, storage)
- Zustand (state management)
- BabylonJS (3D rendering)
- Tailwind CSS 4

## Environment Setup
Copy `.env.example` to `.env` and fill Firebase credentials:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Important Notes
- App ID: `com.shumoukh.erp` (Arabic name: شموخ ERP)
- Firebase project: `shumukh-9011f`
- `.wasm` files included in Vite assets
- Mobile builds require: `npm run build:mobile` then open in Android Studio/Xcode
