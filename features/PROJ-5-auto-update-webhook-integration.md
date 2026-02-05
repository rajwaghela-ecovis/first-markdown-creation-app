# PROJ-5: Auto-Update & Webhook Integration

## Status: 🔵 Planned

## Overview
Automatically update documentation when repository code changes using webhooks (GitHub, GitLab) and scheduled updates. Supports both manual regeneration and automatic updates.

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication) - for repo access
- **Requires:** PROJ-2 (Repository Analysis Engine) - for detecting changes
- **Requires:** PROJ-3 (AI-Powered Documentation Generator) - for regenerating docs

## User Stories

### As a developer with active projects
- I want documentation to update automatically when I push code changes
- I want to receive notifications when documentation is updated
- I want to see what changed in the documentation (diff view)
- I want to configure update frequency (immediate, daily, weekly)
- I want to pause auto-updates temporarily

### As a team lead managing multiple projects
- I want to set up webhooks once and forget about it
- I want to see update history for all projects
- I want to be notified if auto-update fails
- I want to manually trigger updates for specific projects

### As a user concerned about costs
- I want to limit auto-updates to save AI API costs
- I want to approve updates before they're generated (manual approval mode)
- I want to see estimated cost before each auto-update
- I want monthly cost reports

## Acceptance Criteria

### Webhook Setup
- [ ] User can enable webhooks for GitHub repositories
- [ ] User can enable webhooks for GitLab repositories
- [ ] System generates unique webhook URL for each repository
- [ ] System provides webhook setup instructions (copy-paste ready)
- [ ] Webhook URL includes secret token for security
- [ ] System validates webhook signature (GitHub/GitLab standard)
- [ ] User can test webhook connection (send test event)

### Auto-Update Modes
- [ ] **Immediate** - Update docs on every push (default)
- [ ] **Smart** - Update only if significant changes detected (> 10 files changed)
- [ ] **Scheduled** - Update daily/weekly at specified time
- [ ] **Manual Approval** - Queue updates, user approves before generation
- [ ] User can change mode anytime
- [ ] Mode is configurable per repository

### Change Detection
- [ ] System detects which files changed in commit
- [ ] System identifies if changes affect documentation (code files vs. config)
- [ ] System shows summary: "15 files changed, 8 relevant for docs"
- [ ] System skips update if only non-code files changed (e.g., .gitignore)
- [ ] System detects if README was manually edited (don't overwrite)

### Update Process
- [ ] System queues update when webhook received
- [ ] System shows update status: Queued → Analyzing → Generating → Complete
- [ ] System re-runs repository analysis (PROJ-2)
- [ ] System regenerates affected documentation sections only (not everything)
- [ ] System completes update within 5 minutes
- [ ] User can cancel queued updates

### Notifications
- [ ] User receives email when documentation is updated
- [ ] User receives in-app notification (bell icon)
- [ ] Notification includes summary of changes
- [ ] Notification includes link to view updated docs
- [ ] User can configure notification preferences (email on/off, in-app on/off)
- [ ] User can mute notifications for specific repositories

### Update History
- [ ] System logs all updates (manual and automatic)
- [ ] User can view update history per repository
- [ ] History shows: timestamp, trigger (webhook/manual/scheduled), status, changes
- [ ] User can compare documentation versions (before/after diff)
- [ ] User can rollback to previous documentation version
- [ ] History is paginated (show 20 updates per page)

### Cost Management
- [ ] System estimates cost before each auto-update
- [ ] User can set monthly budget limit (e.g., $10/month)
- [ ] System pauses auto-updates if budget exceeded
- [ ] User receives warning at 80% budget usage
- [ ] User can view cost breakdown per repository
- [ ] User can view total monthly spend

### Manual Updates
- [ ] User can manually trigger update from dashboard
- [ ] User can force full regeneration (ignore cache)
- [ ] User can select specific sections to regenerate
- [ ] Manual updates bypass budget limits (user explicitly requested)

## Edge Cases

### Webhook Failures
- **What happens if webhook delivery fails?**
  - GitHub/GitLab will retry automatically (up to 3 times)
  - Log failed webhook attempts
  - Show warning in dashboard: "Webhook delivery failed. Check configuration."

- **What happens if webhook secret is invalid?**
  - Reject webhook with 401 Unauthorized
  - Log security warning
  - Notify user: "Unauthorized webhook attempt detected"

### Rapid Commits
- **What happens if user pushes 10 commits in 5 minutes?**
  - Debounce updates (wait 5 minutes after last commit)
  - Show message: "Multiple commits detected. Update scheduled in 5 minutes."
  - Generate documentation once for all commits combined

- **What happens if update is already running when new webhook arrives?**
  - Queue new update (don't start immediately)
  - Show status: "Update queued (1 in queue)"
  - Process queue sequentially

### Large Changes
- **What happens if 500+ files changed in one commit?**
  - Show warning: "Large commit detected. Update may take 10+ minutes."
  - Estimate cost and show to user
  - In "Manual Approval" mode, require explicit approval
  - Process in background (don't block other updates)

- **What happens if entire codebase is refactored?**
  - Treat as full regeneration (don't try to detect changes)
  - Show message: "Major changes detected. Regenerating all documentation."
  - May take longer and cost more

### Budget Limits
- **What happens if auto-update would exceed monthly budget?**
  - Pause update
  - Send notification: "Auto-update paused. Monthly budget ($10) reached."
  - Offer options: "Increase budget" or "Wait until next month"
  - User can manually trigger update (bypasses limit)

- **What happens if budget is exceeded mid-update?**
  - Complete current update (don't leave partial docs)
  - Pause future auto-updates
  - Notify user of budget exceeded

### Webhook Configuration Issues
- **What happens if user deletes webhook from GitHub/GitLab?**
  - Detect missing webhook on next push (no event received)
  - Show warning: "Webhook appears to be deleted. Auto-updates disabled."
  - Provide re-setup instructions

- **What happens if repository is made private after webhook setup?**
  - Webhook continues to work (uses existing auth)
  - If auth expires, show error: "Access denied. Please reconnect repository."

### Scheduling Issues
- **What happens if scheduled update fails (e.g., API down)?**
  - Retry 3 times with exponential backoff
  - If still failing, skip this scheduled update
  - Notify user: "Scheduled update failed. Will retry tomorrow."
  - Log error for debugging

### Concurrent Updates
- **What happens if user manually triggers update while auto-update is running?**
  - Show message: "Update already in progress. Please wait."
  - Disable manual update button until current update completes

## Technical Requirements

### Performance
- Process webhook within 5 seconds (acknowledge receipt)
- Complete documentation update within 5 minutes
- Support 100+ concurrent webhook events
- Queue processing: 5 updates in parallel max

### Webhook Implementation
- Use Supabase Edge Functions for webhook endpoints
- Endpoint: `https://your-app.supabase.co/functions/v1/webhook/{repo-id}`
- Validate GitHub webhook signature (HMAC SHA-256)
- Validate GitLab webhook token
- Return 200 OK immediately (process async)

### Scheduling
- Use Supabase pg_cron or external cron service
- Support time zones (user's local time)
- Daily updates: run at 2 AM user's timezone
- Weekly updates: run on Sunday at 2 AM

### Data Storage (Supabase)
```sql
-- auto_update_settings table
- id (uuid, primary key)
- repository_id (uuid, foreign key to repositories)
- enabled (boolean, default false)
- mode (enum: immediate, smart, scheduled, manual_approval)
- schedule (text, nullable) -- cron expression for scheduled mode
- webhook_url (text, unique)
- webhook_secret (text, encrypted)
- monthly_budget_usd (decimal, default 10.00)
- current_month_spend (decimal, default 0.00)
- notifications_enabled (boolean, default true)
- email_notifications (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

-- update_history table
- id (uuid, primary key)
- repository_id (uuid, foreign key to repositories)
- trigger_type (enum: webhook, manual, scheduled)
- trigger_data (jsonb) -- commit SHA, author, message, files changed
- status (enum: queued, analyzing, generating, completed, failed, cancelled)
- files_changed (integer)
- sections_regenerated (jsonb) -- [overview, api, architecture]
- tokens_used (integer)
- cost_usd (decimal)
- started_at (timestamp)
- completed_at (timestamp, nullable)
- error_message (text, nullable)
```

### Webhook Security
- Validate signature using webhook secret
- Use HTTPS only
- Rate limit: 100 webhooks per repo per hour
- Log suspicious activity (invalid signatures)

### Cost Tracking
- Track tokens used per update
- Calculate cost based on AI provider pricing
- Reset monthly spend on 1st of each month
- Send monthly cost report email

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication)
- **Requires:** PROJ-2 (Repository Analysis Engine)
- **Requires:** PROJ-3 (AI-Powered Documentation Generator)

## Out of Scope (Future Features)
- Slack/Discord notifications
- Custom webhook endpoints (user-defined)
- Conditional updates (only update if tests pass)
- Documentation approval workflow (team review before publish)
- Integration with CI/CD pipelines
- Multi-branch documentation (separate docs for main, dev, staging)

## Success Metrics
- 95% webhook delivery success rate
- Average update completion time < 3 minutes
- 80% of users enable auto-updates
- Less than 5% budget overruns
- 90% user satisfaction with update reliability

## Notes for Solution Architect
- Use Supabase Edge Functions for webhook endpoints (serverless, scalable)
- Implement job queue (consider using pg_boss or external service like BullMQ)
- Need robust retry logic for failed updates
- Consider rate limiting to prevent abuse
- Plan for webhook replay (in case of failures)
- Implement idempotency (same webhook received twice should not duplicate work)
