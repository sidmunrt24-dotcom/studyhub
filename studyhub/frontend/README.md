# StudyHub - Student Learning Management Platform

A comprehensive web application designed to help students organize their learning journey with features like notes management, timetable scheduling, doubt resolution, and an admin dashboard for platform oversight.

## Key Features

- 📝 **Notes Management**: Create, edit, and organize study notes with rich text formatting
- 📅 **Timetable**: Schedule and track study sessions with completion tracking
- ❓ **Ask Doubts**: Post questions and get answers from the community
- 👨‍💼 **Admin Dashboard**: Platform management with user oversight and analytics
- 🔐 **JWT Authentication**: Secure user authentication and authorization

## Tech Stack

- **Frontend**: React.js, React Router, Axios, CSS3
- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Authentication**: JSON Web Tokens (JWT)
- **Database**: MongoDB with Mongoose ODM

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager
- Postman (optional, for API testing)

## Installation & Setup

### Clone Repository

```bash
git clone <repository-url>
cd studyhub
```

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables:
   - Copy `.env` file and configure:
     - `PORT=5000` - Backend server port
     - `MONGODB_URI=mongodb://localhost:27017/studyhub` - MongoDB connection string
     - `JWT_SECRET=studyhub_jwt_secret_key_2024_make_this_very_long_and_secure` - JWT secret key
     - `NODE_ENV=development` - Environment mode

4. MongoDB connection setup:
   - Ensure MongoDB is running locally or update `MONGODB_URI` for remote database

5. Start backend server:
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables:
   - Copy `.env` file and configure:
     - `REACT_APP_API_URL=http://localhost:5000/api` - Backend API URL
     - `REACT_APP_NAME=StudyHub` - Application name

4. Start frontend:
   ```bash
   npm start
   ```

## MongoDB Setup

### Installation

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow setup wizard
3. Add MongoDB bin directory to PATH

**macOS:**
```bash
brew install mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
```

### Starting MongoDB Service

**Windows:**
```bash
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Creating Database

MongoDB will automatically create the `studyhub` database when the application first connects. No manual database creation is required.

### Verifying Connection

Once MongoDB is running, the backend server will connect automatically. Check server logs for successful connection message.

## Admin User Setup

The admin user must be created before accessing the admin dashboard.

### Step-by-Step Instructions

1. **Ensure backend server is running** on `http://localhost:5000`

2. **Create admin user** using Postman or curl:
   ```
   POST http://localhost:5000/api/admin/setup
   ```
   No authentication or body required.

3. **Verify response**:
   ```json
   {
     "success": true,
     "message": "Admin user created successfully",
     "user": {
       "id": "...",
       "name": "Admin",
       "email": "admin@studyhub.com",
       "role": "admin",
       "avatar": "👨‍💼"
     }
   }
   ```

4. **Login credentials**:
   - Email: `admin@studyhub.com`
   - Password: `admin123`

5. **Access admin dashboard** at `http://localhost:3000/admin-login`

## Running the Application

1. **Start Backend**:
   ```bash
   cd backend && npm start
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd frontend && npm start
   ```

3. **Access Application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

4. **Default Ports**:
   - Frontend: 3000
   - Backend: 5000

## Postman API Testing Guide

### 7.1 Setup Postman Environment

1. Create new environment named "StudyHub Local"
2. Add the following variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: (will be set after login)
   - `admin_token`: (will be set after admin login)

### 7.2 Authentication Endpoints

#### A. Register User
- **Method**: POST
- **URL**: `{{base_url}}/auth/register`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns token and user object
- **Tests Tab Script**:
  ```javascript
  pm.environment.set("token", pm.response.json().token);
  ```

#### B. Login User
- **Method**: POST
- **URL**: `{{base_url}}/auth/login`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns token and user object
- **Tests Tab Script**:
  ```javascript
  pm.environment.set("token", pm.response.json().token);
  ```

#### C. Get Current User
- **Method**: GET
- **URL**: `{{base_url}}/auth/me`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  ```
- **Response**: Returns current user details

### 7.3 Notes Endpoints

#### A. Get All Notes
- **Method**: GET
- **URL**: `{{base_url}}/notes`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  ```
- **Response**: Returns array of user's notes

#### B. Create Note
- **Method**: POST
- **URL**: `{{base_url}}/notes`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Body** (JSON):
  ```json
  {
    "title": "My First Note",
    "content": "<p>This is the note content</p>",
    "tags": ["study", "important"]
  }
  ```

#### C. Update Note
- **Method**: PUT
- **URL**: `{{base_url}}/notes/:id`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Body** (JSON):
  ```json
  {
    "title": "Updated Title",
    "content": "<p>Updated content</p>"
  }
  ```

#### D. Delete Note
- **Method**: DELETE
- **URL**: `{{base_url}}/notes/:id`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  ```

### 7.4 Doubts Endpoints

#### A. Get All Doubts
- **Method**: GET
- **URL**: `{{base_url}}/doubts`
- **Headers**:
  ```
  (No Authorization header required — this endpoint is publicly accessible)
  ```
- **Response**: Returns array of all doubts with author and answers populated

#### B. Post Doubt
- **Method**: POST
- **URL**: `{{base_url}}/doubts`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Body** (JSON):
  ```json
  {
    "question": "How does React hooks work?",
    "description": "I'm confused about useState and useEffect",
    "tags": ["react", "javascript"]
  }
  ```

#### C. Post Answer
- **Method**: POST
- **URL**: `{{base_url}}/doubts/:id/answers`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Body** (JSON):
  ```json
  {
    "text": "React hooks are functions that let you use state and lifecycle features..."
  }
  ```

### 7.5 Timetable Endpoints

#### A. Get Timetable
- **Method**: GET
- **URL**: `{{base_url}}/timetable`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  ```
- **Response**: Returns user's timetable or creates empty one

#### B. Save Timetable
- **Method**: POST
- **URL**: `{{base_url}}/timetable`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Body** (JSON):
  ```json
  {
    "schedule": [
      {
        "day": "Monday",
        "slots": [
          {
            "time": "9:00 AM",
            "subject": "Mathematics",
            "topic": "Calculus",
            "isCompleted": false
          }
        ]
      }
    ]
  }
  ```

### 7.6 Admin Endpoints

#### A. Setup Admin
- **Method**: POST
- **URL**: `{{base_url}}/admin/setup`
- **Note**: No authentication required, no body required
- **Response**: Creates admin user with email admin@studyhub.com
- **Note**: Can only be called once; returns error if admin exists

#### B. Admin Login
- **Method**: POST
- **URL**: `{{base_url}}/admin/login`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "email": "admin@studyhub.com",
    "password": "admin123"
  }
  ```
- **Tests Tab Script**:
  ```javascript
  pm.environment.set("admin_token", pm.response.json().token);
  ```

#### C. Get Admin Stats
- **Method**: GET
- **URL**: `{{base_url}}/admin/stats`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```
- **Response**: Dashboard statistics

#### D. Get All Users
- **Method**: GET
- **URL**: `{{base_url}}/admin/users`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### E. Delete User
- **Method**: DELETE
- **URL**: `{{base_url}}/admin/users/:id`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### F. Get All Notes (Admin)
- **Method**: GET
- **URL**: `{{base_url}}/admin/notes`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### G. Delete Note (Admin)
- **Method**: DELETE
- **URL**: `{{base_url}}/admin/notes/:id`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### H. Get All Doubts (Admin)
- **Method**: GET
- **URL**: `{{base_url}}/admin/doubts`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### I. Delete Doubt (Admin)
- **Method**: DELETE
- **URL**: `{{base_url}}/admin/doubts/:id`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

#### J. Toggle Doubt Resolution
- **Method**: PUT
- **URL**: `{{base_url}}/admin/doubts/:id/resolve`
- **Headers**:
  ```
  Authorization: Bearer {{admin_token}}
  ```

### 7.7 Testing Production API Endpoints

To test against a deployed backend (e.g., on Render), create a new Postman environment:

1. Create a new environment named "StudyHub Production".
2. Set the following variables:
   - `base_url`: `https://your-backend.onrender.com/api` (replace with your actual Render backend URL)
   - `token`: (leave empty; will be set after login)
   - `admin_token`: (leave empty; will be set after admin login)
3. Import your existing requests from the "StudyHub Local" environment.
4. Run the same authentication and API tests as in local setup, but using the production environment.
5. Verify responses match expected behavior (e.g., successful CRUD operations, proper error codes).

**Note**: Ensure your production backend allows Postman's origin in `ALLOWED_ORIGINS` or use Postman's "No CORS" mode for testing. Cross-reference the main README.md for backend deployment details.

### 7.8 Switching Between Local and Production Environments in Postman

Postman allows easy switching between environments for testing different deployments:

1. Use the environment dropdown in the top-right corner of Postman.
2. Select "StudyHub Local" for development testing (uses `http://localhost:5000/api`).
3. Select "StudyHub Production" for live backend testing (uses your Render URL).
4. Update `REACT_APP_API_URL` in your frontend `.env` to match the backend URL you're testing against.
5. After switching, re-run login requests to set fresh tokens in the new environment.
6. Common pitfall: Tokens are environment-specific—logging in locally won't work for production, and vice versa.

### 7.9 Troubleshooting API Testing

- **401 Unauthorized**: Token expired or invalid. Re-login and ensure `Authorization: Bearer {{token}}` format. Check JWT_SECRET consistency between environments.
- **404 Not Found**: Verify endpoint URL (e.g., missing `/api` path) and HTTP method. Compare with documented routes.
- **500 Internal Server Error**: Backend issue—check Render logs or server console for stack traces. Ensure database connectivity.
- **CORS Errors**: Backend's `ALLOWED_ORIGINS` doesn't include Postman's domain. Temporarily disable CORS in Postman settings or update backend config.
- **Network Errors**: Firewall blocking requests. Test with a simple tool like curl. Ensure backend is running and accessible.
- **Rate Limiting**: Too many requests—wait and retry. Implement exponential backoff in scripts.
- **Environment Variable Mismatch**: `base_url` not updated—double-check Postman environment variables.

For advanced debugging, enable Postman's console to inspect request/response details.

## Deployment to Vercel

### Quick Start Deployment Guide

1. Sign up for a Vercel account at [vercel.com](https://vercel.com) (free tier available).
2. Connect your GitHub repository: In Vercel dashboard, click "New Project" > "Import Git Repository" > Select your StudyHub repo.
3. Vercel auto-detects Create React App—confirm the root directory as `frontend` if prompted.
4. Set environment variables (see below) in the Vercel project settings.
5. Click "Deploy"—Vercel builds and deploys automatically, providing a live URL (e.g., `https://studyhub.vercel.app`).
6. Monitor deployment in Vercel dashboard; check logs for errors.

**Note**: Cross-reference the main README.md for backend deployment on Render to ensure connectivity.

### Detailed Environment Variable Configuration

Configure these in Vercel Dashboard > Project Settings > Environment Variables:

- `REACT_APP_API_URL`: Set to your production backend URL (e.g., `https://your-backend.onrender.com/api`). Must include `/api` path; no trailing slash.
- `REACT_APP_NAME`: Display name for the app (e.g., "StudyHub"). Customize for branding.
- `REACT_APP_SHOW_DEMO`: Set to `false` for production (avoids demo data clutter).

**Best Practices**:
- Use production values for all deployments unless testing staging.
- Variables are embedded in the build—restart deployments after changes.
- For security, never store secrets here (use backend env vars instead).

### How to Connect to Production Backend

1. Deploy backend to Render (see main README.md).
2. In Vercel, set `REACT_APP_API_URL` to the Render backend URL (e.g., `https://studyhub-backend.onrender.com/api`).
3. Ensure backend's `ALLOWED_ORIGINS` includes your Vercel domain (e.g., `https://studyhub.vercel.app`).
4. Test connectivity post-deployment (see "Production Environment Setup" below).
5. Common pitfall: Mismatched URLs cause API failures—verify with browser dev tools.

### Preview Deployment Configuration

Vercel creates preview deployments for branches/pull requests:

1. Push a branch—Vercel auto-deploys a preview URL (e.g., `https://studyhub-git-feature.vercel.app`).
2. Environment variables inherit from production unless overridden in branch settings.
3. For staging testing: Override `REACT_APP_API_URL` to point to a staging Render backend.
4. Test features in isolation before merging to main.
5. Disable previews for sensitive branches if needed.

### Custom Domain Setup

1. In Vercel Dashboard > Project Settings > Domains, click "Add".
2. Enter your domain (e.g., `studyhub.com`).
3. Follow Vercel's DNS instructions: Update your domain registrar with provided CNAME/A records.
4. Vercel verifies and enables HTTPS automatically.
5. Test: Access your custom domain and ensure it loads the app.
6. Note: Custom domains may take time to propagate.

## Production Environment Setup

### Configuring REACT_APP_API_URL for Production

- Update `REACT_APP_API_URL` in Vercel dashboard to `https://your-backend.onrender.com/api` (replace with actual Render URL).
- Ensure HTTPS for security; avoid HTTP in production.
- Test locally first: Temporarily set the variable in `.env` and run `npm start` to simulate.

### Verifying Frontend-Backend Connectivity

1. Deploy both frontend (Vercel) and backend (Render).
2. Open browser dev tools > Network tab on your Vercel URL.
3. Trigger an API call (e.g., login)—check for successful requests to backend URL.
4. Look for 200 responses; failures indicate connectivity issues.
5. Use tools like Postman to test endpoints directly against production.

### Testing CORS Configuration

1. In browser dev tools > Console, check for CORS errors (e.g., "Access-Control-Allow-Origin" header missing).
2. Ensure backend's `ALLOWED_ORIGINS` includes your Vercel domain.
3. Test with a simple fetch: Open console and run `fetch('https://your-backend.onrender.com/api/health')`.
4. If blocked, update backend config and redeploy.
5. Pitfall: Wildcards like `*.vercel.app` may not work—use exact domains.

### Debugging Production Issues Using Browser Dev Tools

1. Open dev tools (F12) on your live Vercel site.
2. **Console Tab**: Check for JavaScript errors, API failures, or env var issues (e.g., undefined `REACT_APP_API_URL`).
3. **Network Tab**: Inspect API requests—look for failed calls, status codes, and response bodies.
4. **Application Tab**: Verify localStorage/sessionStorage for tokens; check service workers if used.
5. Simulate issues: Disable cache, test on incognito mode, or use slow 3G simulation.
6. Common fixes: Redeploy after env var changes; check Vercel/Render logs for backend errors.

## Build and Optimization

### Creating a Production Build Locally

1. Ensure dependencies are installed: `npm install`.
2. Run: `npm run build`.
3. This creates an optimized `build/` folder with minified assets.
4. Test locally: Install `serve` globally (`npm install -g serve`), then `serve -s build` to simulate production.

### Testing Production Build Before Deployment

1. After `npm run build`, run `serve -s build` on a local port (e.g., 5000).
2. Test all features: Login, notes, doubts, timetable, admin (if applicable).
3. Check for broken links, missing assets, or console errors.
4. Verify API calls work with production URLs (update `.env` temporarily).
5. Pitfall: Local testing may not catch server-side issues—always test on Vercel preview.

### Build Optimization Tips

- **Code Splitting**: Use React.lazy() for route-based splitting to reduce initial bundle size.
- **Image Optimization**: Compress images and use WebP format; lazy-load non-critical images.
- **Bundle Analysis**: Run `npm install --save-dev webpack-bundle-analyzer`, then `npx webpack-bundle-analyzer build/static/js/*.js`.
- **Caching**: Leverage browser caching for static assets; use versioning for updates.
- **Minification**: Enabled by default in Create React App—avoid console.logs in production.
- **Tree Shaking**: Ensure unused code is removed by importing only needed modules.

### Analyzing Bundle Size

1. Install analyzer: `npm install --save-dev webpack-bundle-analyzer`.
2. Add to `package.json` scripts: `"analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"`.
3. Run: `npm run analyze`.
4. Review the visual report: Identify large dependencies (e.g., heavy libraries) and optimize imports.
5. Goal: Keep initial bundle under 500KB for better performance.
6. Tools: Also use `npm run build -- --stats` for JSON stats, or Lighthouse for real-user metrics.

## Troubleshooting

### MongoDB Connection Errors
- Ensure MongoDB service is running
- Check `MONGODB_URI` in backend `.env` file
- Verify MongoDB is accessible on specified port (default: 27017)

### Port Already in Use Errors
- Backend: Change `PORT` in backend `.env` file
- Frontend: React will automatically use next available port, or set `PORT` environment variable

### CORS Errors
- Ensure backend server is running on correct port
- Check `REACT_APP_API_URL` in frontend `.env` matches backend URL

### Authentication Token Errors
- Ensure token is valid and not expired
- Check that `Authorization: Bearer {{token}}` header is included
- Try logging in again to get fresh token

### Admin User Already Exists Error
- Admin user can only be created once
- Use existing admin credentials to login
- If needed, manually delete admin user from database

### Production-Specific Troubleshooting

- **CORS Errors in Production**: Check backend `ALLOWED_ORIGINS` includes your Vercel domain. Redeploy backend after changes. Test with browser dev tools.
- **Environment Variable Issues**: Variables not loading? Verify in Vercel dashboard (case-sensitive). Redeploy after updates. Locally, restart `npm start`.
- **API Connection Failures**: `REACT_APP_API_URL` mismatch? Ensure it points to live Render backend. Check network tab for 404/500 errors.
- **Build Failures on Vercel**: Check deployment logs for missing dependencies or syntax errors. Ensure Node.js version matches local.
- **Slow Loading**: Bundle too large? Analyze with webpack-bundle-analyzer. Optimize images and enable compression.
- **Preview Deployments Broken**: Env vars not inheriting? Override in branch settings. Check GitHub integration.
- **Custom Domain Issues**: DNS not propagating? Wait 24-48 hours. Verify CNAME records with tools like `dig`.
- **Token Expiration in Production**: Implement refresh logic (see main README for backend auth). Clear browser cache and re-login.

For unresolved issues, check Vercel/Render logs, browser console, and community forums.

## Project Structure

```
studyhub/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route handlers
│   ├── middleware/      # Authentication middleware
│   ├── config/          # Database configuration
│   ├── server.js        # Main server file
│   └── .env             # Environment variables
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context providers
│   │   ├── css/         # Stylesheets
│   │   └── App.js       # Main app component
│   └── .env             # Environment variables
└── README.md            # Project documentation
```

## Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Environment Variables Reference

### Backend Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Environment mode (development/production)

### Frontend Variables
- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_NAME` - Application display name

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
