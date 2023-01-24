
const mongoose=require('mongoose');


const wishlistSchema=new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_users"
      },
    products: [
        {
          item:{
            type:mongoose.Schema.Types.ObjectId ,
            ref:"admin_products"
          },
        }
      ],
  
   
})
module.exports = mongoose.model("wishlist",wishlistSchema);

 