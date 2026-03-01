# ADR-002: Agent Swarm Architecture Implementation

## Status

Proposed

## Context

The project needs a more scalable and context-aware development process. Inspired by the "One-Person Dev Team" swarm architecture, we are moving from a single assistant model to a hierarchical multi-agent system.

## Decision

We will implement an Orchestration Layer (Zoe) that manages specialized coding agents (Codex, Claude, Gemini).

### Key Components:

1. **Zoe (Orchestrator):** The high-level strategy agent.
   - Context: Obsidian (via Pinecone), Prod DB (via Supabase), Meeting Notes.
   - Task: Scoping, prompt engineering for specialists, credit management.
2. **Coding Agents (Specialists):**
   - **Codex:** Backend, logic, complex refactors.
   - **Claude Code:** Frontend, Git operations, rapid feature dev.
   - **Gemini:** UI Design Spec, aesthetically superior interfaces.
3. **Workflow Automation:**
   - **Isolated Environments:** Git Worktrees (Windows compatible).
   - **Session Management:** PowerShell Background Jobs.
   - **Task Registry:** `.clawdbot/active-tasks.json`.
   - **Monitoring:** `check-agents.ps1` (Pulse/Ralph Loop V2).

## Consequences

### Positive

- **Context Separation:** Business context is handled by Zoe, code context by specialists.
- **Parallelism:** Multiple features can be developed simultaneously in different worktrees.
- **Automated Review:** PRs are auto-reviewed by all three models before human intervention.

### Negative

- **Resource Usage:** Multiple worktrees and parallel builds will heavily consume RAM/CPU.
- **Complexity:** Higher overhead for small tasks.

## Date

2026-02-24

## Authors

- Antigravity (AI Orchestrator)
