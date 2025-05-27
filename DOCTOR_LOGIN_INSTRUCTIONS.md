# Doctor Login Instructions

## Test Doctor Account

I've created a test doctor account for you to test the authentication system:

**Login Credentials:**
- **Email:** `test.doctor@eventuraa.com`
- **Password:** `password123`
- **Registration Number:** `TEST-12345`

## How to Test

1. **Start the servers** (if not already running):
   ```bash
   # Backend server (should be running on port 5001)
   cd server && npm start
   
   # Frontend client (should be running on port 5173)
   cd client && npm run dev
   ```

2. **Navigate to the doctor login page:**
   - Go to: `http://localhost:5173/doctor-login`

3. **Login with the test credentials:**
   - Enter the email: `test.doctor@eventuraa.com`
   - Enter the password: `password123`
   - Enter the registration number: `TEST-12345`
   - Click "Login"

4. **You should be redirected to the doctor portal:**
   - URL: `http://localhost:5173/doctor-portal`
   - You should see the doctor dashboard with the test doctor's information

## Authentication Features

✅ **Fixed Issues:**
- Authentication token validation
- Proper error handling for missing tokens
- Automatic redirect to login page if not authenticated
- Session expiry handling
- Logout functionality

✅ **Security Features:**
- JWT token-based authentication
- Protected routes
- Token expiry handling
- Secure password hashing

## Troubleshooting

If you encounter any issues:

1. **Check browser console** for any JavaScript errors
2. **Check network tab** to see if API calls are successful
3. **Clear localStorage** if you have old/invalid tokens:
   ```javascript
   localStorage.clear()
   ```
4. **Verify servers are running** on the correct ports

## Additional Test Accounts

If you need more test accounts, you can create them using the registration script:
```bash
cd server
node create-test-doctor.js
```

Or modify the script to create different test doctors with different specialties and information. 