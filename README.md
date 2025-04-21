# Secure Express Backend

A production-ready, secure backend built with **Express.js**, featuring a hybrid caching system, custom rate-limiting, robust authentication, and integrated observability tools like **Prometheus**, **Grafana**, and **Loki**.

---

## 🚀 Features

- **Secure Authentication** using HTTP-only cookies
- **Custom Rate Limiting** with IP hashing (no third-party libraries)
- **Hybrid Caching** using in-memory and Redis
- **Database Integration** with PostgreSQL via Prisma
- **Observability Stack** with Prometheus, Grafana, and Loki
- **Modular Clean Code Structure**
- **Dockerized Environment** with Docker Compose
- **Typescript Support** with strict config
- **Prettier for Code Formatting**

---

## 📁 Folder Structure

```
.
├── dist/                   # Compiled JavaScript
├── node_modules/
├── prisma/                # Prisma schema and migrations
├── src/
│   ├── controller/        # Route controllers
│   ├── db/                # Database, cache, and rate limit logic
│   │   ├── memory.cache.ts
│   │   ├── redis.cache.ts
│   │   ├── prisma.ts
│   │   └── ratelimit.memory.ts
│   ├── middlewares/       # Express middlewares (e.g., auth, logging)
│   ├── models/            # Domain models/types
│   ├── routes/            # Express route definitions
│   └── utils/             # Utility functions
├── .dockerignore
├── .env                   # Environment variables
├── .gitignore
├── .prettierrc
├── .prettierignore
├── docker-compose.yml     # Docker Compose services
├── Dockerfile             # Dockerfile for Express app
├── prometheus.yml         # Prometheus scrape config
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## 🔐 Security Features

- **HTTP-Only, Secure Cookies**: Used for session handling and authentication.
- **Rate Limiting**: In-house middleware with IP address hashing to prevent abuse and DDoS.
- **Input Sanitization** and **Validation** using clean middleware practices.
- **Environment-Based Configs** for secure deployment.

---

## 💾 Caching Strategy

A hybrid cache mechanism:
- **Memory Cache**: Fast, ephemeral layer.
- **Redis Cache**: Persistent, shared layer for distributed systems.
- Intelligent fallback and rehydration logic ensures data consistency and performance.

---

## 📊 Monitoring & Logging

- **Prometheus**: Metric collection.
- **Grafana**: Dashboards for visualization.
- **Loki**: Log aggregation.
- **Custom Metrics**: Endpoint timings, cache hits/misses, rate limit blocks.

---

## 🔧 Development

### Install dependencies

```bash
pnpm install
# or
npm install
```

### Setup environment

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=3000
```

### Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Start the app

```bash
pnpm dev
# or
npm run dev
```

### Start with Docker

```bash
docker-compose up --build
```

---

## 🐳 Docker Services

- **express-app** - Node.js backend
- **postgres** - PostgreSQL database
- **redis** - Redis cache
- **prometheus** - Metric collection
- **grafana** - Visualization dashboard
- **loki** - Log aggregation

---

## 📈 Observability URLs

- Grafana: [http://localhost:3001](http://localhost:3001)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Loki: [http://localhost:3100](http://localhost:3100)

---

## 🧪 Testing

Tests should be added using your preferred framework (e.g., Jest, Mocha). Consider adding integration tests for:
- Authentication flows
- Cache fallback mechanisms
- Rate limiter behavior

---

## ✅ TODOs

- [ ] Add API documentation (e.g., Swagger)
- [ ] Add unit & integration tests
- [ ] Set up CI/CD (GitHub Actions / GitLab CI)
- [ ] Implement refresh tokens for long-lived sessions

---

## 📜 License

MIT License

---
