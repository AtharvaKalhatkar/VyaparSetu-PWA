# 🌉 Vyapar Setu — Offline-First Business Management & ERP Ecosystem

> **An Offline-First, Cloud-Synchronized Business Management and ERP Platform Tailored for Indian Small & Medium Enterprises (SMEs).**

---

## 🚀 1. Elevator Pitch (30-Second Overview)

**Vyapar Setu** is a modern, all-in-one business management and billing application tailored specifically for Indian shopkeepers, wholesalers, distributors, and service providers. It replaces traditional paper registers and complex legacy desktop software (like Tally or Busy) with an intuitive mobile app and Progressive Web Application (PWA).

It seamlessly handles GST billing, multi-unit stock tracking, customer ledgers (*Udhari*), Smart OCR bill scanning, WhatsApp payment reminders, bank/cash reconciliation, and GST reporting. Crucially, it features a **100% offline-first architecture**, ensuring business operations never pause even during internet outages.

---

## ⚡ 2. Problem Statement & Solution

| Problem in Indian SMEs | How Vyapar Setu Solves It |
| :--- | :--- |
| **Complex, Outdated Desktop ERPs** (Tally/Busy) requiring heavy staff training & dedicated hardware. | **Intuitive Mobile & Web App** with zero learning curve and modern UI design. |
| **Poor Internet Connectivity** in stores/warehouses causing checkout delays and lost sales. | **Offline-First Architecture**: Instant local saves with automatic background cloud synchronization. |
| **Manual Paper Billing** leading to calculation errors in GST tax rates and stock counts. | **Automated Tax Engine**: Instant GST calculation (CGST, SGST, IGST), multi-unit conversions & professional invoice generation. |
| **Pending Payments (Udhari)** forgotten or delayed due to poor ledger tracking. | **Centralized Party Ledger**: Real-time balance sheets with automated WhatsApp payment reminder links. |
| **Manual Data Entry** of physical vendor purchase bills taking hours. | **Smart Purchase OCR**: Scan paper vendor bills with a camera to auto-populate digital purchase entries in seconds. |

---

## 📦 3. Core Modules & Feature Breakdown

### 🧾 [1] Invoicing & Smart Billing Engine
- **Multi-Document Workflow**: Full support for Sales Invoices, Purchase Bills, Sales & Purchase Orders, Quotations/Estimates, Sale/Purchase Returns, and Delivery Challans / Load Sheets.
- **Flexible Billing & Hardware Support**: Integrated camera barcode scanning and physical hardware scanner support, line-item discounts, auto-calculated GST, and customizable extra charges (shipping, packaging).
- **6 Professional Invoice Themes**: Standard, Compact, Detailed, Classic, Modern, and Premium layouts with custom business branding (logo, theme color, terms & bank details).
- **Instant Sharing & Printing**: One-click PDF generation, direct thermal & A4 printer support, and instant direct WhatsApp sharing.

### 📦 [2] Advanced Inventory & Stock Management
- **Multi-Unit Conversion**: Buy items in bulk (e.g., Box of 12 or Carton of 50) and sell in retail units (Pcs, Kg, Ltr) with auto-calculated rates and stock deduction.
- **Batch & Expiry Tracking**: Track batch numbers, manufacturing dates, and expiration dates for perishable or FMCG/pharmaceutical goods.
- **Visual Stock Level Alerts**: Color-coded stock indicators (**Red** for Out of Stock, **Amber** for Low Stock, **Green** for In Stock).
- **Stock Adjustments**: Quick manual inventory additions and reductions with mandatory audit reason logging.

### 🤝 [3] Party Ledger & Credit Tracking (Udhari)
- **Customer & Supplier Directory**: Dedicated profiles with full contact details, GSTIN, PAN, and customizable credit limits.
- **Real-Time Balance Sheet**: Instant visibility into total **"To Receive" (Debit)** and **"To Pay" (Credit)** balances.
- **One-Click Payment Recording**: Track payment entries via UPI, Cash, Bank Transfer, or Cheque with reference tracking.
- **Automated WhatsApp Reminders**: Generate pre-formatted payment reminder messages with total pending amount and invoice breakdowns.

### 🔍 [4] Smart Purchase OCR (AI Bill Scanner)
- **OCR Engine**: Powered by `Tesseract.js` client-side image processing.
- **Paper-to-Digital**: Snap a picture of physical vendor invoices to automatically extract line items, quantities, rates, supplier details, and totals into digital purchase bills.

### 💵 [5] Banking, Cashbook & DayBook
- **Multi-Account Management**: Track Bank Accounts, Cash-in-Hand, and Digital Wallets (Paytm, PhonePe, Google Pay).
- **DayBook Summary**: Daily cashflow statement showing opening balance, cash-in collections, payments out, and net closing balance.
- **Inter-Account Transfers**: Record seamless funds transfers between Cash, Bank, and Digital Wallets.

### 📊 [6] GST, Financial Reports & Analytics
- **Sales & Purchase Analytics**: Real-time revenue insights, 7-day sales trend graphs, top-selling items, and overdue debt reports.
- **Profit & Loss (P&L)**: Instant Gross and Net profit calculations for custom date ranges.
- **GST Returns Ready**: Generate itemized GSTR-1 sales data and summarized GSTR-3B tax reports.
- **Full Data Portability**: Complete CSV and JSON data export and import capabilities.

### 💼 [7] CRM, Employee Payroll & Delivery Operations
- **CRM Lead Pipeline**: Visual lead tracking stages (*New, Contacted, Qualified, Negotiation, Won, Lost*).
- **Employee Payroll**: Staff profile management, monthly salary structures, joining dates, and attendance tracking.
- **Delivery Load Sheets**: Consolidate multiple customer invoices into single vehicle delivery load sheets with driver assignment.

---

## 🛠️ 4. Technology Stack & Architecture

```
                 +-------------------------------------------------------+
                 |                     CLIENT LAYER                      |
                 |  +-----------------------+  +----------------------+  |
                 |  | Progressive Web App   |  | Mobile App (Android) |  |
                 |  | (React, Vite, TS,     |  | (React Native, Expo, |  |
                 |  |  LocalStorage DB)     |  |  WatermelonDB)       |  |
                 |  +-----------+-----------+  +----------+-----------+  |
                 +--------------|-------------------------|--------------+
                                |  Offline First / Sync   |
                                v                         v
                 +-------------------------------------------------------+
                 |              INFRASTRUCTURE & PROXY LAYER             |
                 |                 Nginx Reverse Proxy                   |
                 +--------------------------+----------------------------+
                                            | REST API
                                            v
                 +-------------------------------------------------------+
                 |                   BACKEND API LAYER                   |
                 |        Spring Boot 3.3 (Java 21) & Spring Security    |
                 |               (JWT Auth & Role-Based RBAC)            |
                 +--------+---------------------+-------------------+----+
                          |                     |                   |
                          v                     v                   v
                 +------------------+  +-----------------+  +------------------+
                 |  PostgreSQL 15   |  |   Redis Cache   |  |     RabbitMQ     |
                 | (Flyway Migrations)| | (Session Store) |  | (Async Sync Queue)|
                 +------------------+  +-----------------+  +------------------+
```

### 💻 Front-End & Mobile
* **PWA**: React 18, TypeScript, Vite, Custom CSS Design System, LocalStorage DB engine, Tesseract.js.
* **Mobile**: React Native, Expo, WatermelonDB (reactive local SQLite database for offline performance).

### ⚙️ Backend API
* **Core Framework**: Java 21, Spring Boot 3.3
* **Security**: JWT Authentication, Role-Based Access Control (RBAC)
* **Database**: PostgreSQL 15 with Flyway database migration scripts (`V1__initial_schema.sql` to `V3`)
* **Caching & Messaging**: Redis (Session & Caching) & RabbitMQ (Asynchronous Event Processing & Sync)
* **API Documentation**: OpenAPI 3.0 / Swagger UI

### 🐳 DevOps & Deployment
* **Containerization**: Docker & Docker Compose
* **Web Server**: Nginx Reverse Proxy
* **CI/CD**: GitHub Actions workflows (`backend-ci.yml`, `mobile-ci.yml`, `deploy.yml`)

---

## 📁 5. Monorepo Project Structure

```
vyapar-setu/
├── backend/                    # Spring Boot REST API Service
│   ├── src/main/java/com/vyaparsetu/
│   │   ├── config/             # Security, Web & OpenAPI Configuration
│   │   ├── security/           # JWT Tokens, Security Filters & RBAC
│   │   ├── common/             # Base Entity, Global Exception Handling & API Response Wrappers
│   │   ├── entity/             # JPA Entities (33 Core Business Entities)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── service/            # Business Logic Layer (23 Services)
│   │   ├── controller/         # REST API Controllers (21 Controllers)
│   │   └── dto/                # Data Transfer Objects & MapStruct Mappers
│   └── src/main/resources/
│       ├── application.yml     # Application Configurations
│       └── db/migration/       # Flyway Database Migration Scripts (V1-V3)
├── pwa/                        # Progressive Web Application (React + Vite)
│   └── src/
│       ├── pages/              # Invoicing, Inventory, Party Ledger & Report Pages
│       ├── context/            # Business, Auth & Notification Contexts
│       ├── store/              # App State Management
│       ├── verticals/          # Retail, Wholesale & Service Vertical Modules
│       └── utils/              # OCR, Invoice Themes, PDF & WhatsApp Helpers
├── mobile/                     # Cross-Platform Mobile App (React Native + Expo)
│   └── src/
│       ├── app/                # Expo Router Navigation & Screen Routes
│       ├── screens/            # Mobile Business Feature Screens
│       ├── components/         # Reusable Mobile UI Components
│       ├── services/           # Offline API & WatermelonDB Sync Engines
│       └── store/              # Zustand State Stores
├── nginx/                      # Nginx Reverse Proxy Configurations
├── docker-compose.yml          # Local Development Environment Compose File
├── docker-compose.prod.yml     # Production Deployment Compose File
└── .github/workflows/          # CI/CD Build & Deployment Pipelines
```

---

## 🚦 6. Quick Start Guide

### Prerequisites
* **Java 21 JDK** & Maven 3.9+
* **Node.js 18+** & npm
* **Docker** & Docker Compose

---

### Option A: Run Full Stack via Docker Compose

To start all services (PostgreSQL, Redis, RabbitMQ, Backend API, and Nginx):

```bash
docker-compose up -d --build
```

---

### Option B: Run Services Individually

#### 1. Backend Service (Spring Boot)

```bash
# 1. Start required infrastructure containers
docker-compose up -d postgres redis rabbitmq

# 2. Navigate to backend directory and start Spring Boot
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

> **Backend API Server**: Runs on `http://localhost:8080`  
> **Swagger API Docs**: `http://localhost:8080/swagger-ui.html`

#### 2. Progressive Web Application (PWA)

```bash
cd pwa
npm install
npm run dev
```

> **PWA Web App**: Runs on `http://localhost:5173`

#### 3. Mobile Application (React Native + Expo)

```bash
cd mobile
npm install
npx expo start
```

> Scan the QR code using the **Expo Go** app on Android or iOS.

---

## 📄 7. API Documentation

When the backend service is running, explore and test the interactive API endpoints:
* **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI Specs**: `http://localhost:8080/v3/api-docs`

---

## 📜 8. License & Credits

* **Platform**: Vyapar Setu
* **Developer**: LogicSync Digital / Team Vyapar Setu
* **License**: Proprietary

---
