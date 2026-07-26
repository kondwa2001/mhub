# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Environment setup

This project uses Vite environment variables for Firebase configuration. A shared `.env` file is included in this repo so collaborators can run the app after pulling.

If you need a local override, create a `.env.local` file in the project root.

A convenient way to start is:

```bash
cp .env.example .env
```

or:

```bash
cp .env.example .env.local
```

Then replace the placeholder values with your actual Firebase project values.

Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Optional but recommended:

- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Admin accounts

Ticking "Register as an mHub administrator" on the sign-up form sets a `role: 'admin'`
flag on that profile, which unlocks the Admin dashboard tab (all collaborators, all
donors, and what each donor funds). Anyone can self-select this at sign-up.

This is a workspace-level flag only, not a security boundary. It does **not** grant the
Firebase custom claim (`request.auth.token.admin`) that `firestore.rules` actually requires
to create, update, or delete opportunities, activities, or collaborators; that still has to
be set via the Firebase Admin SDK or console for accounts that need real curation rights.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
