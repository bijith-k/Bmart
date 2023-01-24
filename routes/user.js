const express = require('express')
const router = express.Router()
const productController = require('../controllers/product_controller')
const cartController = require('../controllers/cart_controller')
const wishlistController = require('../controllers/wishlist_controller')
const admin_users = require('../models/admin_users')
const { route } = require('./admin')
const admin_products = require('../models/admin_products')
const randomstring = require('randomstring')
const userController = require('../controllers/user_controller')
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')
const Category = require('../models/admin_category')
const cart = require('../models/cart')
const wishlist = require('../models/wishlist')
const coupon = require('../models/admin_coupons')
const orders = require('../models/admin_orders')
const { ObjectId, LoggerLevel } = require('mongodb')



const verifyUser = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/user-signin')
  }
}


router.get('/', userController.homePage)
router.get('/user-registration', userController.registrationPage)
router.get('/user-signin', userController.signinPage)
router.get('/resendotp', userController.resendOTP)
router.get('/forgot-password', userController.forgotPasswordPage)
router.get('/reset-password', userController.resetPasswordPage)
router.get('/categories', userController.productListing)
router.get('/product/:id', userController.singleProduct)
router.get('/cart', verifyUser,cartController.cartPage)
router.get('/add-to-cart/:id', verifyUser, cartController.add_to_cart)
router.get('/wishlist', verifyUser, wishlistController.wishlistPage )
router.get('/add-to-wishlist/:id', verifyUser, wishlistController.add_to_wishlist)
router.get('/account',verifyUser,userController.accountPage)
router.get('/address',verifyUser,userController.addressPage)
router.get('/edit-address/:id',userController.editAddressPage)
router.get('/delete-address/:id',userController.deleteAddress)
router.get('/settings',verifyUser,userController.settingsPage)
router.get('/checkout',verifyUser, userController.checkoutPage)
router.get('/order-success',verifyUser,userController.orderSuccessPage)
router.get('/orders',verifyUser,userController.orderPage)
router.get('/ordered-items/:id',verifyUser,userController.orderProductsPage)
router.get('/cancel-order/:id',userController.userCancelOrder)
router.get('/user-logout', userController.userLogout)



router.post('/otp',userController.getOTP)
router.post('/verify-otp', userController.verifyOTP)
router.post('/user-signin', userController.signin)
router.post('/forgot-password', userController.forgotPassword)
router.post('/reset-password', userController.resetPassword)
router.post('/change-product-quantity', cartController.changeQuantity)
router.post('/remove-product/:id',cartController.removeProduct)
router.post('/remove-wishlist-product/:id', wishlistController.removeWishlist)
router.post('/add-address',verifyUser,userController.addAddress)
router.post('/update-address/:id',userController.updateAddress)
router.post('/edit-info',userController.editInfo)
router.post('/change-password',userController.changePassword)
router.post('/add-order-address',verifyUser,userController.addOrderAddress)
router.post("/apply-coupon",verifyUser, userController.applyCoupon);
router.post("/remove-coupon",verifyUser, userController.removeCoupon)
router.post('/place-order',verifyUser,userController.placeOrder)










 










// router.get('/products', (req, res) => {
//   res.render('user/listing', { title: 'Products' })
// })

// router.get('/categories',async(req,res)=>{
//   const page=req.query.page
//   const products=await admin_products.find()
//   .skip((page-1)*ITEMS_PAGE)
//   .limit(ITEMS_PAGE)
//   const categories = await Category.find()
//   res.render('user/listing',{products,page,categories, title: 'categories' })
// })




// router.post('/getProducts', (req, res) => {
//   console.log("fa");
//   let payload = req.body.payload.trim()
//   console.log(payload);
// })




// router.get('/products', productController.getProductList)




// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { resetMail } = req.body
//     const data = await admin_users.find({ email: resetMail })
//     if (data.length) {
//       const randomstringg = randomstring.generate()
//       const userdata = await admin_users.updateOne({ email: resetMail }, { $set: { token: randomstringg } })
//       sendResetPasswordMail(req.body.resetMail, randomstringg)
//       req.session.message = {
//         type: 'primary',
//         message: 'Please check your inbox of mail and reset your password'
//       }
//       res.redirect('/forgot-password')
//     } else {
//       req.session.message = {
//         type: 'danger',
//         message: 'No account with the entered email id'
//       }
//       res.redirect('/forgot-password')
//     }
//   } catch (err) {
//     console.log(err);
//   }
// })

// router.get('/reset-password?/token=:token', async (req, res) => {

//   try {
//     const token = req.query.token
//     const tokenData = await admin_users.findOne({ token: token })
//     if (tokenData) {
//       res.render('user/new-password', { title: 'reset password' })
//     } else {
//       req.session.message = {
//         type: 'danger',
//         message: 'Link has been expired'
//       }
//       res.redirect('/forgot-password')
//     }
//   } catch (error) {
//     console.log(error);
//   }
// })
// router.post('/reset-password',async(req,res)=>{
//   try{
//     const password = req.body.password
//       const saltRounds = 10
//       const newPass = await bcrypt.hash(password, saltRounds)
//       const userData = await admin_users.findByIdAndUpdate({ _id: tokenData._id }, { $set: { password: newPass, token: '' } }, { new: true })
//       req.session.message = {
//         type: 'success',
//         message: 'User password has been reset'
//       }
//       console.log('reset');
//       res.redirect('/user-signin')
//   } catch (error) {
//     console.log(error);
//   }
// })



module.exports = router;