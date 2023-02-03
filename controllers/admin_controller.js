const admin_products = require('../models/admin_products')
const admin_users = require('../models/admin_users')
const Category = require('../models/admin_category')
const admin_details = require('../models/admin_details')
const fs = require('fs')
const sharp = require('sharp');
const multer = require('multer')
const bcrypt = require('bcrypt')
const banner = require('../models/admin_banner')
const coupon = require('../models/admin_coupons')
const orders = require('../models/admin_orders')
const { ObjectId } = require('mongodb')
const createError = require("http-errors");
const Chart = require('chart.js');

module.exports = {

  adminLoginPage: (req, res, next) => {
    try {
      if (!req.session.adminLoggedIn) {
        res.render('admin/login', { title: 'Admin Login' })
      }
      else {
        res.redirect('admin/admin-panel')
      }
    } catch (error) {
      next(createError(404));
    }
  },

  adminLogin: (req, res, next) => {
    try {
      let { email, password } = req.body
      admin_details.find({ email }).then((data) => {
        if (data.length) {
          const hashedPassword = data[0].password
          bcrypt.compare(password, hashedPassword).then((result) => {
            if (result) {
              req.session.adminLoggedIn = true
              req.session.message = {
                type: 'success',
                message: 'Login Successful'
              }
              res.redirect('admin-panel')
            } else {
              req.session.adminLoggedIn = false
              req.session.message = {
                type: 'danger',
                message: 'Invalid password'
              }
              res.redirect('/admin')
            }
          })
        } else {
          req.session.message = {
            type: 'danger',
            message: 'Invalid credentials'
          }
          res.redirect('/admin')
        }
      })
    } catch (error) {
      next(createError(404));
    }

  },

  admin_panel: async (req, res, next) => {
    try {
      const salesData = await orders.find({ order_status: "placed" })
      const products = await admin_products.find({})
      const categories = await Category.find({})
      const users = await admin_users.find({})
      const order = await orders.find({ order_status: "placed" }).populate('userId').sort({ ordered_date: -1 }).limit(5)
      const codNum = (await orders.find({ order_status: "placed", 'payment.pay_method': "COD" })).length
      const onlineNum = (await orders.find({ order_status: "placed", 'payment.pay_method': "ONLINE" })).length

      let cancelledOrders = (await orders.find({ order_status: "cancelled" })).length
      let pendingOrders = (await orders.find({ order_status: "pending" })).length
      let paymentPending = (await orders.find({ order_status: { "$ne": "cancelled" }, 'payment.pay_status': "pending" })).length
      let paid = (await orders.find({ 'payment.pay_status': "success" })).length

      let salesChartDt = await orders.aggregate([
        {
          $match: { order_status: 'placed' }
        },
        {
          $group: {
            _id: { day: { $dayOfWeek: "$ordered_date" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
      let SalesCount = []
      for(let i =1 ; i< 8 ;i++){
        let found = false
        for(let j=0;j< salesChartDt.length;j++){
          if(salesChartDt[j]._id.day == i){
            SalesCount.push({_id:{day:i},count:salesChartDt[j].count})
            found = true
            break;
          }
        }
        if(!found){
          SalesCount.push({_id:{day:i},count:0})
        }
      }
      res.render('admin/dashboard', { title: 'Admin Panel', page: 'Dashboard', salesData, products, categories, users, order, codNum, onlineNum, cancelledOrders, pendingOrders, paymentPending, paid,  SalesCount })
    } catch (error) {
      next(createError(404));
    }
  },

  blockUser: async (req, res, next) => {
    try {
      let id = req.params.id
      await admin_users.updateOne({ _id: id }, {
        $set: {
          status: "blocked"
        }
      }).then(() => {
        res.redirect('/admin/admin-user')
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }
  },

  unblockUser: (req, res, next) => {
    try {
      let id = req.params.id
      admin_users.updateOne({ _id: id }, {
        $set: {
          status: "unblocked"
        }
      }).then(() => {
        res.redirect('/admin/admin-user')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  categoryPage: (req, res, next) => {
    try {
      Category.find().exec((error, categories) => {
          res.render('admin/categorymgt', {
            title: 'Category',
            page: 'Category',
            categories: categories,
          })
      })
    } catch (error) {
      next(createError(404));
    }
  },

  addCategoryPage: (req, res) => {
    try {
      res.render('admin/add-category', { title: 'Add category', page: 'Add category' })
    } catch (error) {
      next(createError(404));
    }
  },

  addCategory: async (req, res, next) => {
    try {
      const category = new Category({
        name: req.body.name,
        image: req.file.filename,
        description: req.body.description
      })
      category.save((err, category) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Category with same name is already present'
          }
          res.redirect('/admin/admin-category')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Category added successfully'
          }
          res.redirect('/admin/admin-category')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  editCategoryPage: (req, res, next) => {
    try {
      let id = req.params.id
    Category.findById(id, (err, categories) => {
      if (err) {
        res.redirect('admin/admin-category')
      } else {
        if (categories == null) {
          res.redirect('admin/admin-category')
        } else {
          res.render('admin/edit-category', { title: 'Edit Category', page: 'Edit Category', categories: categories, })
        }
      }
    })
    } catch (error) {
      next(createError(404));
    }
  },

  editCategory: (req, res, next) => {
    try {
      let id = req.params.id
      let new_img = ''
      if (req.file) {
        new_img = req.file.filename
          fs.unlinkSync('./public/uploads/' + req.body.old_img)
      } else {
        new_img = req.body.old_img
      }
      Category.findByIdAndUpdate(id, {
        name: req.body.name,
        image: new_img,
        description: req.body.description
      }, (err, result) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Category with same name is already present'
          }
          res.redirect('/admin/admin-category')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Category updated successfully'
          }
          res.redirect('/admin/admin-category')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  unlistCategory: (req, res, next) => {
    try {
      let id = req.params.id
      Category.updateOne({ _id: id }, {
        $set: {
          deleted: true
        }
      }).then(() => {
        res.redirect('/admin/admin-category')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  listCategory: async (req, res, next) => {
    try {
      let id = req.params.id
      Category.updateOne({ _id: id }, {
        $set: {
          deleted: false
        }
      }).then(() => {
        res.redirect('/admin/admin-category')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  allProducts: (req, res, next) => {
    try {
      admin_products.find().populate("category").exec((err, product) => {
        res.render('admin/productmgt', { title: 'Admin Panel', page: 'Products', product: product, })
       })
    } catch (error) {
      next(createError(404));
    }
  },

  addProductsPage: async (req, res, next) => {
    try {
      const categories = await Category.find()
      res.render('admin/add-product', { title: 'Add Product', page: 'Add Product', categories })
    } catch (error) {
      next(createError(404));
    }
  },

   addProducts: (req, res, next) => {
    try {
      let images = []
      let promises = [];
      req.files.forEach((file) => {
        promises.push(new Promise((resolve, reject) => {
          const filename = file.originalname.replace(/\..+$/, '')
          const newFilename = `bmart-${filename}-${Date.now()}.jpeg`
          sharp(file.path)
            .resize({ width: 800, height: 800 })
            .toFormat('jpeg', { quality: 100 })
            .toFile(`public/uploads/${newFilename}`)
          images.push(newFilename)
          resolve();
        }));
      })
      Promise.all(promises)
        .then(() => {
          if (req.body.stock_count == 0) {
            prod_status = 'Out Of Stock'
          } else {
            prod_status = 'In Stock'
          }
          const product = new admin_products({
            name: req.body.name,
            category: ObjectId(req.body.category),
            description: req.body.description,
            selling_price: req.body.selling_price,
            listing_price: req.body.listing_price,
            stock_count: req.body.stock_count,
            status: prod_status,
            images: images,
          })
          product.save((err) => {
            if (err) {
              req.session.message = {
                type: 'danger',
                message: 'Error occured while adding product'
              }
              res.redirect('/admin/admin-product')
            } else {
              req.session.message = {
                type: 'success',
                message: 'Product added successfully'
              }
              res.redirect('/admin/admin-product')
            }
          })
        })
    } catch (error) {
      next(createError(404));
    }
  },

  editProductsPage: async (req, res, next) => {
    try {
      let id = req.params.id
    const categories = await Category.find()
    admin_products.findById(id, (err, product) => {
      if (err) {
        res.redirect('admin/admin-product')
      } else {
        if (product == null) {
          res.redirect('admin/admin-product')
        } else {
          res.render('admin/edit-product', { title: 'Edit product', page: 'Edit product', product: product, categories })
        }
      }
    }).populate("category")
    } catch (error) {
      next(createError(404));
    }
  },

  editProducts: (req, res) => {
    try {
      let id = req.params.id
      if (req.body.stock_count == 0) {
        prod_status = 'Out Of Stock'
      } else {
        prod_status = 'In Stock'
      }

      let dataToUpload = {
        name: req.body.name,
        category: ObjectId(req.body.category),
        description: req.body.description,
        selling_price: req.body.selling_price,
        listing_price: req.body.listing_price,
        stock_count: req.body.stock_count,
        status: prod_status
      }

      if (req.files.length > 0) {
        let new_images = []
        let promises = [];
        req.files.forEach((file) => {
          promises.push(new Promise((resolve, reject) => {
            const filename = file.originalname.replace(/\..+$/, '')
            const newFilename = `bmart-${filename}-${Date.now()}.jpeg`
            sharp(file.path)
              .resize({ width: 800, height: 800 })
              .jpeg({
                quality: 100,
                chromaSubsampling: '4:4:4'
              })
              .toFile(`public/uploads/${newFilename}`)
            new_images.push(newFilename)
            resolve();
          }));
        })
        dataToUpload.images = new_images
      }

      admin_products.findByIdAndUpdate({ _id: id }, dataToUpload, (err, result) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Error while updating'+err.message
          }
          res.redirect('/admin/edit-product/' + id)
        } else {
          req.session.message = {
            type: 'success',
            message: 'Product updated successfully'
          }
          res.redirect('/admin/admin-product')
        }
      }).populate("category")
    } catch (error) {
      next(createError(404));
    }
  },

  unlistProduct: (req, res, next) => {
    try {
      let id = req.params.id
      admin_products.updateOne({ _id: id }, {
        $set: {
          deleted: true
        }
      }).then(() => {
        res.redirect('/admin/admin-product')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  listProduct: async (req, res, next) => {
    try {
      let id = req.params.id
      admin_products.updateOne({ _id: id }, {
        $set: {
          deleted: false
        }
      }).then(() => {
        res.redirect('/admin/admin-product')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  allUsers: (req, res, next) => {
    try {
      admin_users.find().exec((error, users) => {
          res.render('admin/usermgt', {
            title: 'Admin Panel',
            page: 'Users',
            users: users,
          })
      })
    } catch (error) {
      next(createError(404));
    }
  },

  bannerPage: async (req, res, next) => {
    try {
      const banners = await banner.find()
      res.render('admin/bannermgt', { title: 'Banner', page: 'Banner', banners })
    } catch (error) {
      next(createError(404));
    }
  },

  addBannerPage: (req, res) => {
    try {
      res.render('admin/add-banner', { title: 'Add banner', page: 'Add banner' })
    } catch (error) {
      next(createError(404));
    }
  },

  addBanner: (req, res) => {
    try {
      const bannerr = new banner({
        name: req.body.name,
        image: req.file.filename,
        description: req.body.description
      })

      bannerr.save((error, bannerr) => {
        if (error) {
          req.session.message = {
            type: 'danger',
            message: 'Error while adding banner'+error.message
          }
          res.redirect('/admin/admin-banner')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner added successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  editBannerPage: (req, res, next) => {
    try {
      let id = req.params.id
      banner.findById(id, (err, banners) => {
        if (err) {
          res.redirect('admin/admin-banner')
        } else {
          if (banners == null) {
            res.redirect('admin/admin-banner')
          } else {
            res.render('admin/edit-banner', { title: 'Edit Banner', page: 'Edit Banner', banners: banners, })
          }
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  editBanner: (req, res, next) => {
    try {
      let id = req.params.id
      let new_img = ''
      if (req.file) {
        new_img = req.file.filename
          fs.unlinkSync('./public/uploads/' + req.body.old_img)
      } else {
        new_img = req.body.old_img
      }
      banner.findByIdAndUpdate(id, {
        name: req.body.name,
        image: new_img,
        description: req.body.description
      }, (error, result) => {
        if (error) {
          req.session.message = {
            type: 'danger',
            message: 'Error while updating banner,'+error.message
          }
          res.redirect('/admin/admin-banner')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner updated successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  disableBanner: (req, res, next) => {
    try {
      let id = req.params.id
      banner.updateOne({ _id: id }, {
        $set: {
          deleted: true
        }
      }).then(() => {
        res.redirect('/admin/admin-banner')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  enableBanner: async (req, res, next) => {
    try {
      let id = req.params.id
      banner.updateOne({ _id: id }, {
        $set: {
          deleted: false
        }
      }).then(() => {
        res.redirect('/admin/admin-banner')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  deleteBanner: (req, res, next) => {
    try {
      let id = req.params.id
      banner.findByIdAndRemove(id, (err, result) => {
        if (result.image != '') {
            fs.unlinkSync('./public/uploads/' + result.image)
        }
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Error while deleting,'+ err.message
          }
          res.redirect('/admin/admin-banner')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner deleted successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  couponPage: async (req, res, next) => {
    try {
      const coupons = await coupon.find()
    res.render('admin/couponmgt', { title: 'Coupons', page: 'Coupons', coupons })
    } catch (error) {
      next(createError(404));
    }
  },

  addCouponPage: (req, res, next) => {
    try {
      res.render('admin/add-coupon', { title: 'Add coupon', page: 'Add coupon' })
    } catch (error) {
      next(createError(404));
    }
  },

  addCoupon: (req, res, next) => {
    try {
      const coupons = new coupon({
        name: req.body.name,
        code: req.body.code,
        min_bill: req.body.bill,
        cap: req.body.cap,
        discount: req.body.discount,
        expire: req.body.date
      })
      const currentDate = new Date();

      if (coupons.expire < currentDate) {
        coupons.status == 'expired';
      }

      coupons.save((err, coupon) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Already there is coupon with same name or code'
          }
          res.redirect('/admin/add-coupon')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Coupon added successfully'
          }
          res.redirect('/admin/admin-coupon')
        }
      })
    } catch (error) {
      next(createError(404));
    }

  },

  editCouponPage: (req, res, next) => {
    try {
      let id = req.params.id
      coupon.findById(id, (err, coupons) => {
        if (err) {
          res.redirect('admin/admin-coupon')
        } else {
          if (coupons == null) {
            res.redirect('admin/admin-coupon')
          } else {
            res.render('admin/edit-coupon', { title: 'Edit Coupon', page: 'Edit Coupon', coupons: coupons, })
          }
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  editCoupon: (req, res, next) => {
    try {
      let id = req.params.id
      const currentDate = new Date();

      coupon.findByIdAndUpdate(id, {
        name: req.body.name,
        code: req.body.code,
        min_bill: req.body.bill,
        cap: req.body.cap,
        discount: req.body.discount,
        expire: req.body.date,
      }, (err, result) => {
        if (err) {
          console.log(err);
          req.session.message = {
            type: 'danger',
            message: 'Already there is coupon with same name or code'
          }
          res.redirect('/admin/admin-coupon')
        } else {
          let date = new Date(req.body.date)
          if (date.getTime() < currentDate.getTime()) {
            this.status = 'expired';
          }
          req.session.message = {
            type: 'success',
            message: 'Coupon updated successfully'
          }
          res.redirect('/admin/admin-coupon')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  deleteCoupon: (req, res, next) => {
    try {
      let id = req.params.id
      coupon.findByIdAndRemove(id, (err, result) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Error while deleting coupon, '+err.message
          }
          res.redirect('/admin/admin-coupon')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Coupon deleted successfully'
          }
          res.redirect('/admin/admin-coupon')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  vieworder: async (req, res, next) => {
    try {
      const order = await orders.find().populate('userId').sort({ ordered_date: -1 })
      res.render('admin/ordermgt', { title: 'Orders', page: 'Orders', order })
    } catch (error) {
      next(createError(404));
    }
  },

  order_details: async (req, res, next) => {
    try {
      orderId = req.params.id
      let orderInfo = await orders.findOne({ _id: orderId }).populate(['products.item', 'userId'])
      res.render('admin/view-order', { title: 'Orders', page: 'View order', orderInfo })
    } catch (error) {
      next(createError(404));
    }
  },

  cancel_order: async (req, res, next) => {
    try {
      orderId = req.params.id
      orders.updateOne({ _id: orderId }, { $set: { order_status: 'cancelled', 'delivery_status.cancelled.state': true, 'delivery_status.cancelled.date': Date.now() } }).then(() => {
        res.redirect('/admin/admin-order')
      })
    } catch (error) {
      next(createError(404));
    }
  },

  deliveryStatus: async (req, res, next) => {
    try {
      orderId = req.params.id

      if (req.body.deliveryStatus == 'shipped') {
        orders.updateOne({ _id: orderId }, { $set: { 'delivery_status.shipped.state': true, 'delivery_status.shipped.date': Date.now() } }).then((data) => {
          res.redirect('/admin/order-details/' + orderId)
        })
      } else if (req.body.deliveryStatus == 'outForDelivery') {
        orders.updateOne({ _id: orderId }, { $set: { 'delivery_status.out_for_delivery.state': true, 'delivery_status.out_for_delivery.date': Date.now() } }).then((data) => {
          res.redirect('/admin/order-details/' + orderId)
        })
      } else if (req.body.deliveryStatus == 'delivered') {
        orders.updateOne({ _id: orderId }, { $set: { 'delivery_status.delivered.state': true, 'delivery_status.delivered.date': Date.now() } }).then((data) => {
          res.redirect('/admin/order-details/' + orderId)
        })
      }
    } catch (error) {
      next(createError(404));
    }
  },

  invoice: async (req, res, next) => {
    try {
      let orderId = req.params.id
    let orderInfo = await orders.findOne({ _id: orderId }).populate(['products.item', 'userId'])
    res.render('admin/invoice', { title: 'invoice', page: 'invoice', orderInfo })
    } catch (error) {
      next(createError(404));
    }
  },

  report: async (req, res, next) => {
    try {
      res.render('admin/report', { title: 'Report', page: 'Report' })
    } catch (error) {
      next(createError(404));
    }
  },
  salesReport: async (req, res, next) => {
    try {
      let salesData = await orders.aggregate([
        {
          $match: {
            order_status: "placed",
            $and: [
              { ordered_date: { $gt: new Date(req.body.fromDate) } },
              { ordered_date: { $lt: new Date(req.body.toDate) } },
            ],
          },
        },
        {
          $lookup: {
            from: "admin_users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $sort: { ordered_date: -1 } },
      ]);
      res.render('admin/salesReport', { title: 'Sales Report', page: 'Sales Report', salesData })
    } catch (error) {
      next(createError(404));
    }
  },

  adminLogout: (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        } else {
          res.redirect('/admin')
        }
      });
    } catch (error) {
      next(createError(404));
    }
  }
}