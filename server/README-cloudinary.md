# Cloudinary Integration for Eventuraa

This document provides instructions for setting up Cloudinary image upload functionality in the Eventuraa application.

## Setup

1. **Create a Cloudinary Account**
   - Sign up at [https://cloudinary.com/](https://cloudinary.com/)
   - Get your Cloud Name, API Key, and API Secret from the dashboard

2. **Update Environment Variables**
   - Create a `.env` file in the server directory if it doesn't exist
   - Add the following variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

## Usage

The application now supports event image uploads through the event creation form. The form should:

1. Allow selecting multiple images for the event (up to 10)
2. Allow selecting a single cover image
3. Submit these files using multipart/form-data with field names:
   - `images` for multiple event images
   - `coverImage` for the single cover image

## Implementation Details

- The uploaded images are stored in the Cloudinary cloud storage
- Image URLs are stored in the Event model:
  - Multiple images are stored in the `images` array
  - Cover image is stored in the `coverImage` field
- Image uploads are processed during event creation
- Images are automatically optimized by Cloudinary for web delivery

## Testing

To test the image upload functionality:
1. Create a new event through the organizer dashboard
2. Select multiple images for the event gallery
3. Select a cover image for the event
4. Submit the form
5. Verify that the images are displayed correctly in the event details 