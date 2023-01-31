const express = require('express')
const router = express.Router()
const multer = require('multer')
const admin_users = require('../models/admin_users')
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



const {addBanner,addBannerPage,addCategory,
  addCategoryPage,addCoupon,addCouponPage,
  addProducts,addProductsPage,addUsers,addUsersPage,
  adminLogin,adminLoginPage,adminLogout,admin_panel,
  allProducts,allUsers,bannerPage,blockUser,cancel_order,categoryPage,
  couponPage,deleteBanner,deleteCategory,deleteCoupon,deleteProducts,deleteUsers,
  deliveryStatus,disableBanner,editBanner,editBannerPage,editCategory,
  editCategoryPage,editCoupon,editCouponPage,editProducts,
  editProductsPage,editUsers,editUsersPage,enableBanner,getResultImages,
  invoice,listCategory,listProduct,order_details,resizeImages,status,unblockUser,
  unlistCategory,unlistProduct,uploadImages,vieworder,report,salesReport
} = require('../controllers/admin_controller')



 

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


router.get('/',adminLoginPage)
router.get('/admin-panel',verifyAdmin, admin_panel )
router.get('/admin-product',verifyAdmin,allProducts)
router.get('/admin-user',verifyAdmin, allUsers)
router.get('/admin-category',verifyAdmin,categoryPage)
router.get('/admin-order',verifyAdmin,vieworder)
router.get('/admin-coupon',verifyAdmin,couponPage)
router.get('/admin-banner',verifyAdmin,bannerPage)
router.get('/add-product',verifyAdmin, addProductsPage)
router.get('/add-category',verifyAdmin,addCategoryPage)
router.get('/add-banner',verifyAdmin,addBannerPage)
router.get('/add-coupon',addCouponPage)
router.get('/edit-product/:id',verifyAdmin, editProductsPage )
router.get('/edit-category/:id',verifyAdmin,editCategoryPage)
router.get('/edit-banner/:id',verifyAdmin,editBannerPage)
router.get('/edit-coupon/:id',verifyAdmin,editCouponPage)
router.get('/unlist-product/:id',verifyAdmin,unlistProduct)
router.get('/list-product/:id',verifyAdmin,listProduct)
router.get('/unlist-category/:id',verifyAdmin,unlistCategory)
router.get('/list-category/:id',verifyAdmin,listCategory)
router.get('/unlist-banner/:id',verifyAdmin,disableBanner)
router.get('/list-banner/:id',verifyAdmin,enableBanner)
router.get('/block-user/:id',verifyAdmin,blockUser)
router.get('/unblock-user/:id',verifyAdmin,unblockUser)
router.get('/delete-banner/:id',verifyAdmin,deleteBanner)
router.get('/delete-coupon/:id',verifyAdmin,deleteCoupon)
router.get('/order-details/:id',verifyAdmin,order_details)
router.get('/cancel-order/:id',verifyAdmin,cancel_order)
router.get('/invoice/:id',verifyAdmin,invoice)
router.get('/report',verifyAdmin,report)
router.get('/admin-logout',adminLogout)




router.post('/admin-login', adminLogin)
router.post('/add-product',verifyAdmin,uploadOptions.array("images",4),addProducts)
router.post('/add-category',uploadOptions.single('image'),addCategory)
router.post('/add-banner',uploadOptions.single('image'),addBanner)
router.post('/add-coupon',addCoupon)
router.post('/edit-product/:id',verifyAdmin, uploadOptions.array("images",4), editProducts)
router.post('/edit-category/:id',uploadOptions.single('image'),editCategory)
router.post('/edit-banner/:id',uploadOptions.single('image'),editBanner)
router.post('/edit-coupon/:id',editCoupon)

router.post('/delivery-status/:id',deliveryStatus)
router.post('/report/sales',salesReport)





router.get('/delete-product/:id',verifyAdmin, deleteProducts)
router.get('/delete-user/:id',verifyAdmin, deleteUsers )
router.get('/delete-category/:id',deleteCategory)
 



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