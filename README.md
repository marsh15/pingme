
# pingMe

Privacy-first real-time anonymous chat rooms.

pingMe allows users to instantly create temporary chat rooms, share a link, and communicate in real time without accounts, emails, or long-term data storage.

Live demo: https://pingme-realtime.vercel.app/

---

## Overview

pingMe is designed for fast, ephemeral communication. It uses a serverless architecture and an in-memory Redis-based realtime layer to deliver low-latency messaging while avoiding persistent storage.

---

## Features

- Create temporary chat rooms instantly
- Join rooms via shareable links
- Real-time message delivery with low latency
- Anonymous usage with no authentication
- Automatic message expiration using TTL
- Clean interface with dark and light mode support

---

## Architecture

- Next.js App Router handles all client requests
- Upstash Redis manages realtime events and room state
- Messages are stored in memory with TTL-based cleanup
- No long-term persistence or user data storage

---

## Privacy Model

- No user accounts or identifiers
- No emails, usernames, or passwords
- Messages expire automatically
- Room data exists only during the session
- No analytics or message content tracking

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Bun
- Upstash Redis
- Vercel

---

## Environment Variables

Create a `.env` file with the following values:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
````

When adding these in Vercel, values must be set without quotes.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/marsh15/pingme.git
cd pingme
```

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Open the application in your browser
2. Create a new room
3. Share the generated link
4. Chat in real time until the session expires


---

## Limitations

* Designed for short-lived communication only
* Not intended for large public chat rooms
* End-to-end encryption is not implemented


---

## License

This project is licensed under the MIT License.  
See the LICENSE file for details.

