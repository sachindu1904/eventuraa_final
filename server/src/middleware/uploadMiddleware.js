const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// Create a multer storage for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      console.log(`Storing temporary file in: ${tempDir}`);
      cb(null, tempDir);
    } catch (err) {
      console.error('Error creating temp directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + fileExt;
      console.log(`Generated filename: ${filename} for original: ${file.originalname}`);
      cb(null, filename);
    } catch (err) {
      console.error('Error generating filename:', err);
      cb(err);
    }
  }
});

// Create a file filter for image types
const fileFilter = (req, file, cb) => {
  try {
    console.log(`Filtering file: ${file.originalname}, mimetype: ${file.mimetype}`);
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      console.error(`Rejected file: ${file.originalname} - not an image`);
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  } catch (err) {
    console.error('Error in file filter:', err);
    cb(err);
  }
};

// Configure multer upload for multiple fields
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Middleware function that wraps the multer error handling
const uploadEventImages = (req, res, next) => {
  console.log('Starting file upload process');
  console.log('Request headers:', req.headers);
  
  const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },  // Up to 10 event images
    { name: 'coverImage', maxCount: 1 } // Single cover image
  ]);
  
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error during file upload',
        error: err.message
      });
    }
    
    console.log('Files uploaded successfully to temp storage');
    console.log('Uploaded files:', req.files);
    next();
  });
};

// Helper function to upload file to cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log(`Uploading file to Cloudinary: ${filePath}`);
    
    // Upload the image to cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'eventuraa-events',
      use_filename: true
    });
    
    console.log(`Cloudinary upload success: ${result.secure_url}`);
    
    // Remove the local file after upload
    fs.unlinkSync(filePath);
    console.log(`Temporary file removed: ${filePath}`);
    
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading to Cloudinary: ${error.message}`);
    // Clean up the file on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file after error: ${filePath}`);
      } catch (unlinkError) {
        console.error(`Failed to clean up temp file: ${unlinkError.message}`);
      }
    }
    throw error;
  }
};

// Function to process uploaded files into URLs
const processUploadedFiles = async (req, res, next) => {
  try {
    console.log('Processing uploaded files');
    
    // Initialize empty arrays/strings for images
    req.processedImages = {
      imageUrls: [],
      coverImageUrl: ''
    };

    // Process multiple images
    if (req.files && req.files.images && req.files.images.length > 0) {
      console.log(`Processing ${req.files.images.length} event images`);
      
      // Upload each image to cloudinary
      const uploadPromises = req.files.images.map(file => 
        uploadToCloudinary(file.path)
      );
      
      // Wait for all uploads to complete
      req.processedImages.imageUrls = await Promise.all(uploadPromises);
      console.log('All images uploaded to Cloudinary:', req.processedImages.imageUrls);
    } else {
      console.log('No event images to process');
    }

    // Process cover image
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
      console.log('Processing cover image');
      req.processedImages.coverImageUrl = await uploadToCloudinary(req.files.coverImage[0].path);
      console.log('Cover image uploaded to Cloudinary:', req.processedImages.coverImageUrl);
    } else {
      console.log('No cover image to process');
    }

    next();
  } catch (err) {
    console.error('Error processing uploaded files:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process uploaded files',
      error: err.message
    });
  }
};

// Middleware function for uploading venue images
const uploadVenueImages = (req, res, next) => {
  console.log('Starting venue images upload process');
  console.log('Request headers:', req.headers);
  
  const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 }, // Up to 10 venue images
  ]);
  
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error during file upload',
        error: err.message
      });
    }
    
    console.log('Venue images uploaded successfully to temp storage');
    console.log('Uploaded files:', req.files);
    next();
  });
};

// Middleware for uploading profile images
const uploadProfileImage = (req, res, next) => {
  console.log('Starting profile image upload process');
  console.log('Request headers:', req.headers);
  
  const uploadSingle = upload.single('profileImage');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('Multer profile image upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error during file upload',
        error: err.message
      });
    }
    
    console.log('Profile image uploaded successfully to temp storage');
    console.log('Uploaded file:', req.file);
    next();
  });
};

// Process uploaded profile image
const processProfileImage = async (req, res, next) => {
  try {
    console.log('Processing uploaded profile image');
    
    // Process profile image only if it exists
    if (req.file) {
      console.log(`Processing profile image: ${req.file.path}`);
      
      try {
        // Upload the image to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'eventuraa-profiles',
          use_filename: true
        });
        
        console.log(`Profile image uploaded: ${result.secure_url}`);
        
        // Add the image URL to the request
        req.profileImageUrl = result.secure_url;
        
        // Remove the local file after upload
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error(`Error uploading profile image to Cloudinary: ${error.message}`);
        if (fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error(`Failed to clean up temp file: ${unlinkError.message}`);
          }
        }
        throw error;
      }
    } else {
      console.log('No profile image to process');
    }

    next();
  } catch (err) {
    console.error('Error processing profile image:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process profile image',
      error: err.message
    });
  }
};

// Process uploaded venue images
const processVenueImages = async (req, res, next) => {
  try {
    console.log('Processing uploaded venue images');
    
    req.processedVenueImages = [];

    // Process venue images
    if (req.files && req.files.images && req.files.images.length > 0) {
      console.log(`Processing ${req.files.images.length} venue images`);
      
      // Upload each image to cloudinary
      const uploadPromises = req.files.images.map(async (file) => {
        try {
          console.log(`Uploading venue image to Cloudinary: ${file.path}`);
          
          // Upload the image to cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'eventuraa-venues',
            use_filename: true
          });
          
          console.log(`Venue image uploaded: ${result.secure_url}`);
          
          // Remove the local file after upload
          fs.unlinkSync(file.path);
          
          return {
            url: result.secure_url,
            public_id: result.public_id,
            caption: '',
            isMain: req.processedVenueImages.length === 0 // First image is the main image
          };
        } catch (error) {
          console.error(`Error uploading to Cloudinary: ${error.message}`);
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              console.error(`Failed to clean up temp file: ${unlinkError.message}`);
            }
          }
          throw error;
        }
      });
      
      // Wait for all uploads to complete
      req.processedVenueImages = await Promise.all(uploadPromises);
      console.log('All venue images uploaded to Cloudinary:', req.processedVenueImages);
    } else {
      console.log('No venue images to process');
    }

    next();
  } catch (err) {
    console.error('Error processing venue images:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process venue images',
      error: err.message
    });
  }
};

module.exports = {
  uploadEventImages,
  processUploadedFiles,
  uploadVenueImages,
  processVenueImages,
  uploadProfileImage,
  processProfileImage
}; 