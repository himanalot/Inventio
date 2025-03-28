# Inventio PDF Viewer

A Next.js application with PDF viewing capabilities using the Anara Labs Lector library.

## Railway Deployment Instructions

### Prerequisites
- GitHub account
- Railway account (https://railway.app)

### Deployment Steps

1. **Push this repository to GitHub**
   - Make sure to commit with the updated `.gitignore` file to exclude large files
   - Upload only necessary PDF files to keep the repository size manageable

2. **Deploy to Railway**
   - Visit https://railway.app
   - Create a new project
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository
   - Railway will automatically detect the Next.js project

3. **Environment Variables**
   - Add the following environment variables in Railway project settings:
     - `NODE_ENV`: set to `production`
     - `NEXT_PUBLIC_SITE_URL`: set to your Railway deployment URL (once available)
     - Add any other environment variables defined in your `.env` file

4. **Customizations**
   - The application uses the `railway/railway.json` configuration
   - You can modify deployment settings in Railway's dashboard

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features
- PDF viewing and navigation
- Document search functionality
- Thumbnail generation
- PDF annotations and highlights

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- Supabase (authentication)
- PDF.js (via Anara Labs Lector)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
