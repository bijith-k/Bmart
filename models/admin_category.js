const mongoose = require('mongoose')


const categorySchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
    unique: true,
    set: value => value.toLowerCase()
  },
  image:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true,
  },
  deleted:{
    type:Boolean,
    default:false
  }
})

 
module.exports = mongoose.model('Category',categorySchema)