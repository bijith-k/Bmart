const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  min_bill: {
    type: Number
  },
  cap: {
    type: Number
  }
  ,
  used_user: {
    type:[mongoose.Schema.Types.ObjectId],
    ref: 'admin_users'
},

  discount: {
    type: Number,
    required: true,
    default: 0
  },
  expire: {
    type: Date,
    required: true
  }
})

couponSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('coupons', couponSchema)