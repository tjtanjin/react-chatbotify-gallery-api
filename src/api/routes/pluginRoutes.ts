import express from 'express';
import { getPlugins } from '../controllers/pluginController';

const router = express.Router();

router.get('/', getPlugins);

export default router;
