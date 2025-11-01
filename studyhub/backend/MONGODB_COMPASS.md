mongodb://localhost:27017/studyhub
```

This string breaks down as follows:
- **Protocol**: `mongodb://` - Standard MongoDB connection protocol
- **Host**: `localhost` - Refers to your local machine (127.0.0.1)
- **Port**: `27017` - Default MongoDB port
- **Database**: `studyhub` - The database name used by the StudyHub application

This connection string matches the `MONGODB_URI` environment variable configured in your `backend/.env` file.

## Step-by-Step Connection Instructions

1. **Download and Install MongoDB Compass**:
   - Visit [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
   - Download the version appropriate for your operating system
   - Follow the installation instructions for your platform

2. **Open MongoDB Compass**:
   - Launch the MongoDB Compass application

3. **Enter Connection String**:
   - In the connection field at the top, paste: `mongodb://localhost:27017/studyhub`
   - Click the "Connect" button

4. **Navigate to StudyHub Database**:
   - Once connected, you'll see a list of databases in the left sidebar
   - Click on "studyhub" to expand it

5. **Explore Collections**:
   - Within the studyhub database, you'll find collections such as:
     - `users` - User accounts and profiles
     - `notes` - Study notes and materials
     - `doubts` - Student questions and discussions
     - `timetables` - Schedule and calendar data

## Verifying the Connection

After connecting, verify your setup by checking for existing data:

- **Check for Collections**: The studyhub database should contain the collections mentioned above. If the database appears empty, it may not have been populated yet.
- **View Admin User**: The admin user is created via the `/api/admin/setup` endpoint. To view it:
  - Select the `users` collection
  - Look for documents with `role: "admin"`
  - You should see the admin user with email `admin@studyhub.com`
- **Manual Queries**: Use the query bar to run simple queries, such as `{}` to view all documents in a collection, or filter by specific fields like `{"email": "admin@studyhub.com"}`.

## Troubleshooting

### Connection Refused
- **Cause**: MongoDB service is not running
- **Solution**: Start MongoDB using platform-specific commands:
  - Windows: `net start MongoDB`
  - macOS: `brew services start mongodb`
  - Linux: `sudo systemctl start mongod`

### Database Not Found
- **Cause**: The database hasn't been created yet
- **Solution**: MongoDB databases are created automatically when the first document is inserted. Run the StudyHub backend and trigger actions that create data (e.g., admin setup or user registration).

### Authentication Failed
- **Cause**: Local MongoDB installations typically don't require authentication, but some setups might
- **Solution**: If authentication is required, modify the connection string to include credentials: `mongodb://username:password@localhost:27017/studyhub`

### Port Already in Use
- **Cause**: Another service is using port 27017
- **Solution**: 
  - Check what's using the port: `netstat -ano | findstr :27017` (Windows) or `lsof -i :27017` (macOS/Linux)
  - Stop the conflicting service or configure MongoDB to use a different port
  - Update your `MONGODB_URI` in `.env` accordingly

### Firewall Issues
- **Cause**: Firewall blocking localhost connections
- **Solution**: Ensure your firewall allows connections to localhost (127.0.0.1) on port 27017. Add exceptions if necessary.

## Troubleshooting Login Issues

400 errors during login typically indicate one of the following issues:

- **User doesn't exist in the database**: The user account hasn't been created yet. For regular users, they need to register first. For the admin user, use the "Seed default admin" button on the admin login page.
- **Invalid credentials**: The email or password provided is incorrect.
- **Validation errors**: The input doesn't meet requirements, such as incorrect email format or password length.

To verify if users exist, check the `users` collection in MongoDB Compass:

1. Connect to the database using the connection string `mongodb://localhost:27017/studyhub` (refer to the Step-by-Step Connection Instructions above).
2. Select the `users` collection.
3. Use the query bar with `{}` to view all documents.
4. Look for the desired user by email or role.

To seed the admin user:

1. Navigate to the admin login page in the StudyHub application.
2. Click the "Seed default admin" button to create the default admin user (email: admin@studyhub.com).

Before attempting login, ensure MongoDB is connected and running by following the Verifying the Connection section above.

This provides practical guidance for developers debugging login issues.

## Common Tasks

### View All Users
1. Select the `users` collection
2. Use the query bar with `{}` to view all documents
3. Sort by creation date or filter by role as needed

### Manually Create Admin User
If the `/api/admin/setup` endpoint fails:
1. In Compass, select the `users` collection
2. Click "Add Data" > "Insert Document"
3. Paste a document like:
   ```json
   {
     "email": "admin@studyhub.com",
     "password": "$2b$10$encrypted_password_hash", // Use bcrypt hash of "admin123"
     "role": "admin",
     "createdAt": new Date()
   }
