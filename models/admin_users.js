const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password:{
    type:String,
    required:true,
  },
  status: {
    type: String,
    default:'unblocked',
  },
  created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  token:{
    type:String,
    default:'empty'
  },
  address: [{
    name: {
      type: String,
      
    },
    house: {
      type: String,
      
    },
    post: {
      type: String,
       
    },
    city: {
      type: String,
       
    },
    district: {
      type: String,
       
    },
    state: {
      type: String,
       
    },
    pin: {
      type: Number,
      
    }
  }]
})

module.exports = mongoose.model('admin_users', userSchema)