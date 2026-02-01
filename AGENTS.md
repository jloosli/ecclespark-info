# AGENTS.md - Ecclespark.info Repository Guide

## Project Overview

**Repository**: jloosli/ecclespark-info  
**Purpose**: A Hugo-based static website for the Eccles Park Ward (LDS congregation) that provides ward information, announcements, and livestream access for sacrament meetings.  
**Live Site**: https://ecclespark.info/  
**License**: MIT

### Key Functionality

- **Weekly Sacrament Meeting Livestreams**: YouTube livestream integration for Sunday services
- **Ward Announcements**: Dynamic content management for ward communications
- **Broadcast Management**: Integration with Mevo cameras and YouTube Studio for live broadcasting
- **Data-Driven Content**: Uses YAML data files for easy content updates

## Technology Stack

### Core Technologies

- **Static Site Generator**: Hugo v0.140.2 (extended version with Dart Sass support)
- **Programming Languages**: Go (Hugo modules), TypeScript, JavaScript
- **Frontend Framework**: React 19
- **Styling**: 
  - Tailwind CSS
  - PostCSS with Autoprefixer
  - SCSS/Sass
  - modern-normalize CSS reset
- **Data Sources**:
  - YAML data files (`data/week.yml`, `data/meetings.yml`)
  - Airtable API integration
  - Firebase Realtime Database
- **APIs**:
  - Google YouTube Data API
  - Google Accounts API (gapi)
  - Airtable API

### Development & Deployment

- **Containerization**: Docker with docker-compose
- **CI/CD**: GitHub Actions
- **Hosting**: 
  - Firebase Hosting (primary)
  - GitHub Pages (secondary)
- **Version Control**: Git/GitHub

## Repository Structure

```
ecclespark-info/
├── .github/
│   └── workflows/
│       └── hugo.yml              # CI/CD pipeline for build & deployment
├── archetypes/                   # Hugo content templates
├── assets/                       # Source files (CSS, TypeScript)
├── content/                      # Markdown content files
│   └── _index.md                # Homepage with announcements
├── data/                         # YAML data files
│   ├── week.yml                 # Weekly livestream links & schedule
│   └── meetings.yml             # Meeting information
├── layouts/                      # Hugo templates
│   ├── _default/                # Default layouts
│   ├── index.html              # Homepage template
│   └── partials/               # Reusable template components
├── static/                       # Static assets (images, compiled CSS)
│   ├── css/                     # Compiled stylesheets
│   └── images/                  # Image assets (from Undraw)
├── config.toml                   # Hugo configuration
├── docker-compose.yml            # Docker container configuration
├── package.json                  # Node.js dependencies
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
├── firebase.json                 # Firebase hosting configuration
├── go.mod / go.sum              # Go module dependencies
└── README.md                     # Basic documentation
```

## Development Workflow

### Local Development

1. **Using Docker (Recommended)**:
   ```bash
   docker-compose up server
   ```
   - Runs Hugo server in a container
   - Site available at http://localhost:1313
   - Watches for file changes and auto-reloads

2. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Configure API keys and credentials:
     - `HUGO_CLIENT_ID` - Google OAuth client ID
     - `HUGO_API_KEY` - YouTube Data API key
     - `HUGO_CHANNEL_ID` - YouTube channel ID
     - `HUGO_STREAM_ID` - YouTube stream ID
     - `HUGO_API_PROJECT_ID` - Google API project ID
     - `HUGO_AIRTABLE_READ_WRITE_TOKEN` - Airtable API token (read/write)
     - `HUGO_AIRTABLE_READ_TOKEN` - Airtable API token (read-only)
     - `HUGO_AIRTABLE_BASE` - Airtable base ID

3. **Building Assets**:
   ```bash
   npm install
   npm run build  # Compiles Tailwind CSS with PostCSS
   ```

### Weekly Content Updates

**Every Week (before Sunday)**:

1. **Create YouTube Livestream**:
   - Go to [YouTube Studio Livestreaming](https://studio.youtube.com/channel/UCbq1hkTjdy6dKzQmbLDQk9g/livestreaming)
   - Set up a new Sacrament Meeting livestream
   - Copy the livestream link

2. **Update Week Data File** (`data/week.yml`):
   ```yaml
   date: 2024-01-07  # Next Sunday's date
   week: odd         # or "even"
   sacrament: https://youtube.com/live/xxxxx  # Livestream URL
   ```

3. **Update Announcements** (`content/_index.md`):
   - Edit markdown content with current ward announcements
   - Hugo will rebuild automatically

**Sunday Broadcast Procedure**:

1. Set up camera, cables, and equipment
2. Start Mevo Camera broadcast (via cellphone app)
3. Log in to [YouTube Studio](https://studio.youtube.com/channel/UCbq1hkTjdy6dKzQmbLDQk9g/livestreaming) (laptop)
4. Start the YouTube broadcast when meeting begins
5. **During Sacrament**: Stop the Mevo Camera feed
6. **After Sacrament**: Restart the Mevo Camera feed
7. **End of Meeting**: Shut down in reverse order
   - Stop YouTube broadcast (laptop) - account for broadcast delay
   - Stop Mevo broadcast (cellphone)

## CI/CD Pipeline

### GitHub Actions Workflow (`hugo.yml`)

**Trigger**: Push to `main` branch or manual dispatch

**Jobs**:

1. **Build**:
   - Installs Hugo v0.140.2 Extended
   - Installs Dart Sass
   - Checks out repository with submodules
   - Installs Node.js dependencies
   - Builds site with Hugo (minified)
   - Environment variables injected from GitHub Secrets
   - Uploads artifacts for deployment

2. **Deploy to GitHub Pages**:
   - Deploys built site to GitHub Pages
   - Creates deployment environment

3. **Deploy to Firebase**:
   - Downloads build artifacts
   - Deploys to Firebase Hosting (live channel)
   - Uses Firebase service account for authentication

**Required Secrets**:
- `HUGO_CLIENT_ID` - Google OAuth client ID
- `HUGO_API_KEY` - YouTube Data API key
- `HUGO_CHANNEL_ID` - YouTube channel ID
- `HUGO_STREAM_ID` - YouTube stream ID
- `HUGO_API_PROJECT_ID` - Google API project ID
- `HUGO_AIRTABLE_READ_WRITE_TOKEN` - Airtable API (read/write)
- `HUGO_AIRTABLE_READ_TOKEN` - Airtable API (read-only)
- `HUGO_AIRTABLE_BASE` - Airtable base ID
- `FIREBASE_SERVICE_ACCOUNT_ECCLESPARK_INFO` - Firebase service account JSON
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Architecture & Design Patterns

### Content Management

- **Hugo Content System**: Markdown files in `content/` directory
- **Data-Driven Pages**: YAML data files in `data/` for dynamic content
- **Template Hierarchy**: Hugo's template lookup order for flexible layouts

### Styling Approach

- **Utility-First CSS**: Tailwind CSS for rapid UI development
- **PostCSS Pipeline**: Processes Tailwind directives and autoprefixes CSS
- **Modern Baseline**: modern-normalize for consistent cross-browser styling
- **Custom Theming**: Accent color `#3F51B5` (Material Design Indigo)

### Asset Management

- **Images**: Sourced from [Undraw.co](https://undraw.co/search) for illustrations
- **Static Files**: Served directly from `static/` directory
- **Compiled Assets**: PostCSS output goes to `public/build/`

### React Integration

- React components integrated into Hugo templates
- TypeScript for type safety
- Google APIs client library for authentication and data access

## Hugo Configuration

Key settings in `config.toml`:

```toml
baseURL = "https://ecclespark.info/"
languageCode = "en-us"
title = "Eccles Park Ward Information"
disableKinds = ["taxonomy", "term"]  # Simplified structure
```

**Hugo Modules**:
- `github.com/sindresorhus/modern-normalize` - CSS normalization

## Development Guidelines

### Code Style

- **TypeScript**: Follow TypeScript best practices, use strict mode
- **React**: Functional components with hooks
- **CSS**: Prefer Tailwind utilities over custom CSS
- **Hugo Templates**: Use semantic HTML and Go template syntax

### Adding New Features

1. **New Pages**: Add markdown files to `content/`
2. **New Layouts**: Create templates in `layouts/`
3. **Styling Changes**: Modify Tailwind configuration or add utilities
4. **Data Updates**: Edit YAML files in `data/`
5. **Build**: Test locally with Docker before committing

### Testing Locally

```bash
# Start development server
docker-compose up server

# Build production version
docker-compose run build

# Build Tailwind CSS
npm run build
```

### Deployment Process

1. Commit changes to `main` branch
2. GitHub Actions automatically:
   - Builds the site
   - Deploys to Firebase Hosting
   - Deploys to GitHub Pages
3. Verify deployment at https://ecclespark.info/

## Common Tasks

### Updating Dependencies

```bash
# Node.js dependencies
npm update
npm audit fix

# Hugo modules
hugo mod get -u
hugo mod tidy

# Check Go dependencies
go get -u ./...
go mod tidy
```

### Adding New Images

1. Search for illustrations at [Undraw.co](https://undraw.co/search)
2. Download SVG with accent color `#3F51B5`
3. Place in `static/images/`
4. Reference in templates or content with `/images/filename.svg`

### Modifying Styles

1. Edit Tailwind classes in Hugo templates
2. For custom styles, add to `assets/` directory
3. Run `npm run build` to recompile
4. Test locally before committing

### Troubleshooting

**Hugo Build Fails**:
- Check Hugo version (must be 0.140.2 Extended)
- Verify all Hugo modules are available
- Check for syntax errors in templates

**Styles Not Updating**:
- Run `npm run build` to recompile Tailwind
- Clear browser cache
- Check PostCSS configuration

**Livestream Not Showing**:
- Verify `data/week.yml` has correct URL
- Check API keys are configured
- Ensure YouTube livestream is public/unlisted

## External Resources

- **Hugo Documentation**: https://gohugo.io/documentation/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Documentation**: https://react.dev/
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Airtable API**: https://airtable.com/api
- **Undraw Illustrations**: https://undraw.co/

## Contact & Support

- **Repository Owner**: Jared Loosli (jloosli@gmail.com)
- **Issues**: Report bugs or request features via GitHub Issues
- **Pull Requests**: Contributions welcome via GitHub Pull Requests

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

**Last Updated**: 2026-02-01  
**Hugo Version**: 0.140.2  
**React Version**: 19.0.0  
**Node.js**: See package.json for current dependencies
