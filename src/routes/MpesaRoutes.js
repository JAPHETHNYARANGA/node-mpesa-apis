import express from 'express';
import mpesaController from '../controllers/mpesaController.js';

const router = express.Router();


// Route to initiate STK Push
router.post('/getStk', mpesaController.getStkPush);


export default router;
