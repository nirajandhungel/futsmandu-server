import multer from 'multer';
import type { Request } from 'express';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};

export const ownerDocumentsUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 3,
    },
}).fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
]);

// Futsal court images upload (multiple images)
export const futsalCourtImagesUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 10, // Maximum 10 images
    },
}).array('images', 10);

// Venue creation with venue images and court images
// Handles: venueImages (array) and courtImages[0], courtImages[1], etc. (arrays)
// Uses any() to handle dynamic field names for court images
export const venueCreationUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 50, // Maximum 50 images total (venue + all courts)
    },
}).any();

