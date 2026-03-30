/**
 * Legacy Entry Point
 * This file is maintained for compatibility but the application has been 
 * refactored into the /src directory using an N-Tier architecture.
 *
 * Use 'npm start' or 'npm run dev' which now point to src/server.js.
 */

// If this file is executed directly, forward to the new server logic
require('./src/server');