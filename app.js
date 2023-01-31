require('dotenv').config()
const express = require('express')
const expressLayouts = require('express-ejs-layouts')

 
const session = require('express-session')
const bodyParser = require('body-parser')
// const fileUpload = require('express-fileupload')
const path = require('path')
const bcrypt =require('bcrypt')
//const db=require('./config/connection')
const morgan = require('morgan')
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')
const { default: mongoose } = require('mongoose')
const createError = require("http-errors");

const app=express()
const PORT=process.env.PORT||4000
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.get('/set-cookie', (req, res) => {
  // Set the expiration date to one year in the future
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  res.cookie('my-cookie', 'my-value', {
    expires: expirationDate
  });
  res.send('Cookie set');
});

 

// app.use(morgan('combined'))
app.use(express.static(__dirname + "/public"));

//cache clearing... 
app.use(function (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
next();
});

 

mongoose.set('strictQuery',true)
//database connection
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', (error)=>{console.log(error)})
db.once('open',()=>{console.log("connected to database")})

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(session({
  secret:"my key",
  saveUninitialized:true,
  resave:false,
  store:new session.MemoryStore(),
  cookie: {
    maxAge: 86400000 
  }
}))
app.use((req,res,next)=>{
  res.locals.message =req.session.message
  delete req.session.message
  next()
})

 




app.use(expressLayouts)
app.set('layout','./layout/layout')
app.set('view engine', 'ejs');
app.set('views','views')
// app.use(fileUpload())

 

app.use(bodyParser.urlencoded({extended:false}))
app.use('/admin',adminRouter)
app.use('/',userRouter)


 
app.use(function(req, res, next) {
  next(createError(404));
});
 


app.use( (err, req, res, next) => {
  let errStatus = err.status || 500;
  // render the error page
  // console.log(err);
  res.status(errStatus);
  if(errStatus==404) {
    // console.error(err);
    res.render('errorPage',{title:"Page not found"})
  }else{
        res.send('<div style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; text-align:center;"><h2 style="color:red;">500 |  Internal error detected!</h2> We will be back soon..</div>')
        // res.render('error');
        
    }
});


 

app.listen(PORT,()=>{
  console.log('server running at port 3000');
})