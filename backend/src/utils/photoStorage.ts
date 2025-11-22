/**
 * @fileoverview Photo storage utility for event photos
 * Handles saving base64 encoded photos to filesystem and managing photo files
 */

import fs from 'fs';
import path from 'path';

const GENERATED_DIR = path.join(__dirname, '../../generated');

/**
 * Ensure the generated directory exists
 */
const ensureGeneratedDir = (): void => {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
};

/**
 * Check if a string is a valid base64 data URI
 * 
 * @param data - String to check
 * @returns True if valid base64 data URI, false otherwise
 */
export const isBase64DataUri = (data: string): boolean => {
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
  return base64Regex.test(data);
};

/**
 * Check if a string is a valid HTTP/HTTPS URL
 * 
 * @param data - String to check
 * @returns True if valid URL, false otherwise
 */
export const isValidUrl = (data: string): boolean => {
  try {
    const url = new URL(data);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Save a base64 encoded photo to the filesystem
 * 
 * @param base64Data - Base64 data URI string (e.g., "data:image/png;base64,...")
 * @param eventId - Event ID for filename generation
 * @returns Filename of saved photo
 * @throws Error if base64 data is invalid or file save fails
 */
export const saveEventPhoto = async (
  base64Data: string,
  eventId: string
): Promise<string> => {
  try {
    ensureGeneratedDir();

    // Extract mime type and base64 content
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data URI format');
    }

    const extension = matches[1];
    const base64Content = matches[2];

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `event-${eventId}-${timestamp}.${extension}`;
    const filepath = path.join(GENERATED_DIR, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filepath, buffer);

    console.log(`Event photo saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Error saving event photo:', error);
    throw new Error(`Failed to save event photo: ${(error as Error).message}`);
  }
};

/**
 * Delete a photo file from the filesystem
 * 
 * @param filename - Name of the file to delete
 * @returns True if file was deleted, false if file didn't exist
 */
export const deleteEventPhoto = (filename: string): boolean => {
  try {
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.warn(`Attempted to delete file with invalid path: ${filename}`);
      return false;
    }

    const filepath = path.join(GENERATED_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Event photo deleted: ${filename}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting event photo:', error);
    return false;
  }
};

/**
 * Validate and process photo data (base64 or URL)
 * 
 * @param photoData - Photo data (base64 data URI or HTTP/HTTPS URL)
 * @param eventId - Event ID for base64 filename generation
 * @returns Filename (for base64) or URL (for external URLs)
 * @throws Error if photo data is invalid
 */
export const processEventPhoto = async (
  photoData: string,
  eventId: string
): Promise<string> => {
  if (!photoData || !photoData.trim()) {
    throw new Error('Photo data is required');
  }

  // Check if it's a base64 data URI
  if (isBase64DataUri(photoData)) {
    return await saveEventPhoto(photoData, eventId);
  }

  // Check if it's a valid URL
  if (isValidUrl(photoData)) {
    return photoData; // Store URL as-is
  }

  throw new Error('Invalid photo format. Must be base64 data URI or valid URL');
};

/**
 * Check if a photo is a filename (local) or URL (external)
 * 
 * @param photo - Photo string to check
 * @returns 'local' if filename, 'external' if URL, 'unknown' otherwise
 */
export const getPhotoType = (photo: string): 'local' | 'external' | 'unknown' => {
  if (isValidUrl(photo)) {
    return 'external';
  }
  if (photo.startsWith('event-') && /\.(jpg|jpeg|png|gif|webp)$/i.test(photo)) {
    return 'local';
  }
  return 'unknown';
};

/**
 * Save an uploaded file (from multer) to the filesystem
 * 
 * @param file - Multer file object
 * @param identifier - Unique identifier for filename generation (e.g., eventId, userId)
 * @returns Object with filename and URL
 * @throws Error if file save fails
 */
export const saveUploadedFile = async (
  file: Express.Multer.File,
  identifier: string
): Promise<{ filename: string; url: string }> => {
  try {
    ensureGeneratedDir();

    // Get file extension from original filename or mimetype
    let extension = 'jpg';
    if (file.originalname) {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        extension = ext;
      }
    } else if (file.mimetype) {
      extension = file.mimetype.split('/')[1];
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `event-${identifier}-${timestamp}.${extension}`;
    const filepath = path.join(GENERATED_DIR, filename);

    // Save buffer to file
    fs.writeFileSync(filepath, file.buffer);

    console.log(`Uploaded file saved: ${filename}`);
    return {
      filename,
      url: `/static/${filename}`,
    };
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    throw new Error(`Failed to save uploaded file: ${(error as Error).message}`);
  }
};



