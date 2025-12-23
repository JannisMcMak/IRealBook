# IRealBook

IRealBook is a web application for finding and viewing leadsheets of jazz standards. It works by uploading PDFs of Real Books or similar sheet music compilations, along with index files. The PDF is then stored in a way that allows for easy searching and viewing of individual tunes. The project is a small monorepo containing:

- A Svelte + Vite client (`@irealbook/app`) for browsing and viewing leadsheets and PDFs.
- An Express + TypeORM server (`@irealbook/server`) which exposes the API and manages the data.
- Shared TypeScript code and types (`@irealbook/shared`).

## What the project does

IRealBook stores leadsheets and related metadata for a large number of jazz standards. It lets you:
- Upload and automatically index Real Books.
- Browse and search your database of leadsheets.
- View leadsheets in the browser or on mobile via an installable PWA.
- Persist and manage the data using a simple SQLite-backed API.

## Providing Real Books
TODO

## Run with Docker

A Docker image is published on the GitHub Container Registry. The data is stored in `/app/data` inside the container, which can be mounted to a Docker volume for persistance.

```
docker volume create irealbook-data
docker run -d \
  --name irealbook \
  -p 3000:3000 \
  -v irealbook-data:/app/data \
  ghcr.io/jannismcmak/irealbook:latest
```

## Run locally

From the repository root:

1. Install dependencies (root of the monorepo):
    ```
    npm install
    ```
2. Build shared dependencies
    ```
    npm run build:shared
    ```
3. Run the frontend dev server:
    ```
    npm run dev -w @irealbook/app
    ```
    Open the Vite URL printed to the terminal (commonly `http://localhost:5173`).

4. Run the server in dev mode:
    ```
    npm run dev -w @irealbook/server
    ```
    The server defaults to listening on port `3000`.
