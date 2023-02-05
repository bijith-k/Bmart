
const admin_products = require('../models/admin_products')
const cart = require('../models/cart')

const { ObjectId, LoggerLevel } = require('mongodb')
const createError = require("http-errors");


module.exports = { 

  cartPage:  async (req, res,next) => {
    try {
      let userId = req.session.user._id
    let user = req.session.user
    let prodList = await cart.find({ user: ObjectId(userId) }).populate('products.item')
    res.render('user/cart', { title: 'Cart', prodList,user })
    } catch (error) {
      next(createError(404));
    }
  },

  add_to_cart:async(req,res,next)=>{
    try {
   let prodId=req.params.id
   let userId=req.session.user._id 
    let product=await admin_products.findOne({_id:prodId})
  let prodObj={
    item:prodId,
    quantity:1,
    price:product.selling_price
  }
   let userCart= await cart.findOne({user:userId})
   if(userCart){
    let itemIndex = userCart.products.findIndex((p) => p.item == prodId);
  
    if (itemIndex > -1) { 
      const quantity = userCart.products[itemIndex].quantity
      let cartD = await cart.updateOne({user:userId,"products.item":prodId},{$inc:{"products.$.quantity":1,"products.$.price":product.selling_price,totalprice:product.selling_price}})
      if(cartD){
        res.json({status:true})
      }
    } else {
      //product does not exists in cart, add new item
      let cartD = await cart.updateOne({user:userId},{$push:{products:prodObj},$inc:{totalprice:product.selling_price}})
      if(cartD){
        res.json({status:true})
      }
    }
  
   }else{
    let cartObj= new cart({
      user:userId,
      products:[prodObj],
      totalprice:product.selling_price
    })
    cartObj.save().then(()=>{
      res.json({status:true})
    })
   }
    } catch (error) {
      next(createError(404));
    }
    
  },
  changeQuantity: async (req, res, next) => {
    try {
      let totalPrice
    let productTotal
    let details = req.body
    let product = await admin_products.findOne({ _id: details.product })
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
    if (details.count == -1 && details.quantity == 1) {
  
      let cartData = await cart.findByIdAndUpdate({ _id: details.cart }, { $pull: { products: { item: details.product } }, $inc: { 'totalprice': product.selling_price * details.count } })
      totalPrice = cartData.totalprice
      productTotal = product.selling_price
  
      if (cartData) {
        res.json({ removeProduct: true, totalPrice, productTotal })
      }
    }
    else {
      let cartData = await cart.updateOne({ _id: details.cart, "products.item": details.product }, { $inc: { 'products.$.quantity': details.count, 'products.$.price': product.selling_price * details.count, 'totalprice': product.selling_price * details.count } })
      let cartDetails = await cart.findOne({ _id: details.cart })
      let itemIndex = cartDetails.products.findIndex((p) => p.item == details.product)
      let q = cartDetails.products[itemIndex].quantity
  
      totalPrice = cartDetails.totalprice
      productTotal = product.selling_price
      res.json({ status: true, totalPrice, productTotal, q })
    }
    } catch (error) {
      next(createError(404));
    }
  }
  ,

  removeProduct: async (req, res,next) => {
    try {
    let details = req.body
    let product = await admin_products.findOne({ _id: details.product })
    let cartData = await cart.findByIdAndUpdate({ _id: details.cart }, { $pull: { products: { item: details.product } }, $inc: { 'totalprice': -product.selling_price } })
  
    let totalPrice = cartData.totalprice
    let productTotal = product.selling_price
    if (cartData) {
      res.json({ removeProduct: true, totalPrice, productTotal })
    }
    } catch (error) {
      next(createError(404));
    }
  },
}