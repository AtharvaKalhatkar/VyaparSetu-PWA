# Vyapar Setu - Business Management Platform

An offline-first, cloud-synchronized Business Management and ERP platform for Indian Small and Medium Businesses (SMEs).

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.3, PostgreSQL 15, Redis, RabbitMQ
- **Mobile:** React Native + Expo, WatermelonDB
- **Desktop:** Electron + React (Phase 2)
- **DevOps:** Docker, GitHub Actions, Nginx

## Project Structure

```
vyapar-setu/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/vyaparsetu/
│   │   ├── config/            # Security, Web, OpenAPI config
│   │   ├── security/          # JWT, filters, UserDetails
│   │   ├── common/            # BaseEntity, Exception handler, ApiResponse
│   │   ├── entity/            # JPA entities (33 entities)
│   │   ├── repository/        # Spring Data JPA repositories
│   │   ├── service/           # Business logic (23 services)
│   │   ├── controller/        # REST controllers (21 controllers)
│   │   └── dto/               # DTOs + MapStruct mappers (97+15)
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/      # Flyway migrations (V1-V3)
├── mobile/                    # React Native + Expo app
│   └── src/
│       ├── app/               # Expo Router screens
│       ├── screens/           # Feature screens
│       ├── components/        # Reusable components
│       ├── services/          # API, Auth, Sync services
│       ├── store/             # Zustand state stores
│       ├── utils/             # Formatting, validation, GST, PDF
│       └── constants/         # Theme, config
├── nginx/                     # Nginx config
├── docker-compose.yml         # Dev environment
└── .github/workflows/         # CI/CD pipelines
```

## Quick Start

### Backend

```bash
# Start infrastructure
docker-compose up -d postgres redis rabbitmq

# Run backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

## API Documentation

Once running: http://localhost:8080/swagger-ui.html

## Core Modules

- **Authentication** - JWT, OTP, Email/Phone login, RBAC
- **Business Management** - Multi-tenant, GST, configurable
- **Party Management** - Customers & Suppliers with ledger
- **Ledger/Udhari** - Credit tracking with aging reports
- **Invoicing** - GST invoices, e-Invoice, PDF/WhatsApp
- **Inventory** - Stock, barcode, batch/expiry tracking
- **Expenses** - Categorized expense tracking
- **Employees** - Attendance, salary, leave, payroll
- **CRM** - Leads, follow-ups, pipeline management
- **Reports** - Sales, purchase, GST, P&L, balance sheet
- **Dashboard** - Real-time business insights
- **Sync Engine** - Offline-first with conflict resolution

## License

Proprietary - LogicSync Digital
