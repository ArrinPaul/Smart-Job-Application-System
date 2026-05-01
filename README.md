# Smart Job Portal System

[![Project Status: Active](https://img.shields.io/badge/status-active-success.svg)](https://github.com/your-repo/smart-job-portal-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A modern, recruitment platform featuring an integrated AI-driven ecosystem for intelligent job matching, automated resume analysis, and conversational support.

---

## 📑 Table of Contents
- [System Architecture](#system-architecture)
- [AI Ecosystem Deep Dive](#ai-ecosystem-deep-dive)
  - [1. Recommendation & Scoring Engine](#1-recommendation--scoring-engine)
  - [2. AI-Powered Chatbot](#2-ai-powered-chatbot)
  - [3. Intelligent CV/Resume Analyzer](#3-intelligent-cvresume-analyzer)
- [Database Architecture](#database-architecture)
- [Getting Started](#getting-started)

---

## 🏗 System Architecture
The platform utilizes a modern, cloud-native architecture where AI services are integrated as a high-performance intelligence layer.

```mermaid
graph TD
    User((User)) -->|Interacts| FE[Angular 17 Frontend]
    FE -->|REST/WebSockets| BE[Spring Boot 3 Core]

    subgraph "AI Intelligence Ecosystem"
        BE -->|Raw Content| TIKA[Apache Tika Parser]
        BE -->|Semantic Analysis| LLM[LLM Gateway - OpenAI/Groq]
        LLM -->|Vector Mapping| REC[Neural Recommendation Engine]
        LLM -->|Contextual Response| BOT[AI Chatbot Assistant]
    end

    subgraph "Cloud Data Layer (Supabase)"
        BE <-->|Persistence| DB[(PostgreSQL)]
        DB --- VEC[(pgvector Similarity Store)]
        BE <-->|Real-time| AUTH[Supabase Auth]
    end

    subgraph "Continuous Ingestion"
        SCRAPE[Node.js Job Scraper] -->|Normalize| NORM[Text Normalizer]
        NORM -->|Sync| DB
    end

    REC -.->|Match Scoring| FE
    BOT -.->|Intelligence Insights| FE
```

---

## 🔄 AI System Data Flow
Detailed visualization of how the system transforms raw data into intelligent career growth tools.

### CV Processing & Profile Intelligence
```mermaid
sequenceDiagram
    participant U as User
    participant B as Backend
    participant T as Tika/Parser
    participant AI as LLM Core
    participant DB as Vector Store

    U->>B: Upload Resume (.pdf/.docx)
    B->>T: Extract Text Stream
    T-->>B: Raw Text
    B->>AI: Profile Analysis (Skills, Exp, Intent)
    AI-->>B: Structured JSON + Vector Embeddings
    B->>DB: Upsert Profile & Skill Graph
    Note over B,DB: Real-time Match Calculation
    DB-->>B: Nearest Job Vectors (Cosine Similarity)
    B->>U: 98%+ Accuracy Recommendations
```

### Job Scoring & Insight Generation
```mermaid
graph LR
    JOB[Job Listing] -->|Text Normalization| NORM[Normalizer]
    NORM -->|Embedding| VEC_J[Job Vector]
    
    USR[User Profile] -->|Embedding| VEC_U[User Vector]
    
    VEC_J --- VEC_U
    VEC_U -->|Cosine Similarity| SCORE[Match Score %]
    
    VEC_J -->|Sentiment Analysis| HEALTH[Company Health Insight]
    VEC_J -->|Market Trends| SALARY[Predicted Salary Range]
    
    SCORE -->|Display| UI[Dashboard]
    HEALTH -->|Display| UI
    SALARY -->|Display| UI
```

---

## 🧠 AI Ecosystem Deep Dive

### 1. Recommendation & Scoring Engine
The recommendation engine provides highly personalized job discovery through a high-performance neural architecture.
- **How it works**: The system maps candidate skills, job title history, and location preferences against active job listings using high-dimensional **Vector Embeddings**.
- **Scoring System**: Each job is assigned a **Match Score (0-100%)**. The score is derived by calculating:
    - **Skill Alignment**: Semantic similarity between user-profile tags and job-description keywords (Vector Similarity).
    - **Preference Matching**: Geographic and job-type (Remote/On-site) compatibility.
    - **Market Benchmarking**: Scores your profile against current industry demand and "Match Velocity".
- **Job Insights**: Users see exactly *why* a job is recommended via specific "Match Tags" and **Company Health Insights** (sentiment analysis from aggregated market data).

### 2. AI-Powered Chatbot & Assistant
The Chatbot serves as a 24/7 recruitment assistant and interface layer.
- **How it works**: The backend utilizes LLMs (configured for Groq or HuggingFace) to process natural language queries.
- **Capabilities**:
    - **Interview Prep**: Get role-specific questions and instant feedback tailored to your profile and the job description.
    - **Direct Q&A**: Ask anything about a job listing or your application status.
    - **Smart Navigation**: Command the portal through conversational text or voice.

### 3. Intelligent CV/Resume Analyzer
Reduces user effort by automating profile creation with sub-second precision.
- **Data Extraction**: Uses **Apache Tika** for deep content extraction from .pdf and .docx.
- **Contextual Parsing**: Extracts intent and experience depth beyond simple keyword matching.
- **Gap Identification**: Provides real-time feedback on missing skills required for your target roles.

---

## 📊 Database Architecture
The database schema stores both transactional recruitment data and AI-derived metadata.

```mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : "submits"
    USERS ||--o| RESUMES : "owns"
    JOBS ||--o{ APPLICATIONS : "receives"
    
    USERS { 
        bigint id PK
        varchar role 
        jsonb profile_preferences 
    }
    JOBS { 
        bigint id PK
        varchar title
        float base_relevance_score
    }
    APPLICATIONS { 
        bigint id PK
        float ai_match_score "Result from Scoring Engine"
        varchar status 
    }
    RESUMES { 
        bigint id PK
        bytea raw_file
        jsonb ai_parsed_data "Result from CV Analyzer"
    }
```

---

## 🛠 Technology Stack
- **AI Backend**: Apache Tika (Parsing), LLM (Groq/Phi-3 API), Bucket4j (Rate Limiting).
- **Core Engine**: Spring Boot 3, Java 17, JPA.
- **Storage**: PostgreSQL (Supabase).
- **Frontend**: Angular 17.3, Chart.js for AI Insight Visualization.

---

## 🚀 Getting Started
1. **Clone**: `git clone <url>`
2. **Setup**: Create `backend/.env` with your Supabase credentials.
3. **Execution**: Run `./run-supabase.ps1` to start the backend and `npm start` for the frontend.
