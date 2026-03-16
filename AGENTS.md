# AGENTS.md

## Project Overview

This project builds an AI-powered application using a Python backend and a NextJS frontend.

Main stack:

Backend

* FastAPI
* Pydantic
* Redis
* Supabase
* LangChain
* LangGraph
* DSPy

Frontend

* NextJS
* Typescript
* REST API communication with FastAPI

Supabase is used as the primary database and authentication provider.

---

# General Agent Rules

Agents must follow these rules when generating or modifying code.

1. Always write production-ready code.
2. Prefer readability over cleverness.
3. Avoid unnecessary dependencies.
4. Follow the existing project architecture.
5. All Python code must be compatible with Python 3.11+.
6. Use type hints everywhere.
7. Include docstrings in public functions.

---

# Backend Architecture

Backend is built with FastAPI.

Structure example:

backend/
api/
services/
agents/
schemas/
core/
workers/

Rules:

* API routes go in `api/`
* Business logic goes in `services/`
* AI workflows go in `agents/`
* Pydantic models go in `schemas/`
* Shared configuration goes in `core/`

---

# Pydantic Rules

Use Pydantic models for:

* request validation
* response validation
* internal data structures

Example:

class UserRequest(BaseModel):
user_id: str
message: str

Do not pass raw dictionaries between layers if a schema exists.

---

# FastAPI Rules

* Always define request and response models.
* Use dependency injection where appropriate.
* Keep endpoints thin.
* Move logic to services.

Pattern:

router -> service -> agent

---

# Database (Supabase)

Supabase is the primary database layer.

Supabase services used:

* PostgreSQL database
* Authentication
* Storage
* Realtime events

Rules:

* Database queries must go through service modules.
* Never call Supabase directly inside API routes.
* Use environment variables for keys.
* Prefer typed models when returning database data.

Example structure:

services/
user_service.py
conversation_service.py

---

# Redis Usage

Redis is used for:

* caching
* rate limiting
* conversation state
* temporary agent memory

Rules:

* Never store large documents in Redis.
* Use clear key namespaces.

Example:

cache:user:{id}
session:{session_id}
agent_state:{workflow_id}

---

# LangChain Usage

LangChain is used for:

* tool calling
* prompt orchestration
* document pipelines
* integrations with LLM providers

Rules:

* Use modular chains.
* Avoid extremely large prompts.
* Prefer structured outputs.

---

# LangGraph Usage

LangGraph orchestrates multi-step AI workflows.

Typical uses:

* multi-agent systems
* decision flows
* tool selection
* reasoning pipelines

Rules:

* Graph nodes must be small and focused.
* Avoid large monolithic graphs.
* Each node must have a single responsibility.

---

# DSPy Usage

DSPy is used for:

* prompt optimization
* declarative LLM programs
* evaluation loops

Rules:

* Prefer DSPy modules instead of manual prompts when possible.
* Keep prompts short and composable.
* Use evaluation datasets when optimizing prompts.

---

# Frontend Architecture

Frontend is built with NextJS and Typescript.

Structure example:

frontend/
app/
components/
lib/
services/

Rules:

* API calls go in services
* UI logic goes in components
* Do not embed business logic in UI

---

# Code Style

Python

* Follow PEP8
* Use type hints
* Prefer async functions
* Keep functions small

Typescript

* Use strict typing
* Avoid `any`
* Prefer reusable components

---

# Security Rules

Agents must never:

* commit secrets
* expose API keys
* log sensitive data
* bypass authentication



---

# Testing

Agents should generate tests when creating new logic.

Testing tools:

* pytest for backend
* Playwright or Jest for frontend

---

# Documentation

Agents must update documentation when:

* adding APIs
* adding environment variables
* modifying architecture

Main docs:

README.md- dOCUMENTACFION GENERADA POR MODELO USANDO Next.js
docs/

---

# Final Principle

Prefer simple architectures that scale.

Avoid unnecessary complexity.
