require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
const connectDB = require("./db/connection");
const cookieParser = require('cookie-parser')
const compression = require("compression");

const PORT = 8200 | process.env.PORT;

 /* "http://192.168.188.52:3000" */
 const corsOptions = {
  origin: ["*"/* 'http://192.168.188.52:3000', 'http://localhost:3000' */],
  credentials:true
}  

app.use(compression())
app.use(bodyParser.json(bodyParser.urlencoded({extended:true})));
app.use(cookieParser());
app.use(cors(corsOptions));


const connect = async  () => {
  const conn = await connectDB();
  app.use("/auth" , require("./routes/auth"));
  //app.use("/video" ,  require("./routes/videoRoute"));
  app.use("/upload" , require("./routes/upload"));
  app.use("/watch" , require("./routes/watch"));  
  app.use("/" , (_,res) => res.redirect("/watch"))

  app.listen(PORT, () =>{console.log(`server is listening at port ${PORT}`)})
}

connect();
