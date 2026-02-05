# PROJ-1: Repository Connection & Authentication

## Status: 🔵 Planned

## Overview
Enable users to connect their repositories from multiple platforms (Replit, Lovable, GitHub, GitLab) using various authentication methods. This is the foundation feature that allows the app to access repository data for analysis.

## User Stories

### As a solo developer
- I want to paste a repository URL to quickly analyze a public project
- I want to connect via OAuth so I don't have to manage API tokens
- I want to save my connected repositories so I can return to them later
- I want to see a list of all my connected repositories in one dashboard

### As a team member
- I want to connect private repositories so my team's internal projects can be documented
- I want to authenticate once and access multiple repositories from the same platform
- I want to revoke access to specific repositories without disconnecting my entire account

### As a user with multiple platforms
- I want to connect repositories from Replit, Lovable, GitHub, and GitLab all in one app
- I want to see which platform each repository comes from at a glance
- I want to switch between different platform accounts easily

## Acceptance Criteria

### Repository Connection Methods
- [ ] User can paste a repository URL (public repos)
- [ ] User can connect via OAuth for GitHub
- [ ] User can connect via OAuth for GitLab
- [ ] User can enter API token/Personal Access Token for any platform
- [ ] User can connect Replit projects via Replit API
- [ ] User can connect Lovable projects via Lovable integration
- [ ] System validates repository URL format before attempting connection
- [ ] System shows clear error messages for invalid URLs or failed connections

### Authentication & Authorization
- [ ] User can sign up with email/password
- [ ] User can sign in with Google OAuth
- [ ] User can sign in with GitHub OAuth
- [ ] User session persists across browser reloads
- [ ] User can log out from any page
- [ ] Private repositories require authentication
- [ ] System stores OAuth tokens securely in Supabase
- [ ] System refreshes expired OAuth tokens automatically

### Repository Management
- [ ] User sees a dashboard with all connected repositories
- [ ] Each repository card shows: name, platform icon, last analyzed date, status
- [ ] User can disconnect/remove a repository from their dashboard
- [ ] User can reconnect a repository if connection fails
- [ ] System shows connection status (Connected, Failed, Pending)
- [ ] User can search/filter repositories by name or platform
- [ ] System limits to 50 repositories per user (MVP limit)

### Platform-Specific Features
- [ ] GitHub: Show repository stars, forks, last commit date
- [ ] GitLab: Show repository stars, forks, last activity
- [ ] Replit: Show Repl name, language, last run date
- [ ] Lovable: Show project name, framework, last deployment
- [ ] All platforms: Show repository visibility (public/private)

## Edge Cases

### Connection Failures
- **What happens if OAuth fails?**
  - Show error message: "Authentication failed. Please try again."
  - Offer alternative: "Try using a Personal Access Token instead"
  - Log error details for debugging

- **What happens if repository URL is invalid?**
  - Validate URL format before API call
  - Show specific error: "Invalid GitHub URL format. Expected: https://github.com/username/repo"
  - Provide example URLs for each platform

- **What happens if user tries to connect a repository they don't have access to?**
  - Show error: "Access denied. This repository is private or doesn't exist."
  - Suggest: "Make sure you're logged in with the correct account"

### Token Management
- **What happens if API token expires?**
  - Detect expired token on next API call
  - Show notification: "Your access token has expired. Please reconnect."
  - Redirect to reconnection flow

- **What happens if user revokes OAuth access externally (on GitHub/GitLab)?**
  - Mark repository as "Connection Lost" in dashboard
  - Show reconnect button
  - Don't delete previously generated documentation

### Rate Limits & Quotas
- **What happens if user tries to connect more than 50 repositories?**
  - Show warning: "Repository limit reached (50/50). Remove a repository to add a new one."
  - Offer upgrade path (future premium feature)

- **What happens if GitHub API rate limit is hit during connection?**
  - Show error: "GitHub rate limit reached. Please try again in X minutes."
  - Cache repository metadata to reduce API calls

### Duplicate Repositories
- **What happens if user tries to connect the same repository twice?**
  - Check for duplicates before adding
  - Show message: "This repository is already connected."
  - Redirect to existing repository dashboard

### Platform-Specific Issues
- **What happens if Replit API is down?**
  - Show error: "Replit is currently unavailable. Please try again later."
  - Allow user to retry manually
  - Queue connection attempt for automatic retry

- **What happens if Lovable doesn't support API access yet?**
  - Show message: "Lovable integration coming soon. Use manual export for now."
  - Provide workaround instructions

## Technical Requirements

### Performance
- Repository connection should complete within 5 seconds
- Dashboard should load all repositories within 2 seconds
- OAuth flow should complete within 10 seconds

### Security
- All API tokens stored encrypted in Supabase
- OAuth tokens use secure HTTP-only cookies
- No sensitive data in browser localStorage
- HTTPS only for all API calls
- Implement PKCE for OAuth flows

### Data Storage (Supabase)
```sql
-- repositories table
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- platform (enum: github, gitlab, replit, lovable)
- repo_url (text)
- repo_name (text)
- repo_owner (text)
- is_private (boolean)
- connection_status (enum: connected, failed, pending)
- access_token_encrypted (text, nullable)
- metadata (jsonb) -- platform-specific data
- last_synced_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### API Integrations
- GitHub API v3/v4 (GraphQL for efficiency)
- GitLab API v4
- Replit API (if available)
- Lovable API (if available)

## Dependencies
- None (this is the first feature)

## Out of Scope (Future Features)
- Bitbucket support (not in MVP)
- Bulk repository import
- Organization-level connections
- Custom webhook URLs
- Repository access permissions management

## Success Metrics
- User can successfully connect a repository within 30 seconds
- 95% OAuth success rate
- Less than 5% connection failure rate
- Average of 3-5 repositories connected per user

## Notes for Solution Architect
- Consider using Supabase Auth for OAuth flows
- Need secure token encryption strategy
- Consider rate limiting on our side (not just platform limits)
- Plan for graceful degradation if platform APIs are down

---

## Tech-Design (Solution Architect)

### Component-Struktur

```
App Layout
├── Navigation Bar (top)
│   ├── Logo
│   ├── User Menu (Avatar + Dropdown)
│   └── Logout Button
│
├── Authentication Pages (public routes)
│   ├── Sign Up Page
│   │   ├── Email/Password Form
│   │   ├── Google OAuth Button
│   │   └── GitHub OAuth Button
│   │
│   └── Sign In Page
│       ├── Email/Password Form
│       ├── Google OAuth Button
│       ├── GitHub OAuth Button
│       └── "Forgot Password" Link
│
└── Dashboard (protected route)
    ├── Page Header
    │   ├── "My Repositories" Title
    │   └── "Connect Repository" Button
    │
    ├── Repository Stats Bar
    │   ├── Total Repositories Count
    │   ├── Connected Status Count
    │   └── Failed Status Count
    │
    ├── Search & Filter Bar
    │   ├── Search Input (by name)
    │   └── Platform Filter Dropdown (All, GitHub, GitLab, Replit, Lovable)
    │
    ├── Repository Grid
    │   └── Repository Cards (responsive grid)
    │       ├── Platform Icon Badge
    │       ├── Repository Name
    │       ├── Owner Name
    │       ├── Status Badge (Connected/Failed/Pending)
    │       ├── Metadata (stars, forks, last commit)
    │       ├── Last Synced Timestamp
    │       └── Actions Menu
    │           ├── View Details
    │           ├── Reconnect (if failed)
    │           └── Disconnect
    │
    └── Empty State (when no repos)
        ├── Illustration
        ├── "No repositories connected" Message
        └── "Connect Your First Repository" Button

Connect Repository Dialog
├── Connection Method Tabs
│   ├── URL Tab
│   │   ├── Platform Selector (GitHub, GitLab, Replit, Lovable)
│   │   ├── URL Input Field
│   │   └── "Connect" Button
│   │
│   ├── OAuth Tab
│   │   ├── GitHub OAuth Button
│   │   └── GitLab OAuth Button
│   │
│   └── API Token Tab
│       ├── Platform Selector
│       ├── Token Input Field (password type)
│       └── "Connect" Button
│
└── Connection Status
    ├── Loading Spinner (during connection)
    ├── Success Message
    └── Error Message (with retry option)
```

### Daten-Model

#### User Authentication
Jeder User hat:
- Eindeutige ID (von Supabase Auth)
- Email Adresse
- Passwort (gehasht von Supabase)
- OAuth Provider Info (Google, GitHub)
- Erstellungszeitpunkt
- Letzter Login

Gespeichert in: Supabase Auth (automatisch verwaltet)

#### Connected Repositories
Jedes verbundene Repository hat:
- Eindeutige ID
- Zugehöriger User (wem gehört diese Verbindung?)
- Plattform (GitHub, GitLab, Replit, Lovable)
- Repository URL
- Repository Name
- Owner Name
- Sichtbarkeit (öffentlich oder privat)
- Verbindungsstatus (Connected, Failed, Pending)
- Zugangstoken (verschlüsselt gespeichert)
- Plattform-spezifische Daten:
  - GitHub: Stars, Forks, letzter Commit
  - GitLab: Stars, Forks, letzte Aktivität
  - Replit: Sprache, letzter Run
  - Lovable: Framework, letztes Deployment
- Letzte Synchronisation
- Erstellungszeitpunkt
- Aktualisierungszeitpunkt

Gespeichert in: Supabase PostgreSQL Datenbank

#### Sicherheitsregeln
- User kann nur eigene Repositories sehen
- User kann nur eigene Repositories verbinden/trennen
- Tokens sind verschlüsselt und nur serverseitig lesbar
- OAuth Tokens werden automatisch erneuert

### Tech-Entscheidungen

#### Warum Supabase Auth?
- Eingebaute OAuth-Unterstützung (Google, GitHub)
- Automatische Token-Verwaltung und Erneuerung
- Sichere Session-Verwaltung
- Row Level Security für Datenschutz
- Keine eigene Auth-Logik nötig

#### Warum Next.js Server Actions?
- Sichere API-Aufrufe (Tokens bleiben auf Server)
- Keine separate API-Route nötig
- Automatische Fehlerbehandlung
- Einfache Integration mit Supabase

#### Warum shadcn/ui Components?
- Bereits im Projekt vorhanden
- Modern und zugänglich
- Anpassbar mit Tailwind CSS
- Komponenten: Card, Button, Dialog, Input, Badge, Avatar, Tabs

#### Warum Token-Verschlüsselung?
- GitHub/GitLab Tokens sind sensibel
- Verschlüsselung schützt bei Datenbank-Leak
- Nur Server kann Tokens entschlüsseln
- Best Practice für Sicherheit

#### Warum 50 Repository Limit?
- Verhindert Missbrauch im MVP
- Reduziert API-Kosten
- Genug für typische User
- Kann später erhöht werden (Premium Feature)

### Dependencies

Benötigte Packages:
- `@supabase/supabase-js` - Supabase Client (bereits vorhanden)
- `@supabase/auth-helpers-nextjs` - Next.js Auth Integration
- `zod` - Form Validation
- `react-hook-form` - Form Management
- `lucide-react` - Icons (GitHub, GitLab, etc.)
- `date-fns` - Datum-Formatierung

Keine neuen UI-Packages nötig (shadcn/ui bereits vorhanden)

### Datenbank-Setup

Neue Tabellen in Supabase:
1. **repositories** - Speichert verbundene Repositories
2. **platform_tokens** - Speichert verschlüsselte OAuth/API Tokens (separate Tabelle für Sicherheit)

Sicherheitsregeln (Row Level Security):
- User kann nur eigene Repositories lesen
- User kann nur eigene Repositories erstellen
- User kann nur eigene Repositories aktualisieren
- User kann nur eigene Repositories löschen

### API-Integrationen

#### GitHub API
- OAuth Flow: GitHub OAuth Apps
- API Endpoints: Repository Info, User Repos
- Rate Limit: 5000 Anfragen/Stunde (authenticated)

#### GitLab API
- OAuth Flow: GitLab Applications
- API Endpoints: Project Info, User Projects
- Rate Limit: 300 Anfragen/Minute

#### Replit API
- Aktueller Status: API verfügbar (begrenzt)
- Fallback: Git Clone wenn API nicht ausreicht

#### Lovable API
- Aktueller Status: Keine öffentliche API
- MVP: Vorerst nicht unterstützt (Coming Soon Badge)
- Fallback: Manuelle URL-Eingabe für später

### Benutzerfluss

#### 1. Neue User Registrierung
1. User besucht Sign Up Page
2. Wählt Email/Password oder OAuth
3. Supabase erstellt Account
4. Automatischer Login
5. Weiterleitung zu Dashboard (leer)

#### 2. Repository Verbinden (URL Methode)
1. User klickt "Connect Repository"
2. Dialog öffnet sich
3. User wählt "URL" Tab
4. User wählt Plattform (z.B. GitHub)
5. User fügt URL ein
6. System validiert URL Format
7. System prüft Repository-Zugriff
8. System speichert Repository in Datenbank
9. Success Message + Dialog schließt
10. Repository erscheint in Dashboard

#### 3. Repository Verbinden (OAuth Methode)
1. User klickt "Connect Repository"
2. Dialog öffnet sich
3. User wählt "OAuth" Tab
4. User klickt "Connect with GitHub"
5. Weiterleitung zu GitHub OAuth
6. User authorisiert App
7. Rückkehr zur App mit Token
8. System speichert Token verschlüsselt
9. System lädt User's Repositories
10. User wählt Repositories zum Verbinden
11. Repositories erscheinen in Dashboard

#### 4. Repository Trennen
1. User klickt Actions Menu auf Repository Card
2. User wählt "Disconnect"
3. Bestätigungs-Dialog erscheint
4. User bestätigt
5. Repository wird aus Datenbank gelöscht
6. Card verschwindet aus Dashboard

### Fehlerbehandlung

#### Verbindungsfehler
- Klare Fehlermeldungen anzeigen
- Retry-Button anbieten
- Alternative Methoden vorschlagen

#### Token-Ablauf
- Automatische Erneuerung versuchen
- Bei Fehler: Reconnect-Badge zeigen
- User kann manuell reconnecten

#### Rate Limits
- Fehler abfangen
- Wartezeit anzeigen
- Retry nach Wartezeit

### Performance-Optimierung

#### Dashboard Laden
- Lazy Loading für Repository Cards
- Pagination (20 Repos pro Seite)
- Optimistic Updates (sofortiges UI Feedback)

#### Suche & Filter
- Client-seitige Filterung (schnell)
- Debounced Search Input (300ms)

#### Caching
- Repository Metadata cachen (5 Minuten)
- Reduziert API-Aufrufe
- Schnelleres Dashboard Laden

---

## Design Review Checklist

- [x] Bestehende Architektur geprüft (shadcn/ui Components vorhanden)
- [x] Feature Spec gelesen und verstanden
- [x] Component-Struktur dokumentiert (Visual Tree)
- [x] Daten-Model beschrieben (User + Repositories)
- [x] Backend-Bedarf geklärt (Supabase Database + Auth)
- [x] Tech-Entscheidungen begründet (Warum Supabase Auth, etc.)
- [x] Dependencies aufgelistet (6 Packages)
- [x] Design in Feature Spec eingetragen
- [ ] User Review (wartet auf Approval)
- [ ] Handoff orchestriert (Frontend Developer bereit)
