# 🚀 RAJ AI APP BUILDER

Enterprise-grade AI-powered React application generator using Cerebras AI.

## Features

- **Real-time AI Generation**: Stream React components as they're generated
- **Live Preview**: Interactive component preview with Sandpack
- **Modern UI**: Responsive design with Tailwind CSS
- **Production Ready**: TypeScript, ESLint, and optimized build

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/raj/raj-ai-app-builder.git
   cd raj-ai-app-builder
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
| `CEREBRAS_API_KEY` | Your Cerebras AI API key | Yes |

Get your API key from [Cerebras Cloud](https://cloud.cerebras.ai).

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Cerebras AI (gpt-oss-120b)
- **Preview**: Sandpack React
- **Icons**: Lucide React

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/raj/raj-ai-app-builder)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**RAJ** - [GitHub](https://github.com/raj)