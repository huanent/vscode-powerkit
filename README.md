# PowerKit

Focused developer tools for VS Code.

## Features

- A dedicated PowerKit item in the Activity Bar.
- Notebook uses a Milkdown WYSIWYG Markdown editor and restores the last opened note.
- Note history, search, creation, switching, renaming, and deletion are available inside the Notebook Webview.
- Notes remain Markdown files in extension storage and save automatically after editing.
- JWT Token generates HS256 tokens, decodes token headers and payloads, and optionally verifies signatures.
- LaunchAgents on macOS lists user startup items from `~/Library/LaunchAgents`, shows launch status, and supports starting, stopping, creating, editing, and deleting agents.
- LaunchAgent configuration includes `RunAtLoad`, `KeepAlive`, `ThrottleInterval`, program arguments, environment variables, working directory, and output paths.

## Development

```bash
npm install
npm run build
```

Press `F5` in VS Code to build and open an Extension Development Host.
