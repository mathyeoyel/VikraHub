# Method 6: Use HashRouter instead of BrowserRouter

# This method changes your React app to use hash-based routing
# No server configuration needed!

# In your App.js, replace:
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter> {/* Changed from BrowserRouter */}
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              {/* All other routes */}
            </Routes>
          </Layout>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

# URLs will look like:
# https://vikrahub-frontend.onrender.com/#/services
# https://vikrahub-frontend.onrender.com/#/marketplace

# Render.yaml can be simple static:
services:
  - type: static
    name: vikrahub-frontend
    buildCommand: |
      cd frontend
      npm ci
      npm run build
    staticPublishPath: frontend/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://vikrahub.onrender.com/api/

# Pros: Always works, no server config needed
# Cons: URLs have # in them, less SEO friendly
