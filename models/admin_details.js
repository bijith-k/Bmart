const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
  },
  phone:{
    type:String,
    required:true,
  },
  password:{
    type:String,
    required:true,
  }
})

module.exports = mongoose.model('admin_details', adminSchema)

