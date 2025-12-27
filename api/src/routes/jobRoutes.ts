import { Router } from 'express';
import jobController from '../controllers/jobController';

const router = Router();

router.post('/submit', jobController.submitJob.bind(jobController));
router.get('/status/:id', jobController.getStatus.bind(jobController));
router.get('/result/:id', jobController.getResult.bind(jobController));

export default router;
