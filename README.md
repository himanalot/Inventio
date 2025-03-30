# Inventio - Academic Research Platform

A comprehensive platform for academic research, literature review, and scholarly collaboration with advanced document management capabilities. Built with Next.js and powered by cutting-edge document processing technology.

## What is Inventio?

Inventio is an academic research platform designed for researchers, scholars, and students to transform how they discover, organize, and extract insights from academic literature. Moving beyond basic document viewing, Inventio enables structured research workflows, facilitates literature review, and enhances academic collaboration through intelligent document management and analysis tools.

## Key Features

### Research Workflow Optimization
- **Literature organization** by research topic, theoretical framework, or methodology
- **Citation management** to track and export references for academic papers
- **Research notes** attached directly to source materials
- **Progress tracking** across multiple research projects

### Academic Knowledge Discovery
- **Semantic search across literature** to find related concepts, not just keywords
- **Cross-reference identification** to discover connections between papers
- **Concept mapping** to visualize relationships between research findings
- **Gap analysis** to identify under-researched areas in your field

### Collaborative Scholarship
- **Shared collections** for research teams and lab groups
- **Collaborative annotations** with comment threads
- **Permission management** for different team member roles
- **Version control** for evolving research documents

### Advanced Document Analysis
- **Intelligent document summarization** of key findings and methodology
- **Figure and table extraction** from research papers
- **Citation network visualization** to understand influential works
- **Statistical data extraction** from research findings

### Research Output Support
- **Literature review assistance** with categorization tools
- **Citation formatting** in multiple academic styles (APA, MLA, Chicago, etc.)
- **Export functionality** for notes and annotations
- **Integration with reference managers** like Zotero or Mendeley

## Document Management Capabilities
- **High-fidelity rendering** of complex academic papers with mathematical notation
- **Full-text search** within documents with relevance ranking
- **Multi-document comparison** for literature review
- **Annotation and highlighting** with categorization by research themes
- **Document organization** by research project, course, or topic
- **Secure storage** with encryption for sensitive research data

## Primary Use Cases

### Academic Research
Perfect for researchers conducting literature reviews, analyzing scholarly papers, and managing research projects. Organize hundreds of papers into meaningful collections with searchable annotations and shared team access.

### Graduate Studies
Graduate students can manage course readings, dissertation research, and teaching materials in one place. Track research progress and maintain comprehensive literature reviews throughout degree programs.

### Scientific Collaboration
Research teams can create shared document libraries with collaborative annotations, reducing duplication of effort and enhancing knowledge transfer between team members.

### Academic Writing
Streamline the process of writing research papers, theses, and dissertations with organized literature, accessible annotations, and easy citation management.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Document Processing**: PDF.js via Anara Labs Lector library
- **Knowledge Management**: Custom semantic indexing
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
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
