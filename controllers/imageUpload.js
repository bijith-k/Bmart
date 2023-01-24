const sharp = require('sharp');
const multer = require('multer')
const admin_products = require('../models/admin_products')



const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb('Upload only images',false)
  }
}

const upload = multer({ storage: multerStorage, fileFilter : multerFilter})

//image uploading

const uploadFiles = upload.array('images',4)

module.exports = {
  
uploadImages : (req,res,next)=>{
  uploadFiles(req,res,(err)=>{
    if(err instanceof multer.MulterError){
      if(err.code === 'LIMIT_UNEXPECTED_FILE'){
        return res.send('Too many files to upload !')
      }
    }else if(err){
      res.send(err)
    }
  })
  console.log('upload');
  next()
},

//resizing

resizeImages : async(req,res,next)=>{
if(!req.files) return next()

req.body.images =[]
await Promise.all(
  req.files.map(async(file)=>{
    const filename = file.originalname.replace(/\..+$/,'')
    const newFilename =  `bmart-${filename}-${Date.now()}.jpeg`
  
    await sharp(req.file.buffer)
    .extract({ width: 300, height: 300})
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`uploads/${newFilename}`)
    req.body.images.push(newFilename)
  })
)
console.log('resize');
next()
 },

 getResultImages : (req,res)=>{
  if (req.body.images.length <= 0) {

    return res.send(`You must select at least 1 image !`);
  }
  
  const images = req.body.images.map((image)=>{' '+image+' '}).join(', ')

const product = new admin_products({
  name: req.body.name,
  category: req.body.category,
  description: req.body.description,
  selling_price: req.body.selling_price,
  listing_price: req.body.listing_price,
  stock_count: req.body.stock_count,
  images: images,
})
console.log(product);
product.save((err) => {
  if (err) {
    res.json({ message: err.message, type: "danger" })
  } else {
    req.session.message = {
      type: 'success',
      message: 'Product added successfully'
    }
    res.redirect('/admin/admin_product')
  }
})
console.log('result');
}

}