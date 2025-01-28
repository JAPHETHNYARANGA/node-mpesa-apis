import express from 'express';
import mpesaController from '../controllers/mpesaController.js';

const router = express.Router();


// Route to initiate STK Push
router.post('/getStk', mpesaController.getStkPush);

router.post('/callBackUrl', mpesaController.getCallbackUrl);


export default router;
