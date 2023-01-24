const wishlist = require('../models/wishlist')
const admin_products = require('../models/admin_products')


const { ObjectId, LoggerLevel } = require('mongodb')

module.exports = {

  wishlistPage: async (req, res) => {
    let userId = req.session.user._id
    let proWish = await wishlist.find({ user: ObjectId(userId) }).populate('products.item')
    console.log(proWish);
    res.render('user/wishlist', { title: 'Wishlist', proWish })
  },

  add_to_wishlist:async(req,res)=>{
    let prodId=req.params.id
    let userId=req.session.user._id 
     let product=await admin_products.findOne({_id:prodId})
   let prodObj={
     item:prodId,
     price:product.selling_price
   }
   // console.log(prodId,"id");
   // console.log(prodObj,"obj");
   
    let userWish= await wishlist.findOne({user:userId})
    if(userWish){
     let itemIndex = userWish.products.findIndex((p) => p.item == prodId);
   
     if (itemIndex > -1) { 
      res.json({added:true})
     } else {
       //product does not exists in wishlist, add new item
       await wishlist.updateOne({user:userId},{$push:{products:prodObj}})
       res.json({status:true})
     }
   
    }else{
     let wishObj= new wishlist({
       user:userId,
       products:[prodObj],
     })
     wishObj.save().then(()=>{
       res.json({status:true})
       // res.redirect('/categories')
     })
     
    }
  },

  removeWishlist: async (req, res) => {

    let details = req.body
    let product = await admin_products.findOne({ _id: details.product })
    let wishData = await wishlist.updateOne({ _id: details.wishlist }, { $pull: { products: { item: details.product } } })
    if (wishData) {
      res.json({ removeProduct: true })
    }
  
  }
}