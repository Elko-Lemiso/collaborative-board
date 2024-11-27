# Collaborative Board

A real-time collaborative whiteboard application that allows multiple users to draw, add stickers, and interact simultaneously.

## Features

- Real-time collaboration
- Drawing tools
- Sticker support
- User authentication
- Multiple board support
- Canvas zoom and pan
- Responsive design

## Tech Stack

- Next.js
- Socket.IO
- TypeScript
- Canvas API
- Tailwind CSS

## Prerequisites

- Node.js (v21 or higher)
- npm (v7 or higher)
- Git

## Installation

```bash
# Clone the repository
git clone git@github.com:Elko-Lemiso/collaborative-board.git

# Navigate to project directory
cd collaborative-board

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

if you see the following error:

```
../../src/server/patch-error-inspect.ts (36:9) @ canParse
```

run the following command:

```
nvm use 21
```

Next15 is not compatible with any version of Node.js below 21.

## Usage

- Visit `/auth` page in your browser
- Login with your preferred username
- Create a new board or join an existing one
- Start collaborating!

## Features Guide

### Drawing

- Use mouse to draw on canvas

### Stickers

- Upload custom stickers
- Drag and resize stickers
- Delete unwanted stickers

### Collaboration

- See other users' active on the board
- Real-time updates
- Join existing boards
