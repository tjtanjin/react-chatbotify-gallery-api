import express from 'express';
import {
  editPlugin,
  getPlugins,
  publishPlugin,
} from '../controllers/pluginController';
import checkUserSession from '../middleware/userSessionMiddleware';
import multer from 'multer';
import { getFileExtension } from './themeRoutes';

// multer storage configuration
const storage = multer.memoryStorage();

// file upload middleware with file type filter and limits
const upload = multer({
  // todo: review this limit
  limits: {
    fileSize: 5 * 1024 * 1024, // default to 5mb
  },
  fileFilter: (req, file, cb) => {
    // allow only these file extensions
    const allowedExtensions = ['png'];
    const fileExtension = getFileExtension(file.originalname);
    // todo: can enforce file name together with extension as well
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file extension'));
    }
  },
  storage,
});
const router = express.Router();

router.get('/', getPlugins);

// TODO: publish a plugin
router.post(
  '/publish',
  checkUserSession,
  upload.fields([{ name: 'imgUrl', maxCount: 1 }]),
  publishPlugin,
);

// TODO:  edit a plugin
router.patch('/', upload.fields([{ name: 'imgUrl', maxCount: 1 }]), editPlugin);

export default router;
