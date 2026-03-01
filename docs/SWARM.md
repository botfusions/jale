# 🐝 Agent Swarm: Open Claw Workflow

Bu döküman, Open Claw projesindeki otonom ajan swarm sisteminin nasıl kullanılacağını açıklar.

## 🏗️ Mimari Model

Sistem üç katmandan oluşur:

1.  **Zoe (Orchestrator):** CEO/Strategist. İş bağlamını (Pinecone/Obsidian) teknik ajanlara iletir.
2.  **Specialist Agents:**
    - **Codex:** Karmaşık mantık ve backend.
    - **Claude:** Ön yüz, hız ve Git işlemleri.
    - **Gemini:** UI/UX tasarımı ve estetik.
3.  **Automation (Pulse):** PowerShell tabanlı izleme ve PR yönetimi.

## 🔄 8 Adımlı Çalışma Akışı

### 1. Zoe ile Kapsamlama (Scoping)

Yeni bir özellik veya hata için Zoe ajanını tetikleyin. Zoe, Pinecone üzerinden geçmiş kararlarınızı okur ve ne yapılması gerektiğini planlar.

### 2. Ajanın Başlatılması (Spawning)

Zoe, görevi uygun ajana atar ve izole bir ortam (Git Worktree) oluşturur:

```powershell
.\.clawdbot\spawn-agent.ps1 -Id "custom-templates" -Agent "codex" -Prompt "Implement X..."
```

### 3. İzleme Döngüsü (Monitoring)

Sistem arka planda ajanları izler. `check-agents.ps1` scripti PR durumlarını ve CI sonuçlarını kontrol eder.

### 4. PR Oluşturma

Ajan işini bitirdiğinde otomatik olarak `gh pr create` ile PR açar.

### 5. Otomatik Kod İncelemesi (Review)

Her PR, diğer üç model tarafından (Codex, Claude, Gemini) incelenir ve yorumlanır.

### 6. Otomatik Test

CI pipeline'ı TypeScript kontrollerini ve testleri koşturur.

### 7. İnsan İncelemesi

Her şey onaylandığında Telegram veya log üzerinden bildirim alırsınız: "PR #341 hazır."

### 8. Merge & Cleanup

PR merge edildiğinde worktree otomatik olarak temizlenir.

## 🛠️ Araçlar ve Scriptler

- `.clawdbot/active-tasks.json`: Aktif görevlerin kayıt defteri.
- `.clawdbot/spawn-agent.ps1`: Yeni ajan ve worktree oluşturucu.
- `.clawdbot/check-agents.ps1`: Görev durum izleyici.
