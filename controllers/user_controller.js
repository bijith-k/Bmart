const admin_users = require('../models/admin_users')
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer")
const Category = require('../models/admin_category')
const Banner = require('../models/admin_banner')
const cart = require('../models/cart')
const wishlist = require('../models/wishlist')
const { ObjectId, LoggerLevel } = require('mongodb')
const admin_products = require('../models/admin_products')
const coupon = require('../models/admin_coupons')
const orders = require('../models/admin_orders')
const randomstring = require('randomstring')

const ITEMS_PAGE = 6

let transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,

  auth: {
    user: 'bijithkatteeri011@gmail.com',
    pass: 'xjhfmHtc08wkOr9U',
    }

});
var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);


// const sendResetPasswordMail = async (name, email, token) => {
//   try {
//     let transporter = nodemailer.createTransport({
//       host: "smtp-relay.sendinblue.com",
//       port: 587,

//       auth: {
//         user: 'bijithkatteeri011@gmail.com',
//         pass: 'xjhfmHtc08wkOr9U',
//       }

//     });

//     var mailOptions = {
//       to: email,
//       from: 'bmart@gmail.com',
//       subject: "Link for resetting password: ",
//       html: '<p>Hi ' + name + ',Forgot password?</p> <p> Click the link below to reset password </p><a href="http://localhost:3000/reset-password?token=' + token + '">Click here</a>' // html body
//     }
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         return console.log(error);
//       }
//       console.log(mailOptions.html);
//       console.log('Message sent: %s', info.messageId);
//       console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//     })

//   } catch (error) {
//     console.log(error);
//   }
// }



module.exports = {

  homePage:async(req, res) => {
    
   const categories = await Category.find()
   const banners = await Banner.find()
   const users = await admin_users.find()
  //  let length=null
  //  if(req.session.user){
  //   let cartnum = await cart.findOne({user:req.session.user._id })
  //   let length = cartnum.products.length
  //   console.log(length,"dddsf");
  //  }
    res.render('user/home', { title: 'Home',categories,banners,users})
  },

  registrationPage:(req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect('/')
    } else {
      res.render('user/register', { title: 'Signup' })
    }
  },
getOTP: (req, res) => {

  let { name, email, password, phone } = req.body
    Name = req.body.name,
    Email = req.body.email,
    Password = req.body.password,
    Phone = req.body.phone
    admin_users.find({ email: Email }).then((result) => {
      if (result.length) {
        req.session.message = {
          type: 'danger',
          message: 'User with the provided email already exists'
        }
        res.redirect('/user-registration')
      } else {
        var mailOptions = {
          to: req.body.email,
          from:'bmart@gmail.com',
          subject: "Otp for registration is: ",
          html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        }
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

          res.render('user/otp',{title:'Verify otp'})
        });
      }
    }).catch((err) => {
      console.log(err);
      res.json({
        status: 'FAILED',
        message: 'An error occured while checking for existing user'
      })
    })
},

resendOTP: (req,res)=>{
  var mailOptions = {
    to: Email,
    from:'bmart@gmail.com',
    subject: "Otp for registration is: ",
    html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    res.render('user/otp',{title:'Verify otp'})
  });
},

verifyOTP: (req,res)=>{
  if(req.body.otp==otp){
   
    console.log('otp correct');
    const user= new admin_users({
      name:Name,
      email:Email,
      password:Password,
      phone:Phone,
    })
    const saltRounds = 10
    bcrypt.hash(user.password, saltRounds).then((hashedPassword) => {
      user.password = hashedPassword
      user.save().then((data) => {
        req.session.message = {
          type: 'success',
          message: 'Signup successful'
        }
        req.session.userLoggedIn=true
        req.session.user=data
        res.redirect('/')
      }).catch((err) => {
        res.json({
          status: "FAILED",
          message: 'An error occured while saving password'
        })
        console.log(err);
      })

    }).catch((err) => {
      console.log(err);
      res.json({
        status: "FAILED",
        message: 'An error occured while hashing password'
      })
    })
}else{
  console.log('otp incorrect');
  req.session.message = {
    type: 'danger',
    message: 'Entered otp is incorrect'
  }
  req.session.userLoggedIn=false
  res.render('user/otp',{title:'verify OTP'})
}
},

signinPage:(req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { title: 'Signin' })
  }
},

signin:async(req, res) => {
  let { email, password } = req.body
  email = email.trim()
  password = password.trim()

  if (email == "" || password == "") {
    res.json({
      status: 'FAILED',
      message: "Empty credentials"
    })
  }
  else {
  //  const users = await admin_users.find()
    admin_users.findOne({ email, status:'unblocked' }).then((data) => {
      if (data) {
        //data.length
        const hashedPassword = data.password
        bcrypt.compare(password, hashedPassword).then((result) => {
          if (result) {
            req.session.message = {
              type: 'success',
              message: 'Signin successful'
            }
            req.session.userLoggedIn=true
            req.session.user=data
            res.redirect('/')
          } else {
            req.session.userLoggedIn=false
            req.session.message = {
              type: 'danger',
              message: 'Invalid password'
            }
            res.redirect('/user-signin')
          }
        })
        .catch((err) => {
          res.json({
            status: 'FAILED',
            message: 'An error occured while comparing'
          })
          console.log(err);
        })
      } else {
        req.session.message = {
          type: 'danger',
          message: 'Invalid credentialssss'
        }
        res.redirect('/user-signin')
      }
    })
.catch((err)=>{
  console.log(err);
  req.session.message = {
    type: 'danger',
    message: 'Invalid credentialsd'
  }
  res.redirect('/user-signin')
  
})
  }
  },

  forgotPasswordPage:(req, res) => {
    res.render('user/forgotPassword', { title: 'Reset password' })
  },

  forgotPassword:  async (req, res) => {

    try {
      const email = req.body.email
      const oldUser = await admin_users.findOne({ email: email })
      if (oldUser) {
        const randomStringg = randomstring.generate()
        const updatedData = await admin_users.updateOne({ email: email }, { $set: { token: randomStringg } })
        // sendResetPasswordMail(oldUser.name, oldUser.email, randomStringg)

        var mailOptions = {
          to: oldUser.email,
          from: 'bmart@gmail.com',
          subject: "Link for resetting password: ",
          html: '<p>Hi ' + oldUser.name + ',Forgot password?</p> <p> Click the link below to reset password </p><a href="http://localhost:3000/reset-password?token=' + randomStringg + '">Click here</a>' // html body
        }
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log(mailOptions.html);
          console.log('Message sent: %s', info.messageId);
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })
  
        req.session.message = {
          type: 'primary',
          message: 'Please check your mail and reset your password'
        }
        res.redirect('/forgot-password')
      } else {
        req.session.message = {
          type: 'danger',
          message: 'No account with the entered email id'
        }
        res.redirect('/forgot-password')
      }
  
    } catch (err) {
      console.log(err);
    }
  },

  resetPasswordPage: async (req, res) => {
    try {
      const token = req.query.token
      const tokenData = await admin_users.findOne({ token: token })
      if (tokenData) {
        res.render('user/new-password', { user_id: tokenData._id, title: 'reset password' })
      } else {
        req.session.message = {
          type: 'danger',
          message: 'Link has been expired'
        }
        res.redirect('/forgot-password')
      }
    } catch (error) {
      console.log(error);
    }
  },
  
  resetPassword: async (req, res) => {
    try {
      const password = req.body.password
      const user_id = req.body.user_id
      const saltRounds = 10
      const newPass = await bcrypt.hash(password, saltRounds)
      const updatedData = await admin_users.findByIdAndUpdate({ _id: user_id }, { $set: { password: newPass, token: '' } }, { new: true })
      req.session.message = {
        type: 'success',
        message: 'User password has been reset'
      }
  
      res.redirect('/user-signin')
    } catch (error) {
      console.log(error);
    }
  },

  productListing : async (req, res) => {
    // console.log(req.query.category);
  
    const query = req.query.category
    if (query) {
      try {
        const categories = await Category.find()
        const products = await admin_products.find({ category: query })
        res.render('user/listing', { products, categories, title: 'categories' })
      }
      catch (error) {
        console.log(error);
      }
    }
    else if (req.query.search) {
      try {
        let key = req.query.search
        // let regex = new RegExp('^'+skey+'.*','i');
        // let products = await admin_products.aggregate([{$match:{ $or: [{name: regex },{discription: regex}] }}])
        let products = await admin_products.find({ name: { $regex: key, $options: 'i' }, deleted: false })
        const categories = await Category.find()
        res.render('user/listing', { products, categories, title: 'categories' })
      } catch (err) {
        console.log(err);
      }
    }
    else if (req.query.sort) {
      try {
        if (req.query.sort == "name") {
          let products = await admin_products.find().collation({ locale: "en" }).sort({ name: 1 })
          const categories = await Category.find()
          res.render('user/listing', { products, categories, title: 'categories' })
        }
        else if (req.query.sort = "price") {
          let products = await admin_products.find().sort({ selling_price: -1 }).collation({ locale: "en", numericOrdering: true })
          const categories = await Category.find()
          res.render('user/listing', { products, categories, title: 'categories' })
        }
  
      } catch (err) {
        console.log(err);
      }
    }
    else if (req.query.page) {
      const page = req.query.page
      let products = await admin_products.find({ deleted: false }).skip((page - 1) * ITEMS_PAGE).limit(ITEMS_PAGE)
      const categories = await Category.find()
      res.render('user/listing', { products, categories, title: 'categories' })
    }
    else {
      const categories = await Category.find()
      const products = await admin_products.find()
      res.render('user/listing', { products, categories, title: 'categories' })
    }

  },

  singleProduct: async (req, res) => {
    let id = req.params.id
  
    admin_products.findById(id, (err, product) => {
      if (err) {
        console.log(err);
      } else {
        if (product == null) {
          res.redirect('/categories')
        } else {
          res.render('user/single-product', { title: 'Product', product: product })
        }
      }
    }).populate('category')
  },


  accountPage:async (req, res) => {
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id})
    res.render('user/account', { title: 'Account',userInfo })
  },

  addressPage:async(req,res)=>{
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id})
    res.render('user/address', { title: 'Address',userInfo })
  },

  addAddress:async(req,res)=>{
    let id  = req.session.user._id
    let newaddresss={
      'name':req.body.name, 
      'house':req.body.house,
      'post':req.body.post,
      'city':req.body.city,
      'district':req.body.district,
      'state':req.body.state,
      'pin':req.body.pin
  }
  await admin_users.updateOne({_id:id},{$push:{address:newaddresss}})
 
  res.redirect('/address')
  },

  editAddressPage:async(req,res)=>{
    try{
      const addressId = req.params.id
      const userId= req.session.user._id
  
      let user = await admin_users.findOne({_id:userId})
      user.address.forEach((row)=>{
        if(row.id.toString()==addressId.toString()){
          res.json(row)
        }
      })
       
    }catch(err){
  console.log(err);
    }
  },

  updateAddress:async(req,res)=>{
    try{
      const addressId = req.params.id
    let addressUpdate ={
      'address.$.name':req.body.name,
      'address.$.house':req.body.house,
      'address.$.post':req.body.post,
      'address.$.city':req.body.city,
      'address.$.district':req.body.district,
      'address.$.state':req.body.state,
      'address.$.pin':req.body.pin
    }
    const userId= req.session.user._id
    await admin_users.updateOne({_id:userId,'address._id':addressId},{$set:addressUpdate}).then(()=>{
      res.redirect('/address')
    })
  }catch(err){
    console.log(err);
  }
  
  },

  deleteAddress:async(req,res)=>{

    try{
      let id = req.params.id
      let userId = req.session.user._id
      await admin_users.findByIdAndUpdate({_id:userId},{$pull:{address:{_id:id}}})
      res.json("deleted")
    }
    catch(err){
      console.log(err);
    }
  
  },

  editInfo:(req,res)=>{
    let id  = req.session.user._id
    admin_users.findByIdAndUpdate(id, {
      name: req.body.name,
      email:req.body.email,
      phone:req.body.phone
    }, (err, result) => {
      if (err) {
        console.log(err);
        res.json({ message: err.message, type: 'danger' })
      } else {
        req.session.message = {
          type: 'success',
          message: 'Details updated successfully'
        }
        res.redirect('/account')
      }
    })
  },

  settingsPage:async(req,res)=>{
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id})
    res.render('user/settings',{title:'Settings',userInfo})
  },

  changePassword:async (req, res) => {
    try {
      const password = req.body.password
      const user_id = req.session.user._id
      const saltRounds = 10
      const newPass = await bcrypt.hash(password, saltRounds)
      const updatedData = await admin_users.findByIdAndUpdate({ _id: user_id }, { $set: { password: newPass, token: '' } }, { new: true })
      req.session.message = {
        type: 'success',
        message: 'User password has been changed'
      }
  
      res.redirect('/settings')
    } catch (error) {
      console.log(error);
    }
  },

  addOrderAddress:async(req,res)=>{

    let id  = req.session.user._id
    let newaddresss={
      'name':req.body.name, 
      'house':req.body.house,
      'post':req.body.post,
      'city':req.body.city,
      'district':req.body.district,
      'state':req.body.state,
      'pin':req.body.pin
  }
  
  await admin_users.updateOne({_id:id},{$push:{address:newaddresss}})
  res.redirect('/checkout')
  
  },


  checkoutPage:async(req, res) => {
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id}) 
    let cartInfo = await cart.findOne({user:id}).populate('products.item')
    res.render('user/checkout', { title: 'Check out',userInfo,cartInfo })
  },

  applyCoupon:async(req, res)=> {
    try{

  
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id}) 
    let cartInfo = await cart.findOne({user:id})
    var couponCode = req.body.code;
  
    // Check if the coupon code is valid
   let couponDet = await coupon.findOne({ code: couponCode,used_user:{$nin:[id]}})
         
            if (couponDet) {
              let date=new Date(couponDet.expire)
              const currentDate = new Date();
              if(date.getTime() < currentDate.getTime()){
                res.json({ expired: true });
              }else{
  
              if(cartInfo.totalprice>couponDet.min_bill){
  
                let discount = Math.round(cartInfo.totalprice*(couponDet.discount/100))
  
                if(discount>couponDet.cap){
                  let maxDiscount = Math.round(couponDet.cap)
                  console.log(maxDiscount,"maxdis");
                  let total = cartInfo.totalprice - maxDiscount
                  console.log(total,"totalmax");
                  req.session.coupon = couponCode
        
                  res.json({ success: true, newTotal: total, discount:maxDiscount });
                } else{
                  let total = cartInfo.totalprice - discount
                  console.log(total,"max");
                  console.log(discount,"dis");
                  req.session.coupon = couponCode
                  res.json({ success: true, newTotal: total, discount:discount});
                }
                  await couponDet.updateOne(
                  {
                    $addToSet: {
                      used_user: id,
                    },
                  }
                );
      
              }else{
                req.session.coupon = null
                res.json({ notapplicable: true });
                console.log("notapp");
              }
            }
            } else {
              req.session.coupon = null
                res.json({ success: false });
                console.log("invalid");
            }
        
          }
          catch(err) {
            req.session.coupon = null
            res.json({ success: false });
            console.log(err);
        };
  },

  removeCoupon:async(req,res)=>{
 
    try{

      let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id}) 
    let cartInfo = await cart.findOne({user:id})
    var couponCode = req.body.code;
  
    // Check if the coupon code is valid
   let couponDet = await coupon.findOne({ code: couponCode})
         
            if (couponDet) {
              await couponDet.updateOne(
                { $pull: { used_user: id } }
              );

              let total = cartInfo.totalprice
              let maxDiscount = 0
              req.session.coupon = null
              res.json({ success: true, newTotal: total, discount:maxDiscount });
                
              }else{
                res.json({ success: false });
                console.log("error while removing coupon");
              }
            }
            catch(err){
              console.log(err);
            }
  },

  placeOrder:async(req,res)=>{
    let order = req.body
    // console.log(order['order-address']);
    // console.log(order);
    if(req.session.coupon != null){
      couponData = req.session.coupon
      let userCoupon = await  coupon.findOne({code:couponData})
      couponss = {
        name: userCoupon.name ,
        code: userCoupon.code,
        discount: userCoupon.discount,
      }
      
       
    
    }else{
      
      couponss = {
        name:'nil' ,
        code:'nil',
        discount:0,
      }
      
    }
    

    //errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr



    console.log(order);
    couponData = req.session.coupon
      let userCoupon = await  coupon.findOne({code:couponData})
    
    let cartData = await cart.findOne({user:order.userId})
 
    let discount = Math.round(cartData.totalprice*(userCoupon.discount/100))

    if(discount>userCoupon.cap){
      let maxDiscount = Math.round(userCoupon.cap)
      let total = cartData.totalprice - maxDiscount
    } else{
      let total = cartData.totalprice - discount
      let maxDiscount = discount
    }
   
    let selectAddress = await admin_users.findOne({_id:order.userId},{'address':1,_id:0}).exec()
     let addr= selectAddress.address[order['order-address']]
    //  console.log(addr,"addddddd");
    let prods = cartData.products
    console.log(prods,"products");
    let totalPrice = cartData.totalprice
  // console.log(req.body,products,totalPrice,userId);

  
   
  
  let status = order['payment-method']==='COD'?'placed':'pending'
  
  orderData = orders({
    userId:ObjectId(order.userId),
    address:addr,
    payment:{
      pay_method:order['payment-method']
    },
    coupon: couponss  ,
    total: totalPrice,
    discount_amount:maxDiscount,
    grand_total:total,
    products: prods,
    order_status:status
  })
  
  let userOrder = await orderData.save().then(req.session.coupon = null )
  
  res.json({status:true})
  
  let deleteCart = await cart.deleteOne({user:order.userId})
  
  },

  orderSuccessPage:(req,res)=>{
    res.render('user/order-success',{title:'Order Success'})
  },

  orderPage:async(req,res)=>{
    let id  = req.session.user._id
    let userInfo = await admin_users.findById({_id:id})
    let orderInfo = await orders.find({userId:id})
    res.render('user/orders',{title:'Orders',userInfo,orderInfo})
  },

  orderProductsPage:async(req,res)=>{
    let usersId  = req.session.user._id
    let ordId = req.params.id
    let userInfo = await admin_users.findById({_id:usersId})
    let orderInfo = await orders.find({userId:usersId,_id:ordId}).populate('products.item')
    res.render('user/ordered_items',{title:'Orders',userInfo,orderInfo})
  },

  userCancelOrder:async(req, res) => {
    try {
    orderId = req.params.id
     orders.updateOne({_id:orderId},{$set:{order_status:'cancelled'}}).then(() => {
      res.redirect('/orders')
    })
  }catch(err){
    console.log(err);
  }
     
  },




  userLogout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      } else {
        // history.replaceState(null, null, '/');
        res.redirect('/user-signin')
      }
    });
  }
}