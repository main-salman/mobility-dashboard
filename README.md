# Mobility Dashboard

A comprehensive visualization tool for urban mobility data using Google Maps APIs. This dashboard provides insights into traffic flows, movement patterns, and urban mobility metrics with interactive visualizations.

## Features

- Real-time and simulated traffic flow visualization
- Multiple movement types (vehicles, pedestrians, bicycles, transit)
- Heat map visualization of density patterns
- Granular time controls with variable time intervals
- Performance-optimized rendering for large datasets
- Responsive design for various screen sizes

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Maps API Key with relevant services enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Geocoding API

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mobility-dashboard.git
   cd mobility-dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Google Maps API credentials:

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Code Quality and Linting

### Linting Setup

This project uses ESLint and Prettier for code quality and formatting. The configuration is set up to follow Next.js and TypeScript best practices.

#### Available Linting Commands

Run linting checks:

```bash
npm run lint
# or
yarn lint
```

Fix linting issues automatically when possible:

```bash
npm run lint:fix
# or
yarn lint:fix
```

Format code with Prettier:

```bash
npm run format
# or
yarn format
```

### Setting Up Husky (Pre-commit Hooks)

To enable automatic linting and formatting before each commit, set up Husky:

1. Install Husky:

```bash
npm install
```

2. Initialize Husky:

```bash
npx husky install
```

3. Create a pre-commit hook:

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

4. Make the pre-commit hook executable:

```bash
chmod +x .husky/pre-commit
```

Now, whenever you commit changes, Husky will automatically run lint-staged, which will format and lint the staged files according to the configuration in package.json.

### Automated Linting

The project includes several features for automated linting:

1. **Pre-commit Hooks**: Automatically lint and format staged files before committing using Husky and lint-staged.

2. **Editor Integration**: Configuration files for VSCode are included to automatically format and lint code as you work.

3. **CI/CD Integration**: Linting checks are run in the CI pipeline to ensure code quality on pull requests.

### Customizing Linting Rules

The linting rules are defined in `eslint.config.mjs`. You can modify this file to adjust the rules based on your team's coding standards.

Add custom rule overrides:

```javascript
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Add your custom rule overrides here
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
```

## Project Structure

```
mobility-dashboard/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions and helpers
├── .env.local.example    # Example environment variables
├── eslint.config.mjs     # ESLint configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Troubleshooting

### Common Issues

- **API Key Issues**: Ensure your Google API key has all required services enabled and proper restrictions.
- **Performance Problems**: Large datasets may cause performance issues. Try adjusting visualization settings or enabling performance optimizations.
- **Linting Errors**: Run `npm run lint:fix` to automatically fix common linting issues.

## Contributing

1. Create a new branch from `main` for your feature
2. Make your changes
3. Run linting and fix any issues: `npm run lint`
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
