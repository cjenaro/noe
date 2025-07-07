# AGENTS.md - Development Guidelines

## Build/Test Commands
- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production (all browsers)
- `bun run build:firefox` - Build specifically for Firefox
- `bun run compile` - TypeScript type checking only
- `bun run lint` - Run Biome linting
- `bun run lint:fix` - Fix linting issues automatically
- `bun run format` - Format code with Biome
- No test framework configured - verify manually in browser

## Code Style Guidelines
- **Framework**: WXT + SolidJS browser extension
- **Language**: TypeScript with strict mode
- **Package Manager**: Bun (not npm/yarn)
- **Linting/Formatting**: Biome for consistent code style
- **State Management**: XState for complex state machines, SolidJS signals for simple state
- **Imports**: Use `@/` for asset imports, relative paths for local modules
- **Components**: Use SolidJS patterns with `createSignal()` for state
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Files**: `.tsx` for components, `.ts` for utilities/background/content scripts
- **CSS**: Component-scoped CSS files (e.g., `App.css` alongside `App.tsx`)

## WXT-Specific Patterns
- Use `defineBackground()` for background scripts
- Use `defineContentScript()` with `matches` array for content scripts
- Entry points go in `entrypoints/` directory
- Assets in `assets/` and `public/` directories
- Configure browser permissions in `wxt.config.ts`
- **UI Architecture**: Uses Chrome sidepanel for main interface (click extension icon to open)