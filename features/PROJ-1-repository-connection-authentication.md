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
