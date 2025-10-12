# 🚀 RAJ AI APP BUILDER

Production-grade AI-powered React application generator using Cerebras AI. Modern two-screen UI with a marketing landing page and a builder workspace featuring live code and app previews plus a bottom-anchored chat editor.

## Features

- **Real-time AI Generation**: Stream React/TSX as it's generated
- **Live Previews**: Side-by-side code editor and Sandpack app preview
- **Bottom Chat Editor**: Prompt at the bottom to iterate on the app
- **Refresh Controls**: One-click refresh for code and preview panes
- **Modern UI**: Unified color palette, responsive, accessible design
- **Production Ready**: TypeScript, ESLint, and optimized Next.js build

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajshah9305/AIRajAPP.git
   cd AIRajAPP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Cerebras API key to .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CEREBRAS_API_KEY` | Cerebras Cloud API key | Yes |

Get your API key from [Cerebras Cloud](https://cloud.cerebras.ai).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Cerebras AI (llama3.1-8b) via `@cerebras/cerebras_cloud_sdk`
- **Preview**: `@codesandbox/sandpack-react`
- **Icons**: `lucide-react`

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run validate     # Run all checks
```

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rajshah9305/AIRajAPP)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**RAJ** - [GitHub](https://github.com/raj)