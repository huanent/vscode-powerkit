# PowerKit

Focused developer tools for VS Code.

## Features

- A dedicated PowerKit item in the Activity Bar.
- Notebook uses a Milkdown WYSIWYG Markdown editor and restores the last opened note.
- Note history, search, creation, switching, renaming, and deletion are available inside the Notebook Webview.
- Notes remain Markdown files in extension storage and save automatically after editing.
- .gitignore Generator creates or updates `.gitignore` files from 185 curated operating system, language, editor, framework, and tool templates while preserving custom rules. Generation works fully offline.
- LaunchAgents on macOS lists user startup items from `~/Library/LaunchAgents`, shows launch status, and supports starting, stopping, creating, editing, and deleting agents.
- LaunchAgent configuration includes `RunAtLoad`, `KeepAlive`, `ThrottleInterval`, program arguments, environment variables, working directory, and output paths.
- Run Script executes and debugs JavaScript and TypeScript files, including untitled editors, runs single-file C# programs with `dotnet run --file`, and runs shell scripts from the Explorer or PowerKit view.
- Run npm Script discovers folders with package scripts and provides an Explorer menu for choosing a script to run.
- XML formatting supports VS Code's Format Document command and follows the editor's indentation and line-ending settings.

## Development

```bash
npm install
npm run build
```

Press `F5` in VS Code to build and open an Extension Development Host.
