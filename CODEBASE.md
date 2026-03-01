# CODEBASE.md

> **Auto-generated project context.** Refreshed on every session start.

---

## Project Info

| Property | Value |
|----------|-------|
| **Project** | `Open Claw` |
| **Framework** | `express` |
| **Type** | `node` |
| **OS** | Windows |
| **Path** | `c:\Users\user\Downloads\Z.ai_claude code\Open Claw` |

---

## Project Structure

> **Legend:** `file.ts <- A.tsx, B.tsx` = This file is **imported by** A.tsx and B.tsx.
> Directories with `[N files: ...]` are summarized to reduce size.
> [STATS] Showing 306 files. 18 dirs summarized, 14 dirs excluded (node_modules, etc.)


```
.agent/
  agent.md
  claude-specialist.md
  codex.md
  gemini-specialist.md
  zoe.md
.claude/
  settings.local.json
.clawdbot/
  active-tasks.json
  check-agents.ps1
  spawn-agent.ps1
.gemini/
  antigravity/
    brain/
      1180ee1e-5c0d-4080-950f-7b55016e4b30/
        reality_check_agent_renaming.md
architecture_reports/
  open_claw_borsa_architecture.md
borsaci/
  .dockerignore
  .env.example
  .gitignore
  DOCKER.md
  Dockerfile
  LICENSE
  README.md
  docker-compose.yml
  pyproject.toml
  run_query.py
  src/
    borsaci/
      __init__.py
      agent.py
      buffett_agent.py
      cli.py
      cloudcode_provider.py
      config.py
      google_oauth_provider.py
      mcp_tools.py
      model.py
      oauth.py
      prompts.py
      schemas.py
      updater.py
      utils/
        __init__.py
        charts.py
        loading.py
        logger.py
        ui.py
    borsaci.egg-info/
      PKG-INFO
      SOURCES.txt
      dependency_links.txt
      entry_points.txt
      requires.txt
      top_level.txt
docs/ [6 files: 6 .md]
gogcli/
  .github/ [2 files: 2 .yml]
  .gitignore
  .golangci.yml
  .goreleaser.yaml
  .lefthook.yml
  AGENTS.md
  CHANGELOG.md
  LICENSE
  Makefile
  README.md
  cmd/
    gog/
      main.go
  docs/ [18 files: 13 .md, 2 .css, 1 no-ext]
  go.mod
  go.sum
  internal/
    authclient/
      authclient.go
    cmd/ [408 files: 408 .go]
    config/
      aliases.go
      clients.go
      config.go
      credentials.go
      keys.go
      paths.go
    errfmt/
      errfmt.go
    googleapi/ [28 files: 28 .go]
    googleauth/ [24 files: 20 .go, 4 .html]
    input/
      prompt.go
      readline.go
    outfmt/
      outfmt.go
    secrets/
      keychain_darwin.go
      keychain_other.go
      store.go
    timeparse/
      parse.go
    tracking/
      config.go
      crypto.go
      deploy.go
      pixel.go
      secrets.go
      worker/
        package.json
        pnpm-lock.yaml
        schema.sql
        src/
          bot.ts ← bot.test.ts, index.ts
          crypto.ts ← crypto.test.ts, index.ts
          index.ts ← test_borsa.ts, index.ts
          pixel.ts ← index.ts
          types.ts ← crypto.ts, index.ts
        tsconfig.json
        wrangler.toml
    ui/
      ui.go
  scripts/
    gen-auth-services-md.go
    live-chat-test.sh
    live-test.sh
    live-tests/
      calendar.sh
      classroom.sh
      common.sh
      contacts.sh
      core.sh
      docs.sh
      drive.sh
      gmail.sh
      people.sh
      sheets.sh
      slides.sh
      tasks.sh
      workspace.sh
    release.sh
    verify-release.sh
memory/
  conversations.json
  core_memory.md
  memory_log.md
  soul.md
src/
  agents/
    borsaci-agent.ts ← heartbeat.ts, borsa.skill.ts
    ceo-agent.ts ← message.handler.ts
    coo-agent.ts ← message.handler.ts
    receptionist-agent.ts ← vapi-webhook.ts
  commands/
    calendar.commands.ts ← index.ts
    index.ts ← test_borsa.ts, index.ts
    mail.commands.ts ← index.ts
    skill.commands.ts ← index.ts
    tool.commands.ts ← index.ts
    voice.commands.ts ← index.ts
  config/
    constants.ts ← index.ts, tool.commands.ts, message.handler.ts +2 more
    env.ts ← index.ts, self-test.ts, doctor.ts +11 more
  doctor/
    doctor.ts ← tool.commands.ts
  handlers/
    message.handler.ts ← index.ts
  index.ts ← test_borsa.ts, index.ts
  llm/
    light-rag.ts
    openrouter.ts ← borsaci-agent.ts, ceo-agent.ts, coo-agent.ts +6 more
  mcp/
    calendar.ts ← calendar.commands.ts
    gmail.ts ← mail.commands.ts
    mcp-bridge.ts
  memory/
    conversation-store.ts ← index.ts, message.handler.ts
    core.memory.ts ← self-test.ts, receptionist-agent.ts, message.handler.ts +1 more
    mem0.ts
    vector.service.ts ← self-test.ts, receptionist-agent.ts, message.handler.ts
  scheduler/
    heartbeat.ts ← index.ts, test_heartbeat.ts, tool.commands.ts
  security/
    __tests__/ [1 files: 1 .ts]
    agent-guard.ts ← ceo-agent.ts
    rate-limiter.ts ← message.handler.ts, rate-limiter.test.ts
  skills/
    borsa.skill.ts ← test_borsa.ts, index.ts
    briefing.skill.ts ← index.ts
    index.ts ← test_borsa.ts, index.ts
    marketing.skill.ts ← index.ts
    researcher.skill.ts ← message.handler.ts, index.ts
    skill-manager.ts ← ceo-agent.ts, borsa.skill.ts, briefing.skill.ts +9 more
    software.skill.ts ← index.ts
    translator.skill.ts ← index.ts
    weather.skill.ts ← heartbeat.ts, briefing.skill.ts, index.ts
    web-search.skill.ts ← index.ts
    yargi.skill.ts ← index.ts
  telegram/
    bot.ts ← index.ts, message.handler.ts
  transcription/
    transcriber.ts ← self-test.ts, message.handler.ts
  tts/
    tts.service.ts ← index.ts, self-test.ts, message.handler.ts
  utils/
    logger.ts ← index.ts, test_heartbeat.ts, borsaci-agent.ts +35 more
    metrics.ts ← doctor.ts, message.handler.ts
    retry.ts ← light-rag.ts, openrouter.ts, vector.service.ts
  webhook/
    index.ts ← test_borsa.ts, index.ts
    vapi-webhook.ts ← index.ts, index.ts
summarize/
  .github/ [3 files: 3 .yml]
  .gitignore
  .npmrc
  .oxfmtrc.jsonc
  .oxlintrc.json
  AGENTS.md
  CHANGELOG.md
  Dockerfile.test
  LICENSE
  README.md
  RELEASING.md
  apps/
    chrome-extension/
      README.md
      docs/ [1 files: 1 .md]
      package.json
      playwright.config.ts
      public/ [4 files: 4 .png]
      src/
        automation/
          artifacts-store.ts ← repl.ts, tools.ts, background.ts
          ask-user-which-element.ts ← tools.ts
          default-skills.json ← skills-store.ts
          navigate.ts ← repl.ts, tools.ts
          repl.ts ← tools.ts
          skills-store.ts ← navigate.ts, repl.ts, skills.ts +3 more
          skills.ts ← tools.ts
          tools.ts ← main.ts
          userscripts.ts ← repl.ts, main.ts
        entrypoints/
          automation.content.ts
          background.ts
          extract.content.ts
          hover.content.ts
          options/
            index.html
            logs-viewer.ts ← main.ts
            main.ts
            pickers.tsx ← main.ts
            processes-viewer.ts ← main.ts
            style.css
          sidepanel/
            chat-controller.ts ← main.ts
            chat-state.ts ← sidepanel.chat-state.test.ts, chat-controller.ts, main.ts
            error-controller.ts ← main.ts
            header-controller.ts ← main.ts
            index.html
            main.ts
            panel-cache.ts ← main.ts
            pickers.tsx ← main.ts
            slide-images.ts ← sidepanel.slide-images.loader.test.ts, sidepanel.slide-images.test.ts, main.ts
            slides-hydrator.ts ← main.ts
            slides-stream-controller.ts ← slides-hydrator.ts
            stream-controller.ts ← main.ts
            style.css
            types.ts ← sidepanel.chat-state.test.ts, chat-controller.ts, chat-state.ts +3 more
        lib/
          agent-response.ts ← background.ts
          chat-context.ts ← background.ts
          combo.ts ← main.ts, main.ts, pickers.tsx
          daemon-payload.ts ← background.ts
          daemon-recovery.ts ← background.ts
          extension-logs.ts ← background.ts, logs-viewer.ts, slide-images.ts
          header.ts ← main.ts
          media-duration.ts ← extract.content.ts
          metrics.ts ← main.ts
          seek.ts ← chrome.seek.test.ts, extract.content.ts
          settings.ts ← sidepanel.slide-images.loader.test.ts, tools.ts, background.ts +6 more
          sse.ts ← tools.ts, background.ts, agent-response.ts +3 more
          status.ts ← header-controller.ts
          theme.ts ← settings.ts, main.ts, pickers.tsx +2 more
          token.ts ← main.ts
        ui/
          portal.ts ← pickers.tsx, pickers.tsx
          scheme-chips.tsx ← pickers.tsx, pickers.tsx
          zag-checkbox.tsx ← main.ts, main.ts
          zag-select.tsx ← pickers.tsx, pickers.tsx
      tests/ [2 files: 1 .ts, 1 .md]
      tsconfig.json
      wxt.config.ts
  docs/ [46 files: 22 .md, 13 .html, 5 .png]
  package.json
  packages/ [77 files: 74 .ts, 2 .json, 1 .md]
  pnpm-lock.yaml
  pnpm-workspace.yaml
  scripts/
    bench-tokenization.mjs
    build-bun.js
    build-cli.mjs
    docs-list.ts
    release.sh
  src/
    cache.ts
    cli-main.ts
    cli.ts
    config.ts
    content/
      asset.ts
      index.ts ← test_borsa.ts, index.ts
    costs.ts
    daemon/ [19 files: 19 .ts]
    firecrawl.ts
    flags.ts
    index.ts ← test_borsa.ts, index.ts
    language.ts
    llm/
      attachments.ts
      cli.ts
      errors.ts
      generate-text.ts
      google-models.ts
      html-to-markdown.ts
      model-id.ts
      prompt.ts
      providers/
        anthropic.ts
        google.ts
        models.ts
        openai.ts
        shared.ts
        types.ts
      transcript-to-markdown.ts
      types.ts
      usage.ts
    logging/
      daemon.ts
      ring-file.ts
    markitdown.ts
    media-cache.ts
    model-auto.ts
    model-spec.ts
    pricing/
      litellm.ts
    processes.ts
    prompts/
      index.ts ← test_borsa.ts, index.ts
    refresh-free.ts
    run.ts
    run/ [53 files: 53 .ts]
    shared/
      contracts.ts
      sse-events.ts
      streaming-merge.ts
    slides/
      extract.ts
      index.ts ← test_borsa.ts, index.ts
      settings.ts
      store.ts
      types.ts
    tty/
      format.ts
      osc-progress.ts
      progress/
        fetch-html.ts
        transcript.ts
      spinner.ts
      theme.ts
      website-progress.ts
    version.ts
  tests/ [295 files: 295 .ts]
  tsconfig.base.json
  tsconfig.build.json
  vitest.config.ts
tests/ [2 files: 2 .ts]
yargi-cli/
  .github/ [1 files: 1 .yml]
  .gitignore
  README.md
  README.tr.md
  package-lock.json
  package.json
  src/
    clients/
      base-client.ts
      bedesten-client.ts
    commands/
      bedesten/
        doc.ts
        index.ts ← test_borsa.ts, index.ts
        search.ts
    converters/
      html-to-markdown.ts
    enums/
      chambers.ts
    index.ts ← test_borsa.ts, index.ts
    types/
      bedesten.ts
      common.ts
    utils/
      date.ts
  tsconfig.json
```


## File Dependencies

> Scanned 645 files

### High-Impact Files

*Files imported by multiple other files:*

| File | Imported by |
|------|-------------|
| `summarize/src/run.js` | 85 files |
| `src/utils/logger` | 38 files |
| `summarize/src/content/index.js` | 36 files |
| `summarize/src/config.js` | 32 files |
| `summarize/tests/helpers/pi-ai-mock.js` | 32 files |


---

*Auto-generated by Maestro session hooks.*
