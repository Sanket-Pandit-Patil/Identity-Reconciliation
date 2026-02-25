# Bitespeed Identity Reconciliation Backend

This is a backend service built for the **Bitespeed Backend Task – Identity Reconciliation**.

The service consolidates multiple contact records (email and phone number) into a single unified customer identity.

---

## 🚀 Tech Stack

- **Node.js** with **TypeScript**
- **Express**
- **Knex.js**
- **SQLite (SQL database)**

---

## 📂 Project Structure

```
BiteSpeed-Backend/
│
├── src/
│   ├── db.js
│   ├── index.ts
│   └── tests/
│       ├── directTest.js
│       └── apiTest.js
│
├── migrations/
│   └── 20231027000000_create_contacts_table.ts
│
├── dev.sqlite3
├── knexfile.js
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

---

## 🛠️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

---

### 2️⃣ Run Database Migrations

```bash
npm run migrate
```

This creates the `Contact` table in SQLite.

---

### 3️⃣ Start the Server

```bash
npm start
```

Server will run at:

```
http://localhost:3000
```

---

## 📌 API Endpoint

### POST `/identify`

This endpoint reconciles contact details and returns a consolidated identity.

---

### Request Body

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

At least one of:
- `email`
- `phoneNumber`

must be provided.

---

### Success Response (200 OK)

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [23]
  }
}
```

---

## 🔍 Identity Resolution Rules

- Contacts are linked if they share the same **email OR phoneNumber**.
- The **oldest contact (by createdAt)** is always the primary.
- New information results in creation of a secondary contact.
- If two primary contacts become linked, the oldest remains primary and the newer becomes secondary.
- All reconciliation logic runs inside a database transaction to prevent race conditions.
- Response format strictly follows the assignment requirements.

---

## 🧪 Testing

### Direct Database Logic Test

```bash
npm run test:direct
```

This tests reconciliation logic directly using database transactions.

---

### API-Level Test

Start the server first:

```bash
npm start
```

Then in another terminal:

```bash
npm run test:api
```

---

## 🧪 Manual Testing (cURL Example)

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

---

## ✅ Assignment Compliance

This implementation:

- Uses a SQL database
- Enforces oldest-contact-as-primary rule
- Handles primary-to-secondary conversion
- Uses database transactions for safety
- Returns response in required format
- Accepts JSON body (not form-data)
- Includes test scripts for verification

---

## 📌 Notes

- SQLite is used for simplicity in local development.
- The system can be easily switched to PostgreSQL for production deployment.
- The application is structured for clarity, maintainability, and scalability.