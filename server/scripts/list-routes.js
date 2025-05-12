require('dotenv').config({ path: '../.env' });
const app = require('../src/server');

/**
 * List all registered routes in the Express app
 */
function listRoutes() {
  console.log('Listing all registered routes in the Express app...\n');
  
  const routes = [];
  
  // Helper function to process the stack
  function processStack(stack, basePath = '') {
    stack.forEach(layer => {
      if (layer.route) {
        // Routes registered directly on the app
        const route = layer.route;
        const methods = Object.keys(route.methods)
          .filter(method => route.methods[method])
          .map(method => method.toUpperCase())
          .join(', ');
        
        routes.push({
          path: basePath + route.path,
          methods
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        let routerPath = layer.regexp.toString()
          .replace('\\/?(?=\\/|$)', '')
          .replace('\\/?$', '')
          .replace('^', '')
          .replace('\\', '')
          .replace('(?:/(?=$))?', '');
          
        // For root router path
        if (routerPath === '/^') {
          routerPath = '';
        } else {
          routerPath = routerPath.replace(/\\\//g, '/');
        }
        
        processStack(layer.handle.stack, basePath + routerPath);
      }
    });
  }
  
  // Process the main app stack
  processStack(app._router.stack);
  
  // Sort routes by path
  routes.sort((a, b) => a.path.localeCompare(b.path));
  
  // Print routes
  console.log('Routes:');
  console.log('=======');
  routes.forEach(route => {
    console.log(`${route.methods} ${route.path}`);
  });
  console.log(`\nTotal routes: ${routes.length}`);
}

listRoutes(); 