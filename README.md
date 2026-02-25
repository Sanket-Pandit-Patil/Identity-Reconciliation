# Bitespeed Identity Reconciliation Backend

This is a backend service built for the **Bitespeed Backend Task – Identity Reconciliation**.

The service consolidates multiple contact records (email and phone number) into a single unified customer identity based on reconciliation rules defined in the assignment.

---

## 🚀 Live Deployment

**Base URL:**  
https://identity-reconciliation-or8i.onrender.com

### Identify Endpoint
**POST**  
https://identity-reconciliation-or8i.onrender.com/identify

### Example Request

```bash
curl -X POST https://identity-reconciliation-or8i.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

### Example Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

## 🚀 Tech Stack

- **Node.js** with **TypeScript**
- **Express**
- **Knex.js**
- **SQLite** (Local Development)
- **PostgreSQL** (Production - Render Hosted)

---

## 📂 Project Structure

```
Identity-Reconciliation/
│
├── src/
│   ├── db.ts
│   ├── index.ts
│   └── tests/
│       ├── directTest.js
│       └── apiTest.js
│
├── migrations/
│   └── 20231027000000_create_contacts_table.js
│
├── knexfile.js
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

---

## 🛠️ Setup Instructions (Local Development)

### 1️⃣ Install Dependencies

```bash
npm install
```

---

### 2️⃣ Run Database Migrations

```bash
npm run migrate
```

This creates the `Contact` table in the local SQLite database.

---

### 3️⃣ Start the Server

```bash
npm run dev
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

### Request Body (JSON Only)

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

At least one of the following must be provided:

- `email`
- `phoneNumber`

⚠️ The API strictly accepts **JSON body**, not form-data.

---

## 📤 Success Response (200 OK)

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
- The **oldest contact (by createdAt)** is always the primary contact.
- If new information is introduced, a new **secondary contact** is created.
- If two primary contacts become linked, the oldest remains primary and the newer becomes secondary.
- All reconciliation logic runs inside a **database transaction** to prevent race conditions.
- The response format strictly follows the assignment specification.

---

## 🧪 Testing

### 1️⃣ Direct Database Logic Test

```bash
npm run test:direct
```

Tests reconciliation logic directly using database transactions.

---

### 2️⃣ API-Level Test

Start the server first:

```bash
npm run dev
```

Then in another terminal:

```bash
npm run test:api
```

---

## 🧪 Manual Testing (Local cURL Example)

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

---

## 🌐 Production Deployment

The application is deployed on **Render** using:

- PostgreSQL (Render managed database)
- Environment-based configuration
- Production-ready build with TypeScript compilation

---

## ✅ Assignment Compliance Checklist

This implementation:

- ✔ Uses a SQL database
- ✔ Enforces oldest-contact-as-primary rule
- ✔ Handles primary-to-secondary conversion correctly
- ✔ Uses database transactions for data integrity
- ✔ Returns response in the required format
- ✔ Accepts JSON body (not form-data)
- ✔ Is deployed and publicly accessible
- ✔ Includes test scripts for validation

---

## 📌 Notes

- SQLite is used for simplicity in local development.
- PostgreSQL is used in production.
- The application is structured for clarity, maintainability, and scalability.
- The system design allows easy database switching via environment configuration.

---

**Author:** Sanket Patil  
GitHub: https://github.com/Sanket-Pandit-Patil/Identity-Reconciliation
