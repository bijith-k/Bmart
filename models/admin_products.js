const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
  },
  category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Category",
    required:true,
  },
  listing_price:{
    type:Number,
required:true,
  },
  selling_price:{
    type:Number,
    required:true,
  },
  description:{
    type:String,
    required:true,
  },
  stock_count:{
    type:String,
    required:true,
  },
  images:[{
     
    type:String,
    required:true,
  }],
  status:{
    type:String,
    default:'in stock'
  },
  created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  deleted:{
    type:Boolean,
    default:'false'
  }
})


module.exports = mongoose.model('admin_products', productSchema)
