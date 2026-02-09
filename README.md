# Event Management System

A full-stack web application for managing events, participants, courses, and attendance with badge printing and QR code scanning capabilities.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## Features

- **Event Management**: Create and manage multiple events with customizable fields
- **Participant Registration**: Register participants with dynamic custom fields per event
- **Staff Portal**: Separate authentication for event staff with role-based access
- **Course Management**: Create courses/sessions with participant registration
- **Hall Management**: Manage event venues and rooms
- **Badge Printing**: Generate and print participant badges with QR codes
- **Attendance Tracking**: Real-time QR code scanning for attendance
- **Excel Import/Export**: Bulk import participants and export reports
- **Responsive Design**: Mobile-friendly interface for on-site usage

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool with HMR
- **html5-qrcode** - QR code scanning
- **jsPDF** - Badge PDF generation
- **ExcelJS** - Excel import/export

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** - Database access
- **PostgreSQL** - Database
- **JWT** - Authentication (access + refresh tokens)
- **bcrypt** - Password hashing

### Infrastructure
- **Docker Compose** - Container orchestration
- **Nginx** - Reverse proxy with SSL
- **PostgreSQL 15** - Database container

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-management
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   POSTGRES_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
   NODE_ENV=development
   ```

3. **Generate SSL certificates** (for HTTPS)
   ```bash
   chmod +x scripts/generate-ssl-certs.sh
   ./scripts/generate-ssl-certs.sh
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   docker exec event-backend npx prisma migrate deploy
   ```

6. **Access the application**
   - Frontend: https://localhost
   - Backend API: https://localhost/api
   - Prisma Studio: http://localhost:5555 (run `docker exec event-backend npx prisma studio`)

### Local Development (without Docker)

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── modules/        # Feature modules (auth, events, participants, etc.)
│   │   ├── shared/         # Shared utilities
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── tests/              # API test files (.http)
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   ├── context/        # React context providers
│   │   ├── lib/            # Utilities (API client, excel, pdf)
│   │   ├── routes/         # TanStack Router pages
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
│
├── nginx/
│   ├── nginx.conf          # Nginx configuration
│   └── certs/              # SSL certificates
│
├── scripts/
│   └── generate-ssl-certs.sh
│
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/staff/login` - Staff login

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Participants
- `GET /api/events/:eventId/participants` - List participants
- `POST /api/events/:eventId/participants` - Create participant
- `POST /api/events/:eventId/participants/bulk` - Bulk import
- `PUT /api/participants/:id` - Update participant
- `DELETE /api/participants/:id` - Delete participant

### Courses
- `GET /api/events/:eventId/courses` - List courses
- `POST /api/events/:eventId/courses` - Create course
- `POST /api/courses/:id/registrations` - Register participants

### Badges & Attendance
- `POST /api/badges/print` - Mark badge as printed
- `POST /api/attendance` - Record attendance (QR scan)
- `GET /api/events/:eventId/stats` - Get event statistics

## Scripts

```bash
# Backend
npm run dev           # Start development server
npm run build         # Build for production
npm run prisma:studio # Open Prisma Studio
npm run prisma:migrate # Run migrations
npm run test          # Run tests

# Frontend
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run test          # Run Vitest tests
npm run test:e2e      # Run Playwright E2E tests
npm run lint          # Run ESLint
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for access tokens | - |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGINS` | Allowed CORS origins | - |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | /api |

## Performance Optimizations

- **Code Splitting**: Manual chunks for vendor, PDF, Excel, and scanner libraries
- **Lazy Loading**: Heavy components loaded on demand
- **Skeleton UI**: Loading states that match actual content layout
- **Font Optimization**: System font stack with `font-display: swap`
- **Image Optimization**: WebP format for large images

## License

This project is private and proprietary.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

Built with ❤️ for event management
