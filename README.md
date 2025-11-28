# 🛡️ ShieldAI - Digital Violence Protection

> **Build Safe. Build Bold.** 

## 🌟 Overview

ShieldAI is an AI-powered platform that protects women and girls from digital violence across Africa. It provides real-time toxicity detection, cultural context awareness, and survivor support resources.

## 🚀 Features

### Core Protection
- **Real-time AI Analysis**: Detects toxic content in under 500ms
- **African Context Awareness**: Understands regional slang and cultural patterns
- **Multi-Platform Support**: Browser extension for Twitter, Facebook, Instagram, WhatsApp
- **Multi-Language**: Supports English, French, Swahili, Pidgin, and more

### Advanced Capabilities
- **Cultural Sensitivity**: Regional analysis for Nigeria, Kenya, Ghana, South Africa
- **Constructive Feedback**: Suggests respectful alternatives to harmful content
- **Survivor Resources**: Direct access to local support services
- **Privacy-First**: Local processing when possible

## 🛠️ Installation & Setup

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Python 3.11+** (for local development without Docker)
- **Node.js 18+** (for frontend development)
- **Modern web browser**

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/charllote122/shieldai.git
   cd shieldai/shieldai/backend
   ```

2. **Configure environment**
   ```bash
   # Edit .env with your settings (already pre-configured with defaults)
   cat .env
   ```

3. **Start the full stack**
   ```bash
   docker compose up -d
   ```
   This starts:
   - Backend API (port 8000)
   - Frontend (port 3000)
   - PostgreSQL Database (port 5432)
   - Redis Cache (port 6379)
   - Redis Commander UI (port 8081)

4. **Access the services**
   - Frontend: http://localhost:3000
   - API Swagger Docs: http://localhost:8000/docs
   - Redis Commander: http://localhost:8081

5. **Stop all services**
   ```bash
   docker compose down
   ```

### Docker Commands Reference

**View running containers:**
```bash
cd shieldai/backend
docker compose ps
```

**View logs:**
```bash
# Backend logs
docker compose logs -f backend

# Database logs
docker compose logs -f db

# All services
docker compose logs -f
```

**Connect to PostgreSQL database:**
```bash
docker compose exec db psql -U shieldai_user -d shieldai
# Inside psql: \dt (list tables), SELECT * FROM analysis_results;
```

**Rebuild services:**
```bash
docker compose up -d --build
```

**Remove all containers and volumes (WARNING: deletes DB data):**
```bash
docker compose down -v
```

### Local Development Setup (Without Docker)

1. **Install Python dependencies**
   ```bash
   cd shieldai/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for just the DB/Redis:
   docker compose up -d db redis

   # Or use local installations:
   # PostgreSQL: https://www.postgresql.org/download/
   # Redis: https://redis.io/docs/install/
   ```

3. **Run backend server**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Run frontend**
   ```bash
   cd shieldai/frontend
   python -m http.server 8080
   # Or use any static server: npx http-server
   ```