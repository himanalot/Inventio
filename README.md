# Inventio PDF Viewer

A powerful web application for document management, advanced PDF viewing, and research assistance. Built with Next.js and using Anara Labs Lector's PDF rendering capabilities.

## What is Inventio?

Inventio is a comprehensive document management and PDF viewing platform designed for researchers, students, and professionals who work extensively with PDF documents. It combines powerful search capabilities, annotation tools, and document organization features to enhance your research and learning experience.

## Key Features

### Advanced PDF Viewing
- **High-fidelity rendering** of complex PDF documents with support for scientific papers and technical documents
- **Responsive layout** that works across different screen sizes
- **Page thumbnails** for quick navigation through long documents
- **Multiple viewing modes** including single page, continuous scroll, and thumbnail view

### Powerful Search Capabilities
- **Full-text search** within documents with highlighted results
- **Semantic search** that understands context and meaning, not just keywords
- **Search across document library** to find content across all your uploaded documents
- **Fuzzy matching** to find similar terms and handle typos

### Document Annotations
- **Highlighting tools** with multiple colors for different categorization needs
- **Text selection** with precise rendering and annotation capabilities
- **Persistent annotations** that are saved between sessions
- **Annotation export** to share your research notes with colleagues

### Document Management
- **Secure document storage** with authentication
- **Document organization** by categories, tags, or custom collections
- **Document sharing** with controlled access
- **Version tracking** for updated documents

### User Experience
- **Secure authentication** via email/password or Google accounts
- **Responsive interface** that works on desktop and tablet devices
- **Keyboard shortcuts** for power users
- **Dark mode support** for comfortable reading in low-light environments

## Use Cases

### Academic Research
Perfect for researchers who need to review, annotate, and organize scientific papers. Search functionality helps discover connections between documents and build a comprehensive literature review.

### Student Learning
Students can upload course materials, textbooks, and lecture notes, then use the annotation and search tools to prepare for exams and write papers.

### Professional Document Management
Legal professionals, healthcare workers, and business analysts can manage, review, and extract information from contracts, medical literature, or business documents.

### Digital Library
Create your personal digital library with search capabilities that extend beyond what typical file systems offer.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **PDF Processing**: PDF.js via Anara Labs Lector library
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **3D Visualization**: Three.js (for document exploration features)
- **Deployment**: Railway

## Getting Started

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

### Authentication Setup

Inventio uses Supabase for authentication. You'll need to:
1. Create a Supabase project
2. Configure authentication providers (email/password, Google, etc.)
3. Add your Supabase URL and anon key to the `.env.local` file

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
     - Add Supabase configuration variables
     - Add any other environment variables defined in your `.env` file

4. **Customizations**
   - The application uses the `railway/railway.json` configuration
   - You can modify deployment settings in Railway's dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
