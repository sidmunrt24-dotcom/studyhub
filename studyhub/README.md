# StudyHub - Project README

This repository contains both backend and frontend for the StudyHub application.

## Quick Setup Guide

**For complete beginners - follow these exact steps:**

### Prerequisites
1. Install Node.js (version 18 or higher) from https://nodejs.org/
2. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
3. Create a cluster and get your connection string (looks like `mongodb+srv://username:password@cluster.mongodb.net/studyhub`)

### Backend Setup (5 minutes)
1. Open terminal/command prompt and navigate to backend folder:
   ```powershell
   cd backend
   ```

2. Copy the example environment file:
   ```powershell
   copy .env.example .env
   ```
   (On Mac/Linux use `cp .env.example .env`)

3. Open `backend/.env` in any text editor and set these values:
   - `MONGODB_URI` - Paste your MongoDB Atlas connection string
   - `JWT_SECRET` - Type any long random text (e.g., `mySecretKey12345xyz`)
   - `PORT` - Keep as `5000`
   - `NODE_ENV` - Keep as `development`
   - `ALLOWED_ORIGINS` - Keep as `http://localhost:3000`

4. Install dependencies and start backend:
   ```powershell
   npm install
   npm run dev
   ```
   You should see "MongoDB connected" and "Server running on port 5000"

### Frontend Setup (3 minutes)
1. Open a **NEW** terminal/command prompt (keep backend running) and navigate to frontend:
   ```powershell
   cd frontend
   ```

2. Copy the example environment file:
   ```powershell
   copy .env.example .env
   ```
   (On Mac/Linux use `cp .env.example .env`)

3. Open `frontend/.env` - it should already have `REACT_APP_API_URL=http://localhost:5000/api` (no changes needed for local development)

4. Install dependencies and start frontend:
   ```powershell
   npm install
   npm start
   ```
   Your browser should automatically open to `http://localhost:3000`

**That's it! You can now register an account and use StudyHub.**

For deployment instructions, see the "Deployment" section below.

---

See `frontend/README.md` for detailed frontend setup and API documentation. Frontend README contains Postman examples and environment variable guidance. Backend-specific configuration and env examples are in `backend/.env.example`.

Backend setup
--------------

1. Copy the example env to a working `.env` in the backend folder:

```powershell
cd backend
copy .env.example .env
# Then edit backend/.env and set a strong JWT_SECRET and your MONGODB_URI
```

2. Required environment variables (in `backend/.env`):
- `MONGODB_URI` - MongoDB connection string (e.g. `mongodb://localhost:27017/studyhub`)
- `JWT_SECRET` - Strong secret for signing JWTs (do NOT commit this value)
- `PORT` - Optional (default 5000)
- `NODE_ENV` - `development` or `production`

Note: The backend will now fail immediately if port 5000 is unavailable (no automatic fallback). This ensures frontend and backend ports stay in sync.

3. Install and run backend:

```powershell
cd backend
npm install
npm run dev
```

## Docker Local Development

**Note:** Docker Compose is for local development only (backend + MongoDB). The frontend is served separately in development or deployed to Vercel for production. See the Deployment section for production setup.

### Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Link to Docker installation: https://docs.docker.com/get-docker/
- Minimum system requirements: 4GB RAM, 10GB disk space

### Quick Start
1. Clone the repository
2. Create `backend/.env` file from `backend/.env.example` (reference existing backend setup section)
3. Run `docker-compose up -d` from project root
4. Access backend at `http://localhost:5000` and MongoDB at `localhost:27017`
5. Run the frontend separately: `cd frontend && npm install && npm start` (access at `http://localhost:3000`)
6. View logs with `docker-compose logs -f studyhub-backend`
7. Stop services with `docker-compose down`

### Environment Variables
- Explain that docker-compose.yml contains development defaults
- Note that `backend/.env` file is NOT used by Docker Compose (variables are in docker-compose.yml)
- For custom configuration, create `docker-compose.override.yml` (not tracked in git)
- Reference the existing "Environment Variables Configuration" section (lines 186-217) for variable descriptions

### Common Docker Commands
- `docker-compose up -d` - Start services in detached mode
- `docker-compose down` - Stop and remove containers
- `docker-compose down -v` - Stop and remove containers + volumes (deletes database data)
- `docker-compose logs -f studyhub-backend` - View backend logs
- `docker-compose logs -f mongodb` - View MongoDB logs
- `docker-compose restart studyhub-backend` - Restart backend service
- `docker-compose exec studyhub-backend sh` - Access backend container shell
- `docker-compose exec mongodb mongosh` - Access MongoDB shell
- `docker-compose ps` - List running services
- `docker-compose build --no-cache` - Rebuild images from scratch

### Hot Reload Development
- Explain that backend code changes trigger automatic restart via nodemon
- Changes to `package.json` require `docker-compose restart backend`
- Changes to Dockerfile require `docker-compose up -d --build`

### MongoDB Access
- MongoDB Compass connection: `mongodb://localhost:27017/studyhub`
- Reference existing MongoDB Compass section (lines 44-50) for detailed instructions
- mongosh CLI access: `docker-compose exec mongodb mongosh studyhub`

### Troubleshooting Docker
- Port conflicts: Check if ports 5000 or 27017 are in use, stop conflicting services
- Permission errors (Linux): Add user to docker group with `sudo usermod -aG docker $USER`
- Container won't start: Check logs with `docker-compose logs [service]`
- Database connection errors: Ensure MongoDB container is healthy with `docker-compose ps`
- Volume issues: Remove volumes with `docker-compose down -v` and restart
- Build cache issues: Rebuild with `docker-compose build --no-cache`

**Note:** This docker-compose.yml only runs the backend and MongoDB for local development. The frontend should still be run separately with `npm start` in the `frontend` directory. Frontend connects to backend at `http://localhost:5000/api` (configured in `frontend/.env`). Reference `frontend/README.md` for frontend setup instructions.

Notes
-----
- The server will refuse to start if `MONGODB_URI` or `JWT_SECRET` are missing — this is intentional to avoid running with insecure defaults. See `backend/.env.example` and this README for setup guidance.
- We recommend using a stable Node.js version (see `.nvmrc`).
- Admin login form auto-fills credentials in development mode (admin@studyhub.com / admin123) for faster testing.

Other notes:
- The Doubts GET endpoint (`GET /api/doubts`) is publicly accessible and does not require an Authorization header.
- Backend must have `MONGODB_URI` and `JWT_SECRET` set in `backend/.env` (see `backend/.env.example`).

### MongoDB Compass Connection

To visually explore and manage your local MongoDB database, use MongoDB Compass. See `backend/MONGODB_COMPASS.md` for detailed connection instructions.

Connection string: `mongodb://localhost:27017/studyhub`

For step-by-step setup, refer to [MongoDB Compass Guide](backend/MONGODB_COMPASS.md)

## Troubleshooting

### Port Conflict Resolution

If you encounter an `EADDRINUSE` error, it means port 5000 is already in use by another process.

**For Windows users:**
1. Open Command Prompt or PowerShell as Administrator.
2. Find the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
   Example output:
   ```
   TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       1234
   ```
   The last column (1234) is the Process ID (PID).
3. Kill the process using the PID:
   ```powershell
   taskkill /PID 1234 /F
   ```

**For Unix/Mac users:**
1. Open Terminal.
2. Find and kill the process using port 5000:
   ```bash
   lsof -ti:5000 | xargs kill -9
   ```
   Alternative:
   ```bash
   kill -9 $(lsof -ti:5000)
   ```

Alternatively, change the `PORT` value in `backend/.env` to an available port (e.g., `PORT=5001`).

Note: The server now includes automatic port fallback, attempting ports 5001 through 5010 if 5000 is unavailable.

### Graceful Shutdown

To shut down the server properly, press `Ctrl+C` in the terminal. This will:
- Close MongoDB connections gracefully.
- Release the port immediately.
- Prevent orphaned processes and future port conflicts.

### Common Issues

- **MongoDB connection failures**: Ensure MongoDB is running and `MONGODB_URI` in `backend/.env` is correct. Check MongoDB logs for details.
- **Missing environment variables**: The server validates required variables (`MONGODB_URI`, `JWT_SECRET`) and refuses to start if missing. Refer to `backend/.env.example` for configuration.
- **Network errors during login**: Ensure backend is running on port 5000 and CORS is configured to allow both `http://localhost:3000` and `http://127.0.0.1:3000`. Check browser console for CORS errors.

## Deployment

**Important:** Docker Compose is for local development only. For production:
- **Frontend:** Deploy to Vercel (see below)
- **Backend:** Deploy to Render or similar Node.js hosting (see below)
- **Database:** Use MongoDB Atlas cloud database

### Vercel Frontend Deployment

Follow these step-by-step instructions to deploy the StudyHub frontend to Vercel:

1. **Sign up for Vercel**: If you don't have an account, sign up at [vercel.com](https://vercel.com).

2. **Connect GitHub Repository**:
   - Go to the Vercel dashboard and click "New Project".
   - Import your GitHub repository containing the StudyHub frontend code.
   - Select the `frontend` directory as the root directory for the project.

3. **Configure Environment Variables**:
   - In the Vercel project settings, go to "Environment Variables".
   - Add the following variables:
     - `REACT_APP_API_URL`: Set to your backend URL (e.g., `https://your-app.onrender.com/api` for Render, or `http://localhost:5000/api` for local testing)
     - Example for production: `https://studyhub-backend.onrender.com/api`

4. **Deploy**:
   - Vercel will automatically detect it as a Create React App and deploy it.
   - The deployment should complete successfully, providing a live URL (e.g., `https://studyhub.vercel.app`).

5. **Configure Custom Domain (Optional)**:
   - In Vercel project settings, go to "Domains".
   - Add your custom domain and follow the DNS configuration instructions.

6. **View Deployment Logs and Debug Issues**:
   - In the Vercel dashboard, go to your project and click on the "Functions" or "Deployments" tab.
   - Click on a deployment to view build logs.
   - Check for any build errors or warnings in the logs.

7. **Set Up Preview Deployments**:
   - Preview deployments are automatically created for each branch push.
   - To test with a different backend (e.g., staging), override `REACT_APP_API_URL` in the branch's deployment settings.

For more details, refer to the [Vercel documentation](https://vercel.com/docs).

### Render Backend Deployment

#### Option A: Deploy with Dockerfile (Recommended)

1. Sign up for Render at https://render.com
2. Create New Web Service and connect GitHub repository
3. Configure service settings:
   - Name: `studyhub-backend`
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Root Directory: `backend`
   - **Environment: Docker** (this is the key difference)
   - Instance Type: Free tier or paid (Free tier has cold starts)
4. Render will auto-detect the Dockerfile at `backend/Dockerfile`
5. Configure Environment Variables (same as existing section, lines 158-164):
   - `MONGODB_URI` - MongoDB Atlas connection string
   - `JWT_SECRET` - Strong random secret (generate with `openssl rand -base64 32`)
   - `ALLOWED_ORIGINS` - Frontend URLs (comma-separated)
   - `NODE_ENV=production`
   - `PORT` - Leave unset (Render auto-assigns and injects)
6. Configure Health Check Path: `/api/health` (Render will use the HEALTHCHECK in Dockerfile)
7. Click "Create Web Service" to deploy
8. Wait for build and deployment (first deploy takes 5-10 minutes)
9. Copy the service URL (e.g., `https://studyhub-backend.onrender.com`)
10. Use this URL as `REACT_APP_API_URL` in Vercel frontend deployment

**Docker Deployment Benefits:**
- Consistent environment between local development and production
- Faster builds with Docker layer caching
- Better security with non-root user (configured in Dockerfile)
- Built-in health checks from Dockerfile
- Easier to debug issues (same Dockerfile locally and in production)

#### Option B: Deploy without Docker (Node.js Native)

Follow these step-by-step instructions to deploy the StudyHub backend to Render:

1. **Sign up for Render**: If you don't have an account, sign up at [render.com](https://render.com).

2. **Create a New Web Service**:
   - Go to the Render dashboard and click "New" > "Web Service".
   - Connect your GitHub repository.
   - Set the service name (e.g., "studyhub-backend").
   - Set the root directory to `backend`.

3. **Configure Build and Start Commands**:
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Configure Environment Variables**:
   - In the service settings, go to "Environment".
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string (see below for setup)
     - `JWT_SECRET`: A strong, randomly generated secret (e.g., generated with `openssl rand -base64 32`)
     - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs (e.g., `https://your-app.vercel.app,https://your-app-preview.vercel.app`)
     - `NODE_ENV`: Set to `production`
     - `PORT`: Render will auto-assign, but you can leave it unset

5. **Set Up MongoDB Atlas**:
   - Sign up for MongoDB Atlas at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Create a new cluster and database.
   - In the cluster settings, go to "Network Access" and allow access from anywhere (0.0.0.0/0) or restrict to Render's IP ranges.
   - Create a database user with read/write access.
   - Get the connection string from "Connect" > "Connect your application" and use it as `MONGODB_URI`.

6. **Configure Health Checks**:
   - In the service settings, set the health check path to `/api/health` (assuming you have this endpoint).

7. **Deploy**:
   - Click "Create Web Service" to deploy.
   - Render will build and deploy your backend, providing a live URL (e.g., `https://studyhub-backend.onrender.com`).

8. **View Logs and Debug Issues**:
   - In the Render dashboard, go to your service and click on the "Logs" tab.
   - Check for any startup errors, connection issues, or runtime errors.

For more details, refer to the [Render documentation](https://docs.render.com).

### Environment Variables Configuration

#### Frontend Variables
- `REACT_APP_API_URL`: Backend API base URL
  - Local: `http://localhost:5000/api`
  - Production: `https://your-backend.onrender.com/api`
- `REACT_APP_NAME`: Application display name (e.g., "StudyHub")
- `REACT_APP_SHOW_DEMO`: Enable demo features (default: false)

#### Backend Variables
- `PORT`: Server port (auto-assigned in production, default 5000 locally)
- `MONGODB_URI`: MongoDB connection string
  - Local: `mongodb://localhost:27017/studyhub`
  - Production: `mongodb+srv://username:password@cluster.mongodb.net/studyhub?retryWrites=true&w=majority`
- `JWT_SECRET`: Strong secret for JWT signing (generate with `openssl rand -base64 32`)
- `NODE_ENV`: Environment mode (`development` or `production`)
- `ALLOWED_ORIGINS`: Comma-separated allowed frontend URLs for CORS
  - Local: `http://localhost:3000`
  - Production: `https://your-app.vercel.app,https://your-app-preview.vercel.app`

#### Security Best Practices
- Never commit `.env` files or secrets to version control.
- Use strong, unique `JWT_SECRET` for each environment.
- Rotate secrets periodically.
- Use environment-specific MongoDB databases.
- Generate secure `JWT_SECRET`: Run `openssl rand -base64 32` in your terminal.

#### CORS Configuration
- Set `ALLOWED_ORIGINS` to your production frontend URL(s).
- Include preview deployment URLs if needed (e.g., for Vercel previews).
- Example: `ALLOWED_ORIGINS=https://studyhub.vercel.app,https://studyhub-git-main-yourusername.vercel.app`

### Production Connectivity Testing

Use this checklist to verify your production deployment:

1. **Test Backend Health Endpoint**:
   - Visit `https://your-backend.onrender.com/api/health`
   - Should return a success response.

2. **Test CORS Configuration**:
   - Open browser dev tools and check for CORS errors when loading the frontend.
   - Ensure frontend can make API calls to the backend.

3. **Test User Registration and Login**:
   - Register a new user on the production frontend.
   - Login with the new credentials.
   - Verify JWT token is received and stored.

4. **Test Admin Login**:
   - Access `/admin-login` on the frontend.
   - Login with admin credentials (admin@studyhub.com / admin123).
   - Verify access to admin dashboard.

5. **Test Major Features**:
   - **Notes**: Create, edit, and delete notes.
   - **Doubts**: Post a doubt, view doubts, post an answer.
   - **Timetable**: Add slots, mark as completed.

6. **Test Error Handling**:
   - Try invalid login credentials.
   - Attempt unauthorized actions.
   - Check network error handling (e.g., by disabling internet).

7. **Verify Environment Variables**:
   - Check that `REACT_APP_API_URL` points to the correct backend.
   - Ensure backend has correct `MONGODB_URI` and can connect to database.

8. **Check Application Logs**:
   - Review Vercel deployment logs for frontend build issues.
   - Review Render service logs for backend errors.
   - Monitor for any runtime errors in production.

### Troubleshooting

#### Common Deployment Issues

- **Build Failures**:
  - Check deployment logs for specific errors.
  - Ensure all dependencies are listed in `package.json`.
  - Verify Node.js version compatibility.

- **CORS Errors**:
  - Ensure `ALLOWED_ORIGINS` in backend includes the frontend URL.
  - Check for trailing slashes in URLs.
  - Verify the frontend is making requests to the correct backend URL.

- **Environment Variable Issues**:
  - Confirm variables are set in the deployment platform dashboard.
  - Check for typos in variable names.
  - Ensure variables are set for the correct environment (production/preview).

- **Database Connection Issues**:
  - Verify `MONGODB_URI` is correct and accessible.
  - Check MongoDB Atlas network access settings.
  - Ensure database user has proper permissions.

- **API Connection Failures**:
  - Confirm `REACT_APP_API_URL` matches the backend URL.
  - Check for firewall or network restrictions.
  - Verify the backend service is running and healthy.

#### Docker Deployment Issues

**Build Failures:**
- Check Render build logs for specific errors
- Verify Dockerfile syntax and paths are correct
- Ensure all COPY paths in Dockerfile exist in repository
- Check that `backend/Dockerfile` is committed to git
- Verify Node.js version compatibility (18+ required)

**Container Startup Failures:**
- Check Render service logs for runtime errors
- Verify environment variables are set correctly
- Ensure `MONGODB_URI` is accessible from Render's network
- Check MongoDB Atlas network access allows Render IPs (or 0.0.0.0/0)
- Verify health check endpoint `/api/health` exists and responds

**Health Check Failures:**
- Render marks service unhealthy if health check fails 3 times
- Check that server starts on the PORT environment variable (Render injects this)
- Verify health check endpoint returns 200 status code
- Check health check logs in Render dashboard
- Temporarily disable health check to isolate issue

**Performance Issues:**
- Free tier has cold starts (30-60 second delay after inactivity)
- Upgrade to paid tier for always-on instances
- Optimize Dockerfile for faster builds (already done with multi-stage build)
- Use Docker layer caching effectively (package.json copied before source code)

**Environment Variable Issues:**
- Verify variables are set in Render dashboard (not in .env file)
- Check for typos in variable names (case-sensitive)
- Ensure `PORT` is NOT hardcoded in code (use `process.env.PORT`)
- Verify `MONGODB_URI` includes authentication credentials
- Test connection string locally before deploying

For additional help, check the platform-specific documentation or community forums.