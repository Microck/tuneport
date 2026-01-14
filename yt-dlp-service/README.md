# yt-dlp-service

A lightweight, self-hosted API wrapper for `yt-dlp` designed for the TunePort extension. It handles YouTube downloads, audio extraction, and temporary file management.

## Features

-   **Authenticated**: Secure access via Bearer token.
-   **Auto-cleanup**: Automatically deletes downloaded files after a configurable TTL (default 15 mins).
-   **Dockerized**: Easy to deploy with Docker Compose.
-   **Bot Bypass**: Includes `deno` and cookie support for bypassing YouTube's bot detection.

## Prerequisites

-   Docker & Docker Compose
-   (Optional) A `cookies.txt` file from your browser (for bypassing YouTube bot detection).

## Quick Start

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/Microck/tuneport.git
    cd tuneport/yt-dlp-service
    ```

2.  **Configure Authentication:**
    Edit `docker-compose.yml` and set a secure `YTDLP_TOKEN`. You will need to enter this token in the TunePort extension settings.

    ```yaml
    environment:
      - YTDLP_TOKEN=my-secret-token-123
    ```

3.  **(Optional) Add Cookies:**
    If you encounter "Sign in to confirm you're not a bot" errors, you need to provide cookies.
    -   Export your YouTube cookies to a `cookies.txt` file (using an extension like "Get cookies.txt LOCALLY").
    -   Place the file in `yt-dlp-service/config/cookies.txt`.

4.  **Start the Service:**
    ```bash
    docker-compose up -d --build
    ```

5.  **Verify:**
    Check if the service is running:
    ```bash
    curl http://localhost:3001/health
    # {"status": "ok"}
    ```

## TunePort Configuration

1.  Open TunePort Extension Settings.
2.  Set **Download Provider** to `yt-dlp`.
3.  Set **Instance URL** to your server URL (e.g., `http://localhost:3001` or your public HTTPS URL).
4.  Set **API Token** to the token you defined in `docker-compose.yml`.

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `YTDLP_TOKEN` | **Required.** Bearer token for authentication. | (None) |
| `PUBLIC_BASE_URL` | URL where the service is accessible externally. Used for generating file links. | `https://yt.micr.dev` |
| `TOKEN_TTL_SECONDS` | Time in seconds before a downloaded file is deleted. | `900` (15 mins) |
| `COOKIE_PATH` | Path to cookies file inside container. | `/config/cookies.txt` |
