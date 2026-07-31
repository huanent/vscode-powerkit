# PowerKit

A VS Code Activity Bar collection of focused developer tools.

## Features

- A dedicated PowerKit item in the Activity Bar.
- A feature list designed to grow as more tools are added.
- Network opens as a dedicated editor webview from the feature list.
- The overview shows the public IP, address version, hostname, operating system, DNS servers, local interfaces, and last refresh time.
- Refresh and clipboard copy actions for the public IP.
- Generators for Unix timestamps, UUID v4 values, and secure random passwords.

## Requirements

The Network view needs internet access to retrieve the public IP address.

## Development

```bash
npm install
npm run build
```

Press `F5` in VS Code to build and open an Extension Development Host.
