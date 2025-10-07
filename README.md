# Do I Still Need Sass?

An authoritative, up-to-date guide comparing Sass features with native CSS capabilities. This site helps front-end developers decide whether they still need Sass as a dependency by providing detailed comparisons, browser support information, and practical code examples.

## 🚀 Features

### ✅ Implemented

- **Feature Comparison Table** - Comprehensive list of Sass features with their CSS equivalents
- **Baseline Browser Support** - Integration with web-features package for authoritative browser compatibility data
- **Search Functionality** - Real-time filtering by feature name
- **Status Filters** - Filter by Native, Partial, or No Equivalent implementation status
- **Code Examples** - Side-by-side Sass vs CSS code comparisons with syntax highlighting
- **Modern Dark UI** - Clean, professional design with gradient backgrounds and smooth transitions
- **SEO Optimized** - Meta tags, Open Graph, and semantic HTML

### 🔮 Roadmap

#### Phase 1: Enhanced Code Examples (In Progress)
- [ ] Add code examples for all remaining features
- [ ] Include "What's different?" annotations for partial support features
- [ ] Add copy-to-clipboard buttons for code snippets

#### Phase 2: Interactive Migration Tools
- [ ] **Migration Calculator** - Analyze user's Sass usage and estimate migration effort
  - Upload Sass files or paste code
  - Parse and analyze feature usage
  - Generate migration recommendations
  - Estimate effort/complexity score
  
- [ ] **Codebase Scanner** - GitHub integration to scan repositories
  - Connect via GitHub API
  - Analyze Sass file patterns
  - Generate migration report
  - Suggest migration path

#### Phase 3: Educational Content
- [ ] **Migration Guides** - Step-by-step guides for each feature
- [ ] **Best Practices** - CSS alternatives and patterns
- [ ] **Case Studies** - Real-world migration stories
- [ ] **Video Tutorials** - Screen recordings demonstrating migrations

#### Phase 4: Community Features
- [ ] **Discussion Forum** - GitHub Discussions integration
- [ ] **Contribution Guide** - How to add/update features
- [ ] **Newsletter** - Updates on CSS feature support changes
- [ ] **RSS Feed** - Subscribe to updates

#### Phase 5: Advanced Features
- [ ] **IDE Integration** - VS Code extension for inline suggestions
- [ ] **Build Tool Plugins** - Webpack/Vite plugins for migration warnings
- [ ] **AI Assistant** - ChatGPT-style helper for migration questions
- [ ] **Comparison Mode** - Toggle between Sass and CSS examples

## 🛠️ Tech Stack

- **Framework**: Vanilla JavaScript (no framework dependencies - practicing what we preach!)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Syntax Highlighting**: Prism.js
- **Data Source**: web-features package (backed by MDN and browser vendors)
- **Code Quality**: ESLint with SonarJS and JSDoc plugins
- **Testing**: Vitest

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate table HTML from feature data
npm run generate-table

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
do-i-still-need-sass/
├── src/
│   ├── feature-data.js      # Central feature data with baseline info
│   ├── main.js               # Search, filter, and syntax highlighting
│   ├── style.css             # Tailwind CSS and custom styles
│   └── typedefs.js           # JSDoc type definitions
├── scripts/
│   └── generate-table.js     # Generates HTML table from feature data
├── index.html                # Main page
├── eslint.config.js          # ESLint configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── vite.config.js            # Vite configuration
```

## 🧪 Testing

The project uses Vitest for testing. Tests focus on:

- **Search functionality** - Verifying text-based filtering works correctly
- **Filter functionality** - Ensuring status filters work independently and combined with search
- **Code examples** - Validating syntax highlighting and expand/collapse behavior
- **Browser support data** - Ensuring baseline data is correctly fetched and displayed

## 🤝 Contributing

Contributions are welcome! Please:

1. Check the roadmap for planned features
2. Open an issue to discuss major changes
3. Follow the existing code style (enforced by ESLint)
4. Add JSDoc comments for new functions
5. Update tests for changed functionality
6. Run `npm run lint` before committing

## 📄 Data Sources

- **Feature Status**: Manually curated based on CSS specifications and browser implementations
- **Browser Support**: [web-features](https://github.com/web-platform-dx/web-features) package
- **Baseline Methodology**: [Web Platform Baseline](https://web.dev/baseline)

## 📝 License

MIT

## 🙏 Acknowledgments

- [Sass Team](https://sass-lang.com/) - For years of CSS preprocessing innovation
- [MDN Web Docs](https://developer.mozilla.org/) - For comprehensive CSS documentation
- [web-features](https://github.com/web-platform-dx/web-features) - For authoritative browser compatibility data
- The CSS Working Group - For continuously evolving CSS capabilities
