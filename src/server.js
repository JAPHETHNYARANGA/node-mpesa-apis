import express from 'express';
import mpesaRoute from './routes/MpesaRoutes.js';
import dotenv from 'dotenv'

//Load env variables
dotenv.config();

const app = express()
const PORT = process.env.port || 5000

app.use(express.json())

app.use('/api', mpesaRoute)

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})