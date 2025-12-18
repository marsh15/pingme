```
# PingMe – Real-Time Anonymous Chat

PingMe is a privacy-first real-time chat application for instant, anonymous conversations. Create temporary rooms, share a link, and communicate—no signup required.

Live demo: https://pingme-realtime.vercel.app/

## Overview

PingMe focuses on simplicity and speed. Users can create a room, share the link, and start communicating in real time. All communication is ephemeral and backed by an in-memory data store to avoid long-term persistence.

## Features

- Instant room creation with unique room IDs  
- Join rooms via shareable links  
- Real-time communication with low latency  
- Anonymous usage with no authentication  
- Auto-expiring rooms (configurable TTL)
- Ephemeral data storage with automatic cleanup  
- Clean, minimalist interface with dark/light mode
- Optimized for performance and simplicity  

## How It Works

1. A user creates a room, generating a unique room ID.  
2. The room link is shared with another user.  
3. Messages are transmitted in real time via Redis pub/sub with WebSocket-like behavior.  
4. Data is stored temporarily and discarded after the session ends.  

## Tech Stack

Frontend  
- Next.js (App Router)  
- React  
- TypeScript  
- Tailwind CSS  

Backend / Realtime  
- Next.js API routes  
- Upstash Redis (REST-based realtime access)  

Tooling & Deployment  
- Bun  
- Vercel  

## Environment Variables

The following environment variables are required:

```
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

In Vercel, values must be added without quotes.

## Local Development

Clone the repository:

```
git clone git@github.com:marsh15/pingme.git
cd pingme
```

Install dependencies:

```
bun install
```

Create a `.env` file and add the required environment variables.

Run the development server:

```
bun dev
```

The app will be available at `http://localhost:3000`.

## Deployment

The project is optimized for deployment on Vercel.

1. Push the repository to GitHub  
2. Import the project into Vercel  
3. Add the required environment variables  
4. Deploy  

## Roadmap

- [ ] End-to-end encryption
- [ ] File sharing support
- [ ] Mobile app (React Native)
- [ ] Custom room expiry times

## License

MIT License
```
