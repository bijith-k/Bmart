const express = require('express')
const router = express.Router()
const admin_users = require('../models/admin_users')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const admin_products = require('../models/admin_products')
const controller = require('../controllers/admin_controller')
const admin_details = require('../models/admin_details')
const bcrypt = require('bcrypt')
const Category = require('../models/admin_category')
const banner = require('../models/admin_banner')
const sharp = require('sharp')
const coupon = require('../models/admin_coupons')
//  const imageUpload = require('../controllers/imageUpload')

//image upload
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
//   },
// })

// var upload = multer({
//   storage: storage,
// })

const FILE_TYPE_MAP = {
    'image/png':'png',
    'image/jpeg':'jpeg',
    'image/jpg':'jpg'
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype]
    let uploadError = new Error('invalid image type')
    if(isValid){
      uploadError = null
    }
    cb(uploadError, './public/uploads')
  },
  filename:async function (req, file, cb) {
    // console.log(file);
    const filename = file.originalname.split(' ').join('-')
    const extension =await FILE_TYPE_MAP[file.mimetype]
    cb(null, `${filename}-${Date.now()}.${extension}`)
    // console.log(`${filename}-${Date.now()}.${extension}`);
  }
})
 
const uploadOptions = multer({ storage: storage })




const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin')
  }
}


router.get('/',controller.adminLoginPage)
router.get('/admin-panel',verifyAdmin, controller.admin_panel )
router.get('/admin-product',verifyAdmin,controller.allProducts)
router.get('/admin-user',verifyAdmin, controller.allUsers)
router.get('/admin-category',verifyAdmin,controller.categoryPage)
router.get('/admin-order',verifyAdmin,controller.vieworder)
router.get('/admin-coupon',verifyAdmin,controller.couponPage)
router.get('/admin-banner',verifyAdmin,controller.bannerPage)
router.get('/add-product',verifyAdmin, controller.addProductsPage)
router.get('/add-category',verifyAdmin,controller.addCategoryPage)
router.get('/add-banner',verifyAdmin,controller.addBannerPage)
router.get('/add-coupon',controller.addCouponPage)
router.get('/edit-product/:id',verifyAdmin, controller.editProductsPage )
router.get('/edit-category/:id',controller.editCategoryPage)
router.get('/edit-banner/:id',controller.editBannerPage)
router.get('/edit-coupon/:id',controller.editCouponPage)
router.get('/unlist-product/:id',controller.unlistProduct)
router.get('/list-product/:id',controller.listProduct)
router.get('/unlist-category/:id',controller.unlistCategory)
router.get('/list-category/:id',controller.listCategory)
router.get('/unlist-banner/:id',controller.disableBanner)
router.get('/list-banner/:id',controller.enableBanner)
router.get('/block-user/:id',verifyAdmin,controller.blockUser)
router.get('/unblock-user/:id',verifyAdmin,controller.unblockUser)
router.get('/delete-banner/:id',controller.deleteBanner)
router.get('/delete-coupon/:id',controller.deleteCoupon)
router.get('/order-details/:id',controller.order_details)
router.get('/cancel-order/:id',controller.cancel_order)
router.get('/admin-logout',controller.adminLogout)
router.get('/invoice/:id',controller.invoice)


router.post('/admin-login', controller.adminLogin)
router.post('/add-product',verifyAdmin,uploadOptions.array("images",4),controller.addProducts)
router.post('/add-category',uploadOptions.single('image'),controller.addCategory)
router.post('/add-banner',uploadOptions.single('image'),controller.addBanner)
router.post('/add-coupon',controller.addCoupon)
router.post('/edit-product/:id',verifyAdmin, uploadOptions.array("images",4), controller.editProducts)
router.post('/edit-category/:id',uploadOptions.single('image'),controller.editCategory)
router.post('/edit-banner/:id',uploadOptions.single('image'),controller.editBanner)
router.post('/edit-coupon/:id',controller.editCoupon)

router.post('/delivery-status/:id',controller.deliveryStatus)






router.get('/delete-product/:id',verifyAdmin, controller.deleteProducts)
router.get('/delete-user/:id',verifyAdmin, controller.deleteUsers )
router.get('/delete-category/:id',controller.deleteCategory)
 



// router.post('/add-product',verifyAdmin,controller.uploadImages,controller.resizeImages,controller.getResultImages)
// router.get('/add_user',verifyAdmin, controller.addUsersPage)
// router.post('/add_user',verifyAdmin, controller.addUsers)
// router.get('/edit_user/:id',verifyAdmin, controller.editUsersPage)
// router.post('/edit_user/:id',verifyAdmin, controller.editUsers)

// router.post('/getProducts',(req,res)=>{
//   let payload = req.body.payload.trim()
//   console.log(payload);
// })

module.exports = router;