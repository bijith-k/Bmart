const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "admin_users"
  },
  address: {
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
  },
  total: {
    type: Number,
  },
  discount_amount: {
    type: Number,
  },
  grand_total: {
    type: Number,
  },
  order_status: {
    type: String,
    default: 'pending'
  },
  payment: {
    pay_method: { type: String },
    pay_id: { type: String },
    pay_order_id: { type: String },
    pay_status: { type: String, default: 'pending' }
  },
  products: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'admin_products' },
    quantity: { type: Number, },
    price: { type: Number, },

  }]
  ,
  delivery_status: {
    ordered:{
      state:{type:Boolean, default:false},
      date:{type:Date},
  },
    shipped: {
      state: { type: Boolean, default: false },
      date: { type: Date },
    },
    out_for_delivery: {
      state: { type: Boolean, default: false },
      date: { type: Date },
    },
    delivered: {
      state: { type: Boolean, default: false },
      date: { type: Date },
    },
    cancelled: {
      state: { type: Boolean, default: false },
      date: { type: Date },
    }
  },
  coupon: {
    name: { type: String },
    code: { type: String },
    discount: { type: Number },
  },
  ordered_date: {
    type: Date,
    default: Date.now()
  },
})

module.exports = mongoose.model('orders', orderSchema)