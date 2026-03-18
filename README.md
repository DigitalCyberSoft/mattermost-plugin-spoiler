# Mattermost Spoiler Tags Plugin

Discord-style spoiler tags for Mattermost. Hide text behind a clickable "SPOILER" label using `||hidden text||` syntax.

## Features

- **Inline spoiler syntax** — Wrap any text in `||double pipes||` to hide it behind a spoiler tag
- **Multi-line spoilers** — Spoilers spanning multiple lines collapse to a single "SPOILER" label
- **Click to reveal** — Click the spoiler to show the hidden content, click again to re-hide
- **`/spoiler` slash command** — Wraps your entire message in spoiler tags
- **Hide code blocks** — Wrap code blocks in `||` to collapse debug output, stack traces, etc. behind a spoiler
- **Non-destructive** — Messages are stored as-is with `||text||` in the database; the plugin only transforms the display

## Usage

### Inline spoilers

```
The answer to the puzzle is ||42||
```

This displays as: `The answer to the puzzle is` **SPOILER**

### Multi-line and code block spoilers

Hide verbose output like stack traces or debug info:

~~~
Error on server 10.0.0.1
||
```
NullPointerException: Cannot invoke method on null reference
  at com.example.app.UserService.getProfile(UserService.java:43)
  at com.example.app.ApiController.handleRequest(ApiController.java:87)
```
||
~~~

Everything between the `||` markers collapses to a single **SPOILER** label until clicked.

### Slash command

```
/spoiler The butler did it
```

Posts the message as `||The butler did it||`, which renders as a spoiler.

## Installation

### Requirements

- Mattermost Server 10.0.0+
- Go 1.24+ (for building the server component)
- Node.js 18+ and npm (for building the webapp component)

### Build from source

```bash
git clone <repo-url>
cd mattermost-plugin-spoiler
make all
```

This produces `dist/com.github.mattermost-plugin-spoiler-1.0.0.tar.gz`.

### Install on Mattermost

**Via System Console (recommended):**

1. Enable plugin uploads: **System Console > Plugin Management > Enable Plugin Uploads**
2. Upload the `.tar.gz` file under **Upload Plugin**
3. Enable the plugin

**Via mmctl:**

```bash
mmctl --local plugin add dist/com.github.mattermost-plugin-spoiler-1.0.0.tar.gz
mmctl --local plugin enable com.github.mattermost-plugin-spoiler
```

## How it works

| Component | Role |
|-----------|------|
| **Server (Go)** | Registers the `/spoiler` slash command. Wraps the message in `\|\|` and creates a regular post. |
| **Webapp (JS/CSS)** | Uses a `MutationObserver` to detect rendered posts containing `\|\|text\|\|` and replaces them with clickable spoiler elements. |

Messages are never modified in the database. If the plugin is removed, users simply see the raw `||text||` markers.

## Project structure

```
mattermost-plugin-spoiler/
  plugin.json              # Plugin manifest
  Makefile                 # Build automation
  server/
    main.go                # Server entry point
    plugin.go              # /spoiler command handler
  webapp/
    src/
      index.js             # Plugin init, MutationObserver, click handler
      spoiler_hook.js      # DOM transformation logic
      spoiler.css           # Hidden/revealed styling
    webpack.config.js
    package.json
```

## License

Apache 2.0
