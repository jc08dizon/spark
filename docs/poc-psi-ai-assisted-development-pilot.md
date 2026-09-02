# POC Reference: PSI AI-Assisted Development Pilot

This note distills the source document `POC_ PSI AI-Assisted Development Pilot.docx` into a repository reference for future framework improvements.

## Source Context

- Version: 1.0
- Date: July 2026
- Owner: Process Solutions and Innovation (PSI)
- Collaboration: AI & Automation Lead Officer
- Pilot duration: One academic term

## Executive Intent

PSI is introducing AI-assisted development as a second software delivery framework alongside the existing no-code/low-code approach. No-code/low-code remains the preferred path for many standard internal systems, while AI-assisted development is intended for projects with greater complexity, larger datasets, custom integrations, AI-enabled features, scalability needs, or long-term maintainability requirements.

The POC validates whether PSI can use a dual development framework with clear intake, governance, engineering standards, collaboration practices, quality assurance, deployment controls, and reusable AI engineering assets.

## POC Objectives

- Validate when no-code/low-code or AI-assisted development is the right approach.
- Establish a standard AI-assisted software development workflow from intake through support.
- Validate the collaboration model between PSI and the AI & Automation Lead Officer.
- Define foundational engineering standards for GitHub workflow, coding, documentation, and repository structure.
- Build reusable assets such as Codex skills, agents, prompt libraries, templates, and development guidelines.
- Measure delivery efficiency, code quality, maintainability, and team readiness.

## Dual Development Framework

PSI should assess each project during intake and assign it to the most appropriate path.

| Criteria | No-Code / Low-Code | AI-Assisted Development |
| --- | --- | --- |
| Primary purpose | Rapid internal systems and workflow automation | Scalable custom applications |
| Best fit | Forms, approvals, dashboards, CRUD apps, internal portals | Complex workflows, AI-enabled systems, public apps, integrations, large databases |
| Stack | Airtable, Softr, Fillout, n8n when needed | Codex, Next.js, PostgreSQL, GitHub, n8n, Docker, Hostinger |
| Development style | Configuration-driven | Code-driven with AI assistance |
| Customization | Limited to platform capabilities | High flexibility |
| Scalability | Low to medium complexity | Medium to high complexity |
| Data storage | Platform subscription limits | Relational database, primarily PostgreSQL |
| Integrations | Standard connectors, webhooks, APIs | Custom APIs, webhooks, enterprise integrations |

## Collaboration Model

Project ownership remains with PSI. The AI & Automation Lead Officer owns governance, standards, and quality oversight for AI-assisted development.

| Role | Primary responsibilities |
| --- | --- |
| Developer | Build approved requirements, implement features, maintain code, prepare technical documentation, perform unit testing, and fix QA issues. |
| PSI Lead | Manage project delivery, assess projects, recommend the development framework, oversee solution architecture, review deliverables, approve no-code/low-code deployments, and keep projects aligned with PSI standards and timelines. |
| AI & Automation Lead Officer | Establish AI-assisted development standards, provide AI implementation guidance, review AI-assisted projects, oversee prompt engineering practices, approve QA/deployment for AI-assisted projects, and improve AI engineering practices over time. |

## POC Scope

In scope:

- Two to three AI-assisted pilot projects.
- Project Intake GPT and Dev Strategy Assistant.
- AI-assisted planning, architecture, development, QA, deployment, and post-implementation evaluation.
- GitHub repository, workflow, engineering standards, coding standards, and documentation standards.
- Collaboration model between PSI and the AI & Automation Lead Officer.
- Evaluation of delivery, quality, and team readiness.

Out of scope:

- Organization-wide implementation.
- Migration of existing no-code/low-code systems.
- Full replacement of no-code/low-code.
- Enterprise-wide AI adoption.
- Mission-critical systems such as finance, registrar, or ERP.
- Fully autonomous AI development without human review.
- Institutional policy changes outside the pilot.

## Proposed Pilot Projects

| Pilot | Purpose | What it validates |
| --- | --- | --- |
| Ticketing System | Centralized request and issue management across departments | Workflow automation, approvals, notifications, dashboards, reusable process components |
| CIIT Digital Archive & Gallery | Repository for student artworks and academic outputs | Large-scale file storage, metadata, search, access control, database scalability |
| Room Booking System | Classroom and facility reservations | Scheduling, calendar integration, conflict detection, approvals, real-time availability |

## Technical Baseline

- AI-assisted development: OpenAI Codex
- Application framework: Next.js
- Database: PostgreSQL
- Version control: GitHub
- Workflow automation: n8n when required
- Hosting: Hostinger VPS
- Containerization: Docker

Framework implication: this repository should continue to optimize around Next.js, TypeScript, PostgreSQL, Prisma, GitHub review flow, Docker-based local setup, Codex skills, and clear deployment documentation.

## Standard AI-Assisted Workflow

1. Approved project brief
2. Dev Strategy Agent creates the implementation plan
3. Repository setup with docs, branch protection, standards, and structure
4. Feature branch creation
5. Developer works with Codex
6. Local development and testing
7. Commit and push
8. Pull request
9. Peer review
10. QA / UAT approval
11. Merge to main
12. Production deployment
13. Technical documentation updates
14. Production support

## Branching Strategy

- `main`: stable production-ready code only
- `feature/*`: feature, enhancement, or bug work
- `hotfix/*`: urgent production fixes
- `develop`: optional integration branch for larger projects
- `release/*`: optional stabilization branch before production

Framework implication: this template currently uses `dev`, `staging`, and `main`. Future improvements should reconcile the POC's branch model with the repository's existing `dev -> staging -> main` workflow so builders receive one clear rule set.

## Engineering Principles

- Start with an approved project brief and technical plan.
- Use AI to accelerate work, not replace engineering review.
- Require peer review and QA/UAT before deployment.
- Keep production changes traceable through GitHub.
- Update technical documentation before completion.
- Convert each completed project into reusable knowledge, templates, prompts, or components.

## Success Criteria

- Two to three pilot systems are completed and evaluated.
- The dual development framework is validated across different use cases.
- The AI-assisted workflow is implemented and documented.
- GitHub workflow, coding standards, documentation standards, and repository structure are adopted.
- PSI and AI & Automation Lead Officer responsibilities are validated and refined.
- Project Intake GPT, Dev Strategy Agent, prompt library, and reusable templates are created and used.
- Lessons learned and implementation challenges are documented.
- PSI is ready to expand AI-assisted development beyond the initial pilot.

## Risks To Account For

- Developer learning curve
- Inconsistent AI output
- Prompt quality variation
- Security and code quality risks
- Governance and process maturity gaps
- Scope creep
- Unrealistic expectations
- Technology and infrastructure challenges

Framework implication: guardrails, skills, prompts, quality gates, onboarding docs, and privacy checks are not optional extras. They are the risk controls that make the POC viable.

## Framework Improvement Backlog

Use this POC as context when prioritizing future work:

- Add a project intake decision guide for no-code/low-code vs AI-assisted development.
- Add a Dev Strategy Assistant workflow or skill that produces architecture, database, module, and repository plans.
- Expand prompt library guidance for planning, development, QA, documentation, and review.
- Add deployment documentation for Hostinger VPS and Docker-based production setup.
- Clarify branch strategy across the POC and this template.
- Add project evaluation templates for pilot retrospectives and lessons learned.
- Add onboarding docs for PSI developers and vibe coders.
- Add reusable feature patterns for ticketing, archive/gallery, and room booking systems.
- Keep human review, QA/UAT, privacy review, and deployment approval explicit in every workflow.
