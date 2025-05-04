# Night Crows Growth Ranking Search

A web application to search and display growth rankings for Night Crows characters. This project uses a Node.js backend and a Tailwind CSS-powered frontend.

![Sample interface showing the character search and ranking display](/public/sample.jpg)
_Sample interface demonstrating the character search functionality and ranking display_

## Features

- 🔍 Search character rankings by IGN (In-Game Name)
- 🌏 Support for multiple regions (ASIA I, ASIA II, NA/EU, SA)
- 📊 Display detailed character information:
  - Rank
  - Growth Rate
  - Realm
  - Region
  - Guild
  - Guild Union
- ⭐ Bookmark favorite characters for quick access
- 🚀 Fast search with debouncing
- 💾 Local storage for saved bookmarks
- 🔄 Caching mechanism to reduce API calls
- 🛡️ Rate limiting protection

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nc-ranking
   ```
2. Install dependency
   ```bash
   npm install
   ```
3. Start developing
   ```bash
   npm run dev
   ```

## Project Structure

```
nc-ranking/
├── public/              # Static assets
│   ├── index.html      # Main HTML file
│   ├── script.js       # Frontend JavaScript
│   ├── sample.jpg      # Sample screenshot
│   └── favicon.ico     # Site favicon
├── utils/              # Utility functions and constants
│   └── constants.js    # Shared constants
├── server.js           # Express server setup
├── .env               # Environment variables (private)
├── .env.sample        # Environment variables template
└── package.json       # Project dependencies
```

## API Endpoints

### GET /api/growth

Search for character growth rankings

- Query Parameters:
  - `ign`: Character name (required)
  - `regionCode`: Server region code (default: 0)
- Response: JSON containing character ranking data

### GET /api/metadata

Get server regions and configuration data

- Response: JSON containing regions, weapon types, and ranking types

### GET /api/giphy-key

Get Giphy API key for meme generation

- Response: JSON containing API key

## Environment Variables

Copy `.env.sample` to `.env` and configure:

```
GIPHY_API_KEY=your-giphy-api-key    # Required for meme feature
PORT=3000                           # Optional, defaults to 3000
```

## Caching and Rate Limiting

- API responses are cached until midnight
- Rate limiting: 100 requests per 5 minutes per IP
- Local storage used for bookmark persistence

## Deployment

The application is deployed on Render.com. To deploy:

1. Push to your Git repository
2. Connect repository to Render
3. Configure environment variables
4. Deploy with following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`

## Support

If you find this tool helpful, you can:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange.svg)](https://buymeacoffee.com/ralmariano)
