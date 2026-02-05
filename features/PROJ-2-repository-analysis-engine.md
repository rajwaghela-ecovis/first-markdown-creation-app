# PROJ-2: Repository Analysis Engine

## Status: 🔵 Planned

## Overview
Analyze connected repositories to extract code structure, dependencies, file organization, and metadata. This engine provides the raw data that will be used by the AI Documentation Generator (PROJ-3).

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication) - for accessing repository data

## User Stories

### As a developer analyzing my project
- I want to see a complete file tree of my repository
- I want to see all dependencies (npm, pip, composer, etc.) detected automatically
- I want to see which programming languages are used in my project
- I want to see the size and complexity of my codebase
- I want the analysis to complete in a reasonable time (under 2 minutes for most projects)

### As a team lead reviewing projects
- I want to see a high-level overview of the project architecture
- I want to identify main entry points (index.js, main.py, etc.)
- I want to see which frameworks/libraries are being used
- I want to understand the folder structure and organization

### As a user with large repositories
- I want to see progress updates during analysis
- I want the option to cancel a long-running analysis
- I want to see which files are being processed in real-time

## Acceptance Criteria

### File Structure Analysis
- [ ] System extracts complete file tree from repository
- [ ] System identifies file types (JS, TS, PY, PHP, etc.)
- [ ] System calculates total lines of code
- [ ] System counts files by type (e.g., 45 TypeScript files, 12 CSS files)
- [ ] System identifies main entry points (package.json "main", index.html, etc.)
- [ ] System detects configuration files (.env.example, config.json, etc.)
- [ ] System ignores common build/dependency folders (node_modules, .git, dist, build)

### Dependency Detection
- [ ] System parses package.json (npm/yarn) and extracts dependencies
- [ ] System parses requirements.txt (Python pip) and extracts dependencies
- [ ] System parses composer.json (PHP) and extracts dependencies
- [ ] System parses Gemfile (Ruby) and extracts dependencies
- [ ] System parses go.mod (Go) and extracts dependencies
- [ ] System parses Cargo.toml (Rust) and extracts dependencies
- [ ] System identifies major frameworks (React, Vue, Next.js, Django, Laravel, etc.)
- [ ] System shows dependency versions

### Code Analysis
- [ ] System identifies programming languages used (with percentage breakdown)
- [ ] System detects framework/library patterns (e.g., Next.js App Router, Express routes)
- [ ] System identifies API endpoints (REST routes, GraphQL schemas)
- [ ] System finds database schemas (SQL files, Prisma schema, etc.)
- [ ] System detects environment variables from .env.example
- [ ] System identifies test files and testing frameworks

### Project Metadata
- [ ] System extracts README.md content if present
- [ ] System extracts project name from package.json or repository name
- [ ] System extracts project description
- [ ] System identifies license type
- [ ] System detects CI/CD configuration (.github/workflows, .gitlab-ci.yml)
- [ ] System identifies deployment platform (Vercel, Netlify, Heroku configs)

### Performance & Progress
- [ ] Analysis shows real-time progress bar (0-100%)
- [ ] Analysis shows current file being processed
- [ ] Analysis completes within 2 minutes for repos < 500 files
- [ ] Analysis shows estimated time remaining
- [ ] User can cancel analysis at any time
- [ ] Partial results are saved if analysis is cancelled

### Analysis Results Storage
- [ ] Analysis results are saved to Supabase database
- [ ] Results are cached for 24 hours (avoid re-analyzing unchanged repos)
- [ ] User can manually trigger re-analysis
- [ ] System shows "Last analyzed: X hours ago"

## Edge Cases

### Large Repositories
- **What happens if repository has 1000+ files?**
  - Show warning: "Large repository detected. Analysis may take 5-10 minutes."
  - Process in batches of 100 files
  - Show progress updates every 10%
  - Allow user to continue browsing while analysis runs in background

- **What happens if repository is > 100MB?**
  - Use shallow clone (no git history) to reduce download size
  - Stream files instead of downloading entire repo
  - Show warning about potential delays

### Unsupported File Types
- **What happens if repository contains only binary files (images, videos)?**
  - Show message: "No code files detected. This repository may not be suitable for documentation."
  - List detected file types
  - Allow user to proceed anyway

- **What happens if repository uses an obscure language/framework?**
  - Mark as "Unknown framework" in analysis
  - Still generate basic file structure documentation
  - Allow user to manually specify framework in settings

### Parsing Failures
- **What happens if package.json is malformed?**
  - Log error but continue analysis
  - Show warning: "Could not parse package.json. Dependencies may be incomplete."
  - Attempt to extract dependencies from lock files (package-lock.json, yarn.lock)

- **What happens if repository has no recognizable structure?**
  - Generate basic file tree documentation
  - Show message: "No standard project structure detected. Documentation may be limited."
  - Suggest manual categorization

### Network Issues
- **What happens if GitHub API times out during file fetching?**
  - Retry up to 3 times with exponential backoff
  - If still failing, show error: "Network error. Please check your connection and retry."
  - Save partial analysis results

- **What happens if user's internet disconnects mid-analysis?**
  - Pause analysis automatically
  - Show notification: "Connection lost. Analysis paused."
  - Resume automatically when connection restored

### Rate Limiting
- **What happens if GitHub API rate limit is hit during analysis?**
  - Queue analysis for later (when rate limit resets)
  - Show message: "GitHub rate limit reached. Analysis will resume in X minutes."
  - Cache already-fetched files to avoid re-fetching

### Empty or Minimal Repositories
- **What happens if repository is empty (no files)?**
  - Show message: "Repository is empty. Nothing to analyze."
  - Suggest adding code first

- **What happens if repository only has a README?**
  - Show message: "Only documentation files found. No code to analyze."
  - Still extract README content for documentation

## Technical Requirements

### Performance
- Analyze repos with < 100 files in under 30 seconds
- Analyze repos with 100-500 files in under 2 minutes
- Analyze repos with 500-1000 files in under 5 minutes
- Use streaming/chunking for large repositories

### API Efficiency
- Use GitHub GraphQL API for batch file fetching (more efficient than REST)
- Implement aggressive caching (24-hour cache for unchanged repos)
- Use conditional requests (ETag) to check if repo changed
- Batch file requests (fetch multiple files in single API call)

### Data Storage (Supabase)
```sql
-- repository_analyses table
- id (uuid, primary key)
- repository_id (uuid, foreign key to repositories)
- status (enum: pending, processing, completed, failed, cancelled)
- progress_percentage (integer, 0-100)
- current_file (text, nullable)
-
- file_tree (jsonb) -- complete file structure
- file_stats (jsonb) -- {total_files: 123, by_type: {js: 45, css: 12}}
- dependencies (jsonb) -- parsed from package.json, requirements.txt, etc.
- languages (jsonb) -- {typescript: 65%, css: 20%, html: 15%}
- frameworks (jsonb) -- [nextjs, tailwind, supabase]
- entry_points (jsonb) -- [src/app/page.tsx, src/index.ts]
- api_endpoints (jsonb) -- detected API routes
- environment_vars (jsonb) -- from .env.example
- 
- error_log (jsonb, nullable) -- errors during analysis
- started_at (timestamp)
- completed_at (timestamp, nullable)
- created_at (timestamp)
```

### Analysis Algorithm
1. Fetch repository metadata (name, description, languages)
2. Fetch file tree (all files and folders)
3. Filter out ignored paths (node_modules, .git, etc.)
4. Categorize files by type
5. Parse dependency files (package.json, requirements.txt, etc.)
6. Identify frameworks from dependencies
7. Find entry points and configuration files
8. Extract README content
9. Calculate statistics
10. Save results to database

### Supported Platforms
- GitHub (via GitHub API)
- GitLab (via GitLab API)
- Replit (via Replit API if available, otherwise fallback to git clone)
- Lovable (via Lovable API if available)

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication)

## Out of Scope (Future Features)
- Code quality metrics (complexity, maintainability scores)
- Security vulnerability scanning
- License compatibility checking
- Duplicate code detection
- Git commit history analysis

## Success Metrics
- 95% of repositories analyzed successfully
- Average analysis time < 1 minute for typical projects
- Less than 5% timeout/failure rate
- User satisfaction with analysis completeness

## Notes for Solution Architect
- Consider using worker threads/background jobs for analysis (Supabase Edge Functions?)
- Need efficient file tree traversal algorithm
- Consider using tree-sitter for advanced code parsing (future enhancement)
- Plan for horizontal scaling if many users analyze simultaneously
