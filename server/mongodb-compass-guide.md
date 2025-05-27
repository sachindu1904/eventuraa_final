# MongoDB Compass Connection Guide

## Connecting to Your Local MongoDB

1. Open MongoDB Compass
2. In the connection string field, enter:
   ```
   mongodb://localhost:27017/
   ```
   (Make sure to include the trailing slash)

3. Click "Connect"
4. After connecting, you should see a list of databases on the left side
5. Look for the "eventuraa" database
6. Click on it to see the collections inside:
   - test_collection
   - port_test
   - testmodels

## Troubleshooting

If you can't see the data in MongoDB Compass:

1. Make sure MongoDB service is running:
   - In Windows: Open Services app and check if "MongoDB" service is Running
   - If not, start it manually

2. Try refreshing collections in Compass:
   - Click the refresh button in Compass
   - Sometimes Compass needs manual refresh to see new collections

3. Check the database name:
   - Our tests showed successful connections to "eventuraa" database
   - Make sure you're looking at the right database in Compass

4. Check your connection string:
   - It should be exactly: `mongodb://localhost:27017/`
   - No username, password, or additional parameters are needed for local connections

## Next Steps

Once you've successfully connected and can see your data:

1. Try creating a user through the API:
   ```
   POST http://localhost:5001/api/auth/register
   
   {
     "userType": "user",
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123"
   }
   ```

2. After successful registration, check MongoDB Compass for:
   - Users collection (should contain the user profile)
   - Credentials collection (should contain login information)

3. Continue testing other user types (doctor, organizer) to ensure all models are working correctly. 