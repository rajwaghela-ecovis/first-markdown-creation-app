# PROJ-3: AI-Powered Documentation Generator

## Status: 🔵 Planned

## Overview
Use AI (OpenAI GPT-4, Anthropic Claude, or configurable provider) to analyze repository code and generate comprehensive markdown documentation including project overview, architecture, API docs, component docs, and setup guides.

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication) - for accessing repos
- **Requires:** PROJ-2 (Repository Analysis Engine) - for structured code data

## User Stories

### As a developer documenting my project
- I want AI to generate a comprehensive README based on my code
- I want AI to explain what each major component/module does
- I want AI to document my API endpoints automatically
- I want AI to generate a setup/installation guide
- I want to choose which AI provider to use (OpenAI, Claude, etc.)
- I want to regenerate specific sections without redoing the entire documentation

### As a team lead onboarding new developers
- I want AI to generate architecture documentation showing how components interact
- I want AI to identify and document the main data flows
- I want AI to explain the project's tech stack and why it was chosen
- I want documentation that's easy to understand for junior developers

### As a user with limited AI credits
- I want to see estimated token usage before generating docs
- I want to generate only specific sections (not everything at once)
- I want to use cached results when possible to save costs

## Acceptance Criteria

### AI Provider Configuration
- [ ] User can select AI provider: OpenAI, Anthropic Claude, or Custom API
- [ ] User can enter their own API key for chosen provider
- [ ] System validates API key before starting generation
- [ ] System shows estimated cost/tokens for documentation generation
- [ ] User can set default provider in settings
- [ ] System falls back to default provider if user hasn't configured one

### Documentation Generation Types
- [ ] **Project Overview** - High-level description, purpose, target users
- [ ] **Architecture Documentation** - Component structure, data flow, design patterns
- [ ] **API Documentation** - All endpoints, request/response formats, authentication
- [ ] **Component/Module Documentation** - Purpose and usage of each major component
- [ ] **Setup & Installation Guide** - Step-by-step setup instructions
- [ ] **Tech Stack Explanation** - Technologies used and why

### Generation Process
- [ ] User can select which documentation types to generate (checkboxes)
- [ ] System shows progress for each documentation section
- [ ] Generation completes within 2 minutes for typical projects
- [ ] User can cancel generation at any time
- [ ] Partial results are saved if generation is cancelled
- [ ] System shows real-time preview as each section completes

### Documentation Quality
- [ ] Generated docs are accurate (match actual code)
- [ ] Generated docs are well-structured with proper markdown formatting
- [ ] Generated docs include code examples where relevant
- [ ] Generated docs explain complex logic in simple terms
- [ ] Generated docs include diagrams (mermaid syntax) for architecture
- [ ] Generated docs are consistent in tone and style

### Customization Options
- [ ] User can set documentation tone (Technical, Beginner-friendly, Concise)
- [ ] User can specify target audience (Developers, Managers, End-users)
- [ ] User can provide custom instructions (e.g., "Focus on security features")
- [ ] User can edit AI-generated content inline
- [ ] User can regenerate specific sections with different parameters

### Caching & Efficiency
- [ ] System caches generated documentation for 7 days
- [ ] System detects if code changed since last generation
- [ ] System offers to regenerate only changed sections
- [ ] System shows "Last generated: X days ago" timestamp

## Edge Cases

### API Key Issues
- **What happens if user's API key is invalid?**
  - Validate key before starting generation
  - Show error: "Invalid API key. Please check your settings."
  - Provide link to get API key from provider

- **What happens if user runs out of API credits mid-generation?**
  - Detect insufficient credits error from provider
  - Save partial results
  - Show message: "API credits exhausted. Please add credits and retry."
  - Allow user to continue with different provider

### Generation Failures
- **What happens if AI generates incorrect/hallucinated information?**
  - Add disclaimer: "AI-generated documentation. Please review for accuracy."
  - Allow user to report inaccuracies
  - Provide "Regenerate" button for each section
  - Show confidence score if available from AI provider

- **What happens if AI times out during generation?**
  - Retry up to 3 times with exponential backoff
  - If still failing, save partial results
  - Show error: "Generation timeout. Please try again or select fewer sections."

### Large Codebases
- **What happens if repository is too large for AI context window?**
  - Split analysis into chunks (e.g., by folder/module)
  - Generate documentation section by section
  - Show warning: "Large codebase. Documentation will be generated in multiple passes."
  - Estimate total time and cost

- **What happens if single file is > 10,000 lines?**
  - Summarize large files instead of including full content
  - Focus on public APIs and main functions
  - Show warning: "Large file detected. Documentation may be incomplete."

### Content Quality Issues
- **What happens if AI generates very generic documentation?**
  - Allow user to provide more context/instructions
  - Offer "Regenerate with more detail" option
  - Use code analysis data from PROJ-2 to provide better context to AI

- **What happens if AI uses wrong terminology or framework names?**
  - Validate against detected frameworks from PROJ-2
  - Correct obvious mistakes automatically (e.g., "React.js" → "React")
  - Allow user to provide glossary/terminology guide

### Rate Limiting
- **What happens if AI provider rate limit is hit?**
  - Queue generation for later
  - Show message: "Rate limit reached. Generation will resume in X minutes."
  - Offer option to switch to different provider

- **What happens if multiple users generate docs simultaneously?**
  - Implement queue system (first-come, first-served)
  - Show queue position: "You are #3 in queue. Estimated wait: 2 minutes."
  - Process up to 5 generations in parallel

### Empty or Minimal Code
- **What happens if repository has very little code?**
  - Generate documentation based on available code
  - Show message: "Limited code detected. Documentation may be brief."
  - Focus on setup guide and project goals

- **What happens if code has no comments or documentation?**
  - AI infers purpose from code structure and naming
  - Show note: "No inline comments found. Documentation is AI-inferred."
  - Suggest adding comments for better results

## Technical Requirements

### Performance
- Generate documentation for typical project (< 100 files) in under 2 minutes
- Stream results as they're generated (don't wait for everything)
- Use parallel processing for independent sections
- Cache results for 7 days to avoid regeneration

### AI Integration
- Support OpenAI GPT-4 / GPT-4 Turbo
- Support Anthropic Claude 3 (Opus, Sonnet, Haiku)
- Support custom OpenAI-compatible APIs
- Use streaming responses for real-time updates
- Implement retry logic with exponential backoff

### Prompt Engineering
```markdown
System Prompt Template:
You are a technical documentation expert. Analyze the provided code repository and generate comprehensive documentation.

Repository Context:
- Name: {repo_name}
- Languages: {languages}
- Frameworks: {frameworks}
- File Structure: {file_tree}
- Dependencies: {dependencies}

Task: Generate {doc_type} documentation

Requirements:
- Use clear, {tone} language
- Target audience: {audience}
- Include code examples where relevant
- Use markdown formatting
- {custom_instructions}
```

### Data Storage (Supabase)
```sql
-- generated_documentation table
- id (uuid, primary key)
- repository_id (uuid, foreign key to repositories)
- analysis_id (uuid, foreign key to repository_analyses)
- ai_provider (enum: openai, anthropic, custom)
- ai_model (text) -- e.g., gpt-4-turbo, claude-3-opus
-
- project_overview (text, markdown)
- architecture_docs (text, markdown)
- api_documentation (text, markdown)
- component_docs (jsonb) -- {component_name: markdown_content}
- setup_guide (text, markdown)
- tech_stack_explanation (text, markdown)
-
- generation_settings (jsonb) -- tone, audience, custom_instructions
- tokens_used (integer)
- estimated_cost (decimal)
- generation_time_seconds (integer)
-
- status (enum: pending, generating, completed, failed, cancelled)
- error_message (text, nullable)
-
- created_at (timestamp)
- updated_at (timestamp)
```

### Cost Management
- Estimate tokens before generation (show to user)
- Track actual tokens used per generation
- Show running cost total in user dashboard
- Implement monthly usage limits (configurable)

## Dependencies
- **Requires:** PROJ-1 (Repository Connection & Authentication)
- **Requires:** PROJ-2 (Repository Analysis Engine)

## Out of Scope (Future Features)
- Video documentation generation
- Interactive documentation (runnable code examples)
- Multi-language documentation (translations)
- Automated documentation updates on every commit
- Documentation quality scoring
- Custom AI model fine-tuning

## Success Metrics
- 90% of generated documentation is accurate (user validation)
- Average generation time < 2 minutes
- 80% of users satisfied with documentation quality
- Less than 10% regeneration rate (due to poor quality)
- Average cost per documentation generation < $0.50

## Notes for Solution Architect
- Consider using Supabase Edge Functions for AI API calls (avoid exposing keys to frontend)
- Implement token counting before API calls (tiktoken for OpenAI)
- Need robust error handling for AI API failures
- Consider implementing documentation versioning (track changes over time)
- Plan for A/B testing different prompts to improve quality
