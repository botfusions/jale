# yargi-cli

CLI tool for Turkish legal databases. Designed for AI agents and programmatic use.

> **Origin**: This project is the CLI counterpart of [yargi-mcp](https://github.com/saidsurucu/yargi-mcp), a Python-based MCP server that provides access to Turkish legal databases. While yargi-mcp serves LLM applications via the Model Context Protocol, yargi-cli provides the same capabilities as a standalone command-line tool — JSON output, pipe-friendly, zero authentication.

🌍 [Türkçe README](./README.tr.md)

## Why?

AI agents (LLM tool-use, autonomous coding agents, RAG pipelines) need a simple, predictable interface to query Turkish court decisions. yargi-cli provides:

- **JSON-only output** — every command writes structured JSON to stdout
- **Pipe-friendly** — chain with `jq`, `xargs`, or any Unix tool
- **Rich `--help`** — parameter descriptions, search operators, output schemas, and examples are embedded in help text so agents can self-discover the API
- **No auth, no config** — just install and call

## Supported Databases

Currently implements the **Bedesten** module (bedesten.adalet.gov.tr):

| Court Type       | Flag                | Description                                  |
| ---------------- | ------------------- | -------------------------------------------- |
| `YARGITAYKARARI` | `-c YARGITAYKARARI` | Yargıtay (Court of Cassation)                |
| `DANISTAYKARAR`  | `-c DANISTAYKARAR`  | Danıştay (Council of State)                  |
| `YERELHUKUK`     | `-c YERELHUKUK`     | Local Civil Courts                           |
| `ISTINAFHUKUK`   | `-c ISTINAFHUKUK`   | Civil Courts of Appeals                      |
| `KYB`            | `-c KYB`            | Extraordinary Appeals (Kanun Yararına Bozma) |

Chamber filtering supports 79 codes covering all Yargıtay/Danıştay divisions. Run `yargi bedesten search --help` for the full list.

## Installation

```bash
# Requires Node.js >= 24
npm install -g @saidsrc/yargi
```

Or run from source:

```bash
git clone https://github.com/saidsurucu/yargi-cli.git
cd yargi-cli
npm install
npm run build
node bin/yargi.js bedesten search "test"
```

## Usage

### Search decisions

```bash
# Basic search (defaults: Yargıtay + Danıştay, page 1)
yargi bedesten search "mülkiyet hakkı"

# Filter by court type and chamber
yargi bedesten search "iş kazası" -c YARGITAYKARARI -b H9

# Date range filter
yargi bedesten search "kamulaştırma" --date-start 2024-01-01 --date-end 2024-12-31

# Multiple court types
yargi bedesten search "idari para cezası" -c DANISTAYKARAR YARGITAYKARARI

# Pagination
yargi bedesten search "tazminat" -p 3
```

### Get full decision text

```bash
# Fetch document as Markdown
yargi bedesten doc 1123588300

# Extract just the markdown content
yargi bedesten doc 1123588300 | jq -r '.markdownContent'
```

### Pipe examples

```bash
# Get first result's document ID
yargi bedesten search "mülkiyet hakkı" | jq -r '.decisions[0].documentId'

# Search → get first result's full text
yargi bedesten search "mülkiyet hakkı" \
  | jq -r '.decisions[0].documentId' \
  | xargs yargi bedesten doc

# Get all case numbers from a search
yargi bedesten search "iş kazası" -c YARGITAYKARARI | jq '[.decisions[] | .esasNo]'
```

### Search operators

| Operator      | Example                | Effect                 |
| ------------- | ---------------------- | ---------------------- |
| Simple        | `"mülkiyet hakkı"`     | Finds both words       |
| Exact phrase  | `"\"mülkiyet hakkı\""` | Finds exact phrase     |
| Required term | `"+mülkiyet hakkı"`    | Must contain mülkiyet  |
| Exclude       | `"mülkiyet -kira"`     | mülkiyet but not kira  |
| AND           | `"mülkiyet AND hak"`   | Both required          |
| OR            | `"mülkiyet OR tapu"`   | Either acceptable      |
| NOT           | `"mülkiyet NOT satış"` | mülkiyet but not satış |

> Wildcards (`*`, `?`), regex, fuzzy search (`~`), and proximity search are **not** supported.

## Output Schemas

### Search output

```json
{
  "decisions": [
    {
      "documentId": "1123588300",
      "itemType": { "name": "YARGITAYKARARI", "description": "Yargıtay Kararı" },
      "birimAdi": "1. Hukuk Dairesi",
      "esasNo": "2023/6459",
      "kararNo": "2024/7158",
      "kararTarihiStr": "26.12.2024",
      "kararTarihi": "2024-12-25T21:00:00.000+00:00"
    }
  ],
  "totalRecords": 1988,
  "requestedPage": 1,
  "pageSize": 10,
  "searchedCourts": ["YARGITAYKARARI"]
}
```

### Document output

```json
{
  "documentId": "1123588300",
  "markdownContent": "**1. Hukuk Dairesi  2023/6459 E. ...**\n\n...",
  "sourceUrl": "https://mevzuat.adalet.gov.tr/ictihat/1123588300",
  "mimeType": "text/html"
}
```

## For AI Agents

This CLI is designed to be called by AI agents as a tool. Key points:

1. **Self-documenting**: Run `yargi bedesten search --help` or `yargi bedesten doc --help` to get full parameter descriptions, valid values, output schemas, and usage examples
2. **Predictable output**: Always JSON to stdout, errors included as `{"error": "..."}` with non-zero exit code
3. **No interactive prompts**: Never asks for input, never writes to stderr for progress
4. **Stateless**: Each invocation is independent, no sessions or cookies

### Typical agent workflow

```
1. yargi bedesten search "<query>" [-c ...] [-b ...] [--date-start ...] [--date-end ...]
2. Parse JSON → extract documentId from decisions array
3. yargi bedesten doc <documentId>
4. Parse JSON → use markdownContent for analysis
```

## Dependencies

| Package     | Purpose                    |
| ----------- | -------------------------- |
| `commander` | CLI framework              |
| `turndown`  | HTML → Markdown conversion |

No HTTP libraries — uses Node.js native `fetch`. No UI libraries — output is raw JSON.

## License

MIT
