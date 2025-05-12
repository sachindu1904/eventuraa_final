# Eventuraa Authentication System

This document explains how the authentication and registration system works in the Eventuraa application, focusing on how data flows between the client and server during account creation.

## User Types

The system supports three types of users, each with their own data model:

1. **Regular Users** - Stored in the `users` collection
2. **Doctors** - Stored in the `doctors` collection
3. **Organizers** - Stored in the `organizers` collection

All account credentials (email, password) are stored in a separate `credentials` collection.

## Registration Flow

### Client-Side (SignUpPage.tsx)

1. User fills out the registration form, with fields that vary based on user type:
   - All users: name, email, password, phone
   - Doctors: SLMC registration number, specialty
   - Organizers: company name, business type

2. On form submission, the client:
   - Validates required fields based on user type
   - Checks API and database connectivity
   - Sends the appropriate data to the server

### Server-Side

1. **API Endpoint** (`/api/auth/register`):
   - Receives the registration data
   - Validates based on user type
   - Passes to `authService.register()`

2. **Auth Service** (`authService.js`):
   - Creates the appropriate document based on user type:
     - `User` model for regular users
     - `Doctor` model for doctors
     - `Organizer` model for organizers
   - Creates a `Credentials` document with:
     - Email
     - Hashed password
     - Reference to the user document
     - User type information

3. **Data Models**:
   - `User.js`: Regular user profile information
   - `Doctor.js`: Doctor-specific fields including medical credentials
   - `Organizer.js`: Organization and event management data
   - `Credentials.js`: Authentication information linked to a specific user

## Authentication Flow

1. **Login**: User provides email and password
2. **Credential Verification**: Server checks the `credentials` collection
3. **User Data Retrieval**: Based on the user type stored in credentials, fetches the appropriate user document
4. **Token Generation**: Creates a JWT token with user ID and type
5. **Response**: Returns token and basic user information

## Data Models

### Credentials Collection

```javascript
{
  email: String,        // User email (unique)
  password: String,     // Hashed password
  userType: String,     // 'user', 'doctor', or 'organizer'
  userId: ObjectId,     // Reference to user document
  userModel: String,    // 'User', 'Doctor', or 'Organizer'
  isVerified: Boolean,  // Email verification status
  // ... other fields
}
```

### User Types

Each user type has its own specific fields:

- **Users**: General profile, preferences, booking history
- **Doctors**: Medical credentials, specialties, practices
- **Organizers**: Company info, event management, business details

## Troubleshooting

- Check server logs for registration errors (`server/logs` or console output)
- Verify database connection status
- Check for duplicate emails
- Ensure all required fields for specific user types are provided

## Development Notes

When modifying the registration system:

1. Ensure consistent validation between client and server
2. Update all relevant models when adding new fields
3. Check both user-specific models and the credentials model 