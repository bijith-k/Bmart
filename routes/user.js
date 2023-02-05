const express = require('express')
const router = express.Router()
const admin_users = require('../models/admin_users')
const { homePage, registrationPage, resendOTP, getOTP,
  verifyOTP, signinPage, signin, forgotPasswordPage,
  forgotPassword, resetPasswordPage, resetPassword,
  productListing, singleProduct, accountPage, addressPage,
  addAddress, editAddressPage, updateAddress, deleteAddress,
  editInfo, settingsPage, changePassword, addOrderAddress,
  checkoutPage, applyCoupon, removeCoupon, placeOrder, verifyPayment,
  orderSuccessPage, orderPage, orderProductsPage, userCancelOrder,contactUs, userLogout } = require('../controllers/user_controller')
const { cartPage, add_to_cart, changeQuantity, removeProduct } = require('../controllers/cart_controller')
const { wishlistPage, add_to_wishlist, removeWishlist } = require('../controllers/wishlist_controller')



const verifyUser = async(req, res, next) => {
  if (req.session.userLoggedIn) {
    let udata = await admin_users.findOne({ _id: req.session.user._id })
    console.log(udata);
    if (udata.status != 'blocked') {
      next()
    } else {
      req.session.userLoggedIn = false
      req.session.message = {
        type: 'danger',
        message: 'You are blocked by the admin'
      }
      res.redirect('/user-signin')
    }
  } else {
    res.redirect('/user-signin')
  }
}

const loggedInSession = async(req,res,next)=>{
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    next()
  }
}


router.get('/', homePage)
router.get('/user-registration', registrationPage)
router.get('/user-signin', signinPage)
router.get('/resendotp',loggedInSession, resendOTP)
router.get('/forgot-password', forgotPasswordPage)
router.get('/reset-password', resetPasswordPage)
router.get('/categories', productListing)
router.get('/product/:id', singleProduct)
router.get('/cart', verifyUser, cartPage)
router.get('/add-to-cart/:id', verifyUser, add_to_cart)
router.get('/wishlist', verifyUser, wishlistPage)
router.get('/add-to-wishlist/:id', verifyUser, add_to_wishlist)
router.get('/account', verifyUser, accountPage)
router.get('/address', verifyUser, addressPage)
router.get('/edit-address/:id', verifyUser, editAddressPage)
router.get('/delete-address/:id', verifyUser, deleteAddress)
router.get('/settings', verifyUser, settingsPage)
router.get('/checkout', verifyUser, checkoutPage)
router.get('/order-success', verifyUser, orderSuccessPage)
router.get('/orders', verifyUser, orderPage)
router.get('/ordered-items/:id', verifyUser, orderProductsPage)
router.get('/cancel-order/:id', verifyUser, userCancelOrder)
router.get('/contact-us', contactUs)
router.get('/user-logout', userLogout)



router.post('/otp',loggedInSession, getOTP)
router.post('/verify-otp',loggedInSession, verifyOTP)
router.post('/user-signin', signin)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-product-quantity', changeQuantity)
router.post('/remove-product/:id', removeProduct)
router.post('/remove-wishlist-product/:id', removeWishlist)
router.post('/add-address', verifyUser, addAddress)
router.post('/update-address/:id', updateAddress)
router.post('/edit-info', editInfo)
router.post('/change-password', verifyUser, changePassword)
router.post('/add-order-address', verifyUser, addOrderAddress)
router.post("/apply-coupon", verifyUser, applyCoupon);
router.post("/remove-coupon", verifyUser, removeCoupon)
router.post('/place-order', verifyUser, placeOrder)
router.post('/verify-payment', verifyUser, verifyPayment)


module.exports = router;