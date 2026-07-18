# Firestore schema for mHub Opportunity Desk

Firestore creates collections when the first document is written; it has no SQL-style `CREATE TABLE` command. This project uses these collections:

| Collection/path | Purpose | Key fields |
| --- | --- | --- |
| `opportunities/{opportunityId}` | Curated donor opportunities | `name`, `focus` (array), `region` (array), `matchScore`, `deadlineAt` (timestamp or `null`), `deadlineLabel`, `status`, `tone` |
| `activities/{activityId}` | mHub programme/activity calendar | `startsAt` (timestamp), `type`, `title`, `description`, `status` |
| `users/{uid}` | Firebase Authentication user profile | `displayName`, `email`, `photoURL`, `createdAt`, `updatedAt` |
| `users/{uid}/savedOpportunities/{opportunityId}` | A user's saved donor opportunity | `opportunityId`, `savedAt`, `notes` |
| `contactRequests/{requestId}` | Private request for a workspace introduction to a donor | `donorId`, `message`, `requesterId`, `status`, `createdAt` |

## One-time setup

Run these commands from the project root. Replace `YOUR_FIREBASE_PROJECT_ID` with the project ID from Firebase Console > Project settings.

```powershell
npm.cmd install --save-dev firebase-tools
npx.cmd firebase login
npx.cmd firebase --project YOUR_FIREBASE_PROJECT_ID deploy --only firestore:rules,firestore:indexes
```

`firebase.json` already points Firebase CLI to the rules and indexes files, so no interactive initialization is required.

Enable **Authentication > Sign-in method > Email/Password** before deploying these rules. The application must use Firebase Authentication; its current local demo sign-in does not send a Firebase user token.

## Add the initial documents

Use a Firebase service account (Firebase Console > Project settings > Service accounts > Generate new private key) to make the seed script an administrator. Do not commit the downloaded key.

```powershell
npm.cmd install --save-dev firebase-admin
$env:FIREBASE_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID"
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\full\path\to\service-account.json"
node scripts/seedFirestore.mjs
```

The seed data is in `seed.firestore.json`. The script converts timestamp fields and `SERVER_TIMESTAMP` markers to native Firestore values.

## Admin writes

The rules allow writes to `opportunities` and `activities` only for Firebase Auth users with the custom claim `admin: true`. Set that claim from a trusted server using the Firebase Admin SDK; never from the browser.

## Optional internet donor discovery with Google

The donor directory searches the private `opportunities` collection directly and does not require a Google or third-party search API. The Google function below is optional and is not used by the directory screen.

The donor finder calls the `discoverOpportunities` Cloud Function in `mhub-c6cec`. It uses Google Programmable Search / Custom Search JSON API, keeping Google credentials out of the browser.

1. In Google Cloud Console for `mhub-c6cec`, enable **Custom Search JSON API** and create an API key.
2. Create a Programmable Search Engine configured to search the web, then copy its Search Engine ID (`cx`).
3. Set the two Firebase secrets:

```powershell
npx.cmd firebase --project mhub-c6cec functions:secrets:set GOOGLE_CUSTOM_SEARCH_API_KEY
npx.cmd firebase --project mhub-c6cec functions:secrets:set GOOGLE_PROGRAMMABLE_SEARCH_ENGINE_ID
npx.cmd firebase --project mhub-c6cec deploy --only functions:discoverOpportunities
```

4. Add this exact value to `.env.local`, then restart the Vite development server:

```powershell
VITE_DISCOVERY_API_URL=https://africa-south1-mhub-c6cec.cloudfunctions.net/discoverOpportunities
```

The donor search function is implemented in JavaScript (`functions/index.js`). Install its dependency before deployment with `cd functions; npm.cmd install; cd ..`. The endpoint accepts `POST { "keywords": "project description" }` and returns donor source websites, snippets, and available location metadata.
