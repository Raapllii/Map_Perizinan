# NIK Verification Public Map Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current name/agency free-text form in `PublicAccessModal` with a NIK-based identity verification flow: user enters NIK → passes CAPTCHA → backend validates against a Dukcapil service stub → name is auto-filled → user picks/types their instansi → access is granted.

**Architecture:**
- **Frontend** (`PublicAccessModal.tsx`): Refactored into a 3-step wizard (Step 1: NIK + CAPTCHA → Step 2: Instansi after name auto-fill → Step 3: granted). CAPTCHA is a server-generated math challenge.
- **Backend** (`DukcapilVerificationController` + `DukcapilService`): New endpoint `POST /api/verify-nik` that validates NIK format, checks CAPTCHA, queries the Dukcapil stub (configurable via `.env`), returns citizen name. `PublicMapAccessLogController` stores NIK.
- **Data Layer**: One migration adds nullable `nik` column to `public_map_access_logs`. No breaking changes.

**Tech Stack:** Laravel 9 (PHP), React 18 + TypeScript, Axios, existing Tailwind design tokens, Vite

## Global Constraints
- NIK = exactly 16 digits. Validated client-side AND server-side.
- `DUKCAPIL_ENABLED=false` (default) → stub returns a fake name for dev/test.
- `public_map_access_logs.nik` is nullable — existing rows unaffected.
- CAPTCHA: `GET /api/captcha-challenge` → `{ question, token }`. Token = `base64(answer::timestamp::hmac)` where `hmac = HMAC-SHA256(answer::timestamp, APP_KEY)`. Valid 10 minutes.
- All UI text in Indonesian.
- `PublicAccessModal` props (`isOpen`, `onSuccess`) unchanged.
- `VisitorData` gains `nik?: string`.
