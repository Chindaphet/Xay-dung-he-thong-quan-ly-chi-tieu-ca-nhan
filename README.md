# Devo – Personal Expense Management System

Devo is a web-based personal expense management system designed to help users record, monitor, and analyze their income and expenses. It provides financial insights and tools to support better money management and financial discipline.

## Features

- **User Authentication** – Register, log in, and securely manage user accounts.
- **Password Recovery** – Reset forgotten passwords through email.
- **Dashboard** – View financial summaries, income and expense trends, and expense categories.
- **Transaction Management** – Record and manage income and expenses.
- **Category Management** – Organize transactions into categories.
- **Payment Method Management** – Manage payment methods.
- **Budget Management** – Set and monitor spending budgets.
- **Recurring Transactions** – Manage scheduled income and expenses.
- **Multi-language Support** – Vietnamese, English, Thai, and Lao.
- **Responsive Design** – Access the system on desktop, tablet, and mobile devices.

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- i18next

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Token (JWT)
- Nodemailer

## Project Structure

```text
personal-expense-management/
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── database/
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── jobs/
│       ├── middlewares/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Chindaphet/personal-expense-management.git
cd personal-expense-management
```

### 2. Install dependencies

```bash
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root based on `.env.example`.

```bash
copy .env.example .env
```

Update the environment variables with your local PostgreSQL and application configuration.

### 4. Set up the database

Create a PostgreSQL database named `personal_expense`.

Run the SQL migration file:

```text
server/database/migrations/001_initial_schema.sql
```

### 5. Run the application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

## Supported Languages

- Vietnamese (vi)
- English (en)

## Project Status

The project is under development as an academic project.

## License

No license has been specified yet.
