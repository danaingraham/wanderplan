# Troubleshooting Guide

## Fixed Issues

### 1. PostCSS/TailwindCSS Configuration Error
**Error:** `Missing "./base" specifier in "tailwindcss" package`

**Solution:** Updated to TailwindCSS v4 configuration:
- Changed CSS imports from `@tailwind` directives to `@import "tailwindcss"`
- Updated PostCSS config to use `@tailwindcss/postcss` plugin with proper imports
- Moved custom theme configuration to `@theme` block in CSS

### 2. TypeScript Import Errors
**Error:** `'React' refers to a UMD global` and type import issues

**Solution:**
- Removed unnecessary `React` imports (React 17+ JSX Transform)
- Changed to type-only imports using `import type { ... }`
- Fixed `React.forwardRef` to use imported `forwardRef`
- Updated all component interfaces to use proper type imports

### 3. Directory Structure
**Error:** `package.json not found`

**Solution:** Make sure to run commands from the correct directory:
```bash
cd wanderplan  # Navigate to the project directory
npm run dev    # Then run commands
```

## Running the Project

1. Navigate to the project directory:
   ```bash
   cd wanderplan
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Architecture Notes

- Using TailwindCSS v4 with `@theme` configuration in CSS
- React components with TypeScript strict mode
- Local storage for data persistence
- Mock API services for development
- Responsive design with mobile-first approach