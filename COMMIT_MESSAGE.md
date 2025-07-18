feat: Restructure project for separate backend/frontend deployment on Render

## Major Changes:
- Separate Django backend into `/backend` directory
- Separate React frontend into `/frontend` directory
- Prepare for dual-service deployment on Render

## Backend Changes:
- Add production-ready build script (`backend/build.sh`)
- Update Django settings for production deployment
- Configure dynamic DEBUG mode via environment variables
- Update CORS settings for React frontend integration
- Add WhiteNoise configuration for static files
- Create environment variable templates (`.env.example`)

## Frontend Changes:
- Configure dynamic API URL via environment variables
- Add production environment configuration (`.env.production`)
- Fix marketplace rating display bug (parseFloat for string values)
- Update asset price formatting for consistency
- Maintain backward compatibility with local development

## Deployment & Documentation:
- Add comprehensive deployment guide (`DEPLOYMENT.md`)
- Create migration checklist for existing Render users (`MIGRATION_CHECKLIST.md`) 
- Add step-by-step migration guide (`MIGRATION_GUIDE.md`)
- Include Render blueprint configuration (`render.yaml`)
- Add backend testing script (`test_backend.sh`)

## Bug Fixes:
- Fix "asset.rating.toFixed is not a function" error in marketplace
- Add null-safety checks for asset data rendering
- Handle Django DecimalField string formatting in React

## Testing:
- Verify frontend builds successfully for production
- Ensure backend structure compatible with Render deployment
- Test API endpoints and CORS configuration

This restructuring enables independent scaling and deployment of frontend 
and backend services while maintaining existing database and functionality.
