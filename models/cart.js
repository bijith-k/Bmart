
const mongoose=require('mongoose');
const CartSchema=new mongoose.Schema({
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
          quantity:{
            type: Number,
          },
          price:{
            type:Number
          }
          
        }
        
      ],
    totalprice:{
      type:Number
     }
   
})
module.exports = mongoose.model("Cart",CartSchema);

 