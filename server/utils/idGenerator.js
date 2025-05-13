/**
 * Generates a unique booking reference number
 * Format: EVB-YYYYMMDD-XXXX where X is a random alphanumeric character
 * @returns {string} A unique booking reference
 */
function generateBookingReference() {
  const prefix = 'EVB'; // Eventura Booking
  
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate 4 random alphanumeric characters
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomStr += charset[randomIndex];
  }
  
  return `${prefix}-${dateStr}-${randomStr}`;
}

module.exports = {
  generateBookingReference
}; 