import express from 'express';


const app = express()
const PORT = process.env.port || 5000

app.use(express.json())



app.listen(port, ()=>{
    console.log(`Server running on port ${PORT}`);
})