# IRealBook

**IRealBook** is a web application for managing and exploring a library of jazz standard leadsheets. It works by uploading PDFs of Real Books or similar sheet music compilations, along with index files. The PDF is then stored in a way that allows for easy searching and viewing of individual tunes. The project is a small monorepo containing:

- A Svelte + Vite client (`@irealbook/app`) for browsing and viewing leadsheets and PDFs.
- An Express + TypeORM server (`@irealbook/server`) which exposes the API and manages the library.
- Shared TypeScript code and types (`@irealbook/shared`).

## What the project does

**IRealBook** can store leadsheets and related metadata for a large number of jazz standards. It lets you:

- Upload and automatically index Real Books through the management portal ([Docs](#providing-real-books)).
- Browse and search your database of leadsheets.
- View leadsheets in the browser or on mobile via an installable PWA.
- Persist and manage the data using a simple SQLite-backed API.

## Run with Docker

A Docker image is published on the GitHub Container Registry. The data is stored in `/app/data` inside the container, which can be mounted to a Docker volume for persistance.

```
docker volume create irealbook-data
docker run -d \
  --name irealbook \
  -p 3000:3000 \
  -e JWT_SECRET change_this_to_a_long_random_string \
  -e AUTH_PASSWORD supersecretpassword \
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
    npm run build:deps
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

## Managing the instance (Providing Real Books)

The leadsheet library can be managed using the **IRealBook** management portal available at `http(s)://[SERVER_URL]/manage` (e.g. `http://localhost:3000/manage` when running locally).

### Adding a source

A _source_ is a single music book (e.g., Jazz Real/Fake Book) uploaded as a single PDF file, along with a `.csv` file containing an index table of all tunes in the book with page numbers.
New sources can be added via the "Add Source" form.

### Obtaining index tables

There are various public projects that provide lists of indeces for many Real/Fake Books.

- https://www.seventhstring.com/fbindex.html
- https://github.com/aspiers/book-indices
- https://github.com/trebb/realbook

### Index table format

The index table needs to be a `.csv` **without** headers with **3** columns:

1. Tune name
2. Start page (Normal 1-based numbering)
3. End page (Optional, defaults to same value as start page)

For example, the entries below would suggest that Autumn Leaves can be found on page 40, while Body and Soul takes up 2 pages (41 and 42).

```csv
Autumn Leaves,40,40
Body and Soul,41,42
```
