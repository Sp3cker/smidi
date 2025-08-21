# smidi=gui React Frontend

This directory contains the React frontend for the smidi=gui Neutralino application.

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server with hot reloading:
   ```bash
   npm start
   ```

   This will start webpack-dev-server on `http://localhost:3000` with hot module replacement enabled.

3. For development without opening browser automatically:
   ```bash
   npm run dev
   ```

### Building for Production

To build the optimized production version:
```bash
npm run build
```

The built files will be in the `dist/` directory, which is configured as the document root in Neutralino.

## Project Structure

```
www/
├── src/
│   ├── App.js          # Main React component
│   ├── index.js        # React entry point
│   ├── index.css       # Main styles
│   └── index.html      # HTML template
├── dist/               # Built files (generated)
├── node_modules/       # Dependencies
├── webpack.config.js   # Webpack configuration
├── .babelrc           # Babel configuration
├── package.json       # Dependencies and scripts
├── neutralino.js      # Neutralino client library
└── README.md          # This file
```

## Features

- ⚛️ **React 18** with modern hooks
- 🔥 **Hot Module Replacement** for instant updates during development
- 📦 **Webpack 5** with optimized production builds
- 🎨 **Modern CSS** with responsive design
- 🔧 **Neutralino Integration** with mock APIs for development
- 📱 **Responsive Design** that works on different screen sizes

## Neutralino Integration

The app is configured to work with Neutralino's native APIs:

- Access Neutralino APIs via `window.Neutralino`
- All APIs are available with mock implementations for development
- Automatic initialization when the app loads

## Development Tips

1. **Hot Reloading**: Changes to React components, CSS, and JS files will automatically reload in the browser
2. **Neutralino APIs**: Use `window.Neutralino` to access native functionality
3. **Build Process**: Always run `npm run build` before running the Neutralino app in production
4. **Debugging**: Open browser DevTools to see console logs from Neutralino APIs

## Scripts

- `npm start` - Start development server with hot reloading
- `npm run dev` - Start development server without opening browser
- `npm run build` - Build for production
- `npm test` - Run tests (placeholder)

## Next Steps

- Add your MIDI-related components to the `src/components/` directory
- Implement Neutralino native functionality for MIDI operations
- Add routing if needed with React Router
- Configure ESLint and Prettier for code quality
