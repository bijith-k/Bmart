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

const Chart = require('chart.js');
const { log } = require('console')
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb('Upload only images', false)
  }
}

const upload = multer({ storage: multerStorage, fileFilter: multerFilter })

//image uploading

const uploadFiles = upload.array('images', 4)

module.exports = {

  adminLoginPage: (req, res, next) => {
    if (!req.session.adminLoggedIn) {
      res.render('admin/login', { title: 'Admin Login' })
    }
    else {
      res.redirect('admin/admin-panel')
    }
  },

  adminLogin: (req, res, next) => {
    // console.log(req.body.email);
    // console.log(req.body.password);
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
      console.log(error);
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
      const codNum = (await orders.find({ order_status: { "$ne": "cancelled" }, 'payment.pay_method': "COD" })).length
      const onlineNum = (await orders.find({ order_status: { "$ne": "cancelled" }, 'payment.pay_method': "ONLINE" })).length

      let cancelledOrders = (await orders.find({ order_status: "cancelled" })).length
      let pendingOrders = (await orders.find({ order_status: "pending" })).length
      let paymentPending = (await orders.find({ order_status: { "$ne": "cancelled" }, 'payment.pay_status': "pending" })).length
      let paid = (await orders.find({ 'payment.pay_status': "success" })).length

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      let salesChartDt = await orders.aggregate([
        {
          $match: {
            ordered_date: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$ordered_date" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // console.log(salesChartDt);

      res.render('admin/dashboard', { title: 'Admin Panel', page: 'Dashboard', salesData, products, categories, users, order, codNum, onlineNum, cancelledOrders, pendingOrders, paymentPending, paid, salesChartDt })
    } catch (error) {
      console.log(error);
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
      console.log(error);
      next(createError(404));
    }
  },

  categoryPage: (req, res, next) => {
    Category.find().exec((err, categories) => {
      if (err) {
        res.json({ message: err.message })
      } else {
        res.render('admin/categorymgt', {
          title: 'Category',
          page: 'Category',
          categories: categories,
        })
      }
    })
  },

  addCategoryPage: (req, res) => {
    res.render('admin/add-category', { title: 'Add category', page: 'Add category' })
  },

  addCategory: async (req, res, next) => {
    //  console.log(req.body.name);

    try {
      const category = new Category({
        name: req.body.name,
        image: req.file.filename,
        description: req.body.description
      })

      category.save((err, category) => {
        if (err) {
          // res.json({ message: err.message, type: "danger" })
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
      console.log(error);
      next(createError(404));
    }

  },

  editCategoryPage: (req, res, next) => {
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
  },

  editCategory: (req, res, next) => {
    try {
      let id = req.params.id
      let new_img = ''
      if (req.file) {
        new_img = req.file.filename
        try {
          fs.unlinkSync('./public/uploads/' + req.body.old_img)
        } catch (err) {
          console.log(err);
        }
      } else {
        new_img = req.body.old_img
      }
      Category.findByIdAndUpdate(id, {
        name: req.body.name,
        image: new_img,
        description: req.body.description
      }, (err, result) => {
        if (err) {

          // res.json({ message: err.message, type: 'danger' })
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
      console.log(error);
      next(createError(404));
    }

  },

  deleteCategory: (req, res, next) => {
    let id = req.params.id
    Category.findByIdAndRemove(id, (err, result) => {
      if (err) {
        res.json({ message: err.message })
      } else {
        req.session.message = {
          type: 'success',
          message: 'Category deleted successfully'
        }
        res.redirect('/admin/admin-category')
      }
    })
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
    } catch (err) {
      console.log(err);
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
    } catch (err) {
      console.log(err);
      next(createError(404));
    }
  }
  ,
  allProducts: (req, res, next) => {
    admin_products.find().populate("category").exec((err, product) => {
      if (err) {
        res.json({ message: err.message })
      } else {

        res.render('admin/productmgt', { title: 'Admin Panel', page: 'Products', product: product, })
      }
    })
  },
  addProductsPage: async (req, res, next) => {
    const categories = await Category.find()

    res.render('admin/add-product', { title: 'Add Product', page: 'Add Product', categories })
  },
  // addProducts: (req, res) => {
  //   req.files.forEach(function (file) {
  //     sharp(file.path)
  //     .resize({ width: 300, height: 300 })
  //       .toFile(file.path + '-cropped.jpg')
  //       .then(function (data) {
  //         console.log('Image cropped');
  //         const product = new admin_products({
  //           name: req.body.name,
  //           category: req.body.category._id,
  //           description: req.body.description,
  //           selling_price: req.body.selling_price,
  //           listing_price: req.body.listing_price,
  //           stock_count: req.body.stock_count,
  //           images: data,
  //         })
  //         product.save((err) => {
  //           if (err) {
  //             res.json({ message: err.message, type: "danger" })
  //           } else {
  //             req.session.message = {
  //               type: 'success',
  //               message: 'Product added successfully'
  //             }
  //             res.redirect('/admin/admin-product')
  //           }
  //         })
  //       })
  //       .catch(function (err) {
  //         console.error(err);
  //       });
  //   });
  //   // const filenames = req.files.map(file => file.filename);

  // }
  // ,

  addProducts: (req, res, next) => {
    //const filenames = req.files.map(file => file.filename);
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
          console.log(newFilename);
          resolve();
        }));

      })
      console.log(images);
      Promise.all(promises)
        .then(() => {
          const product = new admin_products({
            name: req.body.name,
            category: ObjectId(req.body.category),
            description: req.body.description,
            selling_price: req.body.selling_price,
            listing_price: req.body.listing_price,
            stock_count: req.body.stock_count,
            images: images,
          })
          product.save((err) => {
            if (err) {
              res.json({ message: err.message, type: "danger" })
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
      console.log(error);
      next(createError(404));
    }

  },

  // addProducts: (req, res) => {
  //   const filenames = req.files.map(file => file.filename);
  //   const product = new admin_products({
  //     name: req.body.name,
  //     category: req.body.category,
  //     description: req.body.description,
  //     selling_price: req.body.selling_price,
  //     listing_price: req.body.listing_price,
  //     stock_count: req.body.stock_count,
  //     images: filenames,
  //   })
  //   product.save((err) => {
  //     if (err) {
  //       res.json({ message: err.message, type: "danger" })
  //     } else {
  //       req.session.message = {
  //         type: 'success',
  //         message: 'Product added successfully'
  //       }
  //       res.redirect('/admin/admin-product')
  //     }
  //   })
  // },


  uploadImages: (req, res, next) => {
    uploadFiles(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.send('Too many files to upload !')
        }
      } else if (err) {
        res.send(err)
      }
    })
    console.log('upload');
    next()
  },

  //resizing

  resizeImages: async (req, res, next) => {
    if (!req.files) return next()

    req.body.images = []
    await Promise.all(
      req.files.map(async (file) => {
        const filename = file.originalname.replace(/\..+$/, '')
        const newFilename = `bmart-${filename}-${Date.now()}.jpeg`

        await sharp(file.buffer)
          .extract({ width: 800, height: 800 })
          .jpeg({ quality: 100 })
          .toFile(`uploads/${newFilename}`)
        req.body.images.push(newFilename)
      })
    )
    console.log('resize');
    next()
  },

  getResultImages: (req, res, next) => {
    if (req.body.images.length <= 0) {

      return res.send(`You must select at least 1 image !`);
    }

    const images = req.body.images.map((image) => { ' ' + image + ' ' }).join(', ')

    const product = new admin_products({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      selling_price: req.body.selling_price,
      listing_price: req.body.listing_price,
      stock_count: req.body.stock_count,
      images: images,
    })
    console.log(product);
    product.save((err) => {
      if (err) {
        res.json({ message: err.message, type: "danger" })
      } else {
        req.session.message = {
          type: 'success',
          message: 'Product added successfully'
        }
        res.redirect('/admin/admin-product')
      }
    })
    console.log('result');
  }
  ,
  deleteProducts: (req, res, next) => {

    try {
      let id = req.params.id
      admin_products.findByIdAndRemove(id, (err, result) => {
        if (result.images != '') {
          try {
            for (let i = 0; i < result.images.length; i++) {
              fs.unlinkSync('./public/uploads/' + result.images[i])
            }

          } catch (err) {
            console.log(err);
          }
        }
        if (err) {
          res.json({ message: err.message })
        } else {
          req.session.message = {
            type: 'success',
            message: 'Product deleted successfully'
          }
          res.redirect('/admin/admin-product')
        }
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  },
  editProductsPage: async (req, res, next) => {
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
  },
  editProducts: (req, res) => {
    try {
      let id = req.params.id
      let new_images = ''
      let dataToUpload = {
        name: req.body.name,
        category: ObjectId(req.body.category),
        description: req.body.description,
        selling_price: req.body.selling_price,
        listing_price: req.body.listing_price,
        stock_count: req.body.stock_count,
      }

      if (req.files.length > 0) {
        // new_images = req.files.map(file => file.filename);
        // dataToUpload.images = new_images
        console.log("in");
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
            // console.log(newFilename);
            resolve();
          }));

        })
        // console.log(new_images);

        dataToUpload.images = new_images

      }

      admin_products.findByIdAndUpdate({ _id: id }, dataToUpload, (err, result) => {
        if (err) {
          res.json({ message: err.message, type: 'danger' })
          console.log(err);
        } else {
          req.session.message = {
            type: 'success',
            message: 'Product updated successfully'
          }
          res.redirect('/admin/admin-product')
        }
      }).populate("category")
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  }
  ,

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
      console.log(error);
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
    } catch (err) {
      console.log(err);
      next(createError(404));
    }
  }
  ,
  allUsers: (req, res, next) => {

    admin_users.find().exec((err, users) => {
      if (err) {
        res.json({ message: err.message })
      } else {
        res.render('admin/usermgt', {
          title: 'Admin Panel',
          page: 'Users',
          users: users,
        })
      }
    })
  },

  addUsersPage: (req, res, next) => {
    res.render('admin/add_user', { title: 'Add User', page: 'Add user' })
  },

  addUsers: (req, res, next) => {
    const user = new admin_users({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password
    })
    user.save((err) => {
      if (err) {
        res.json({ message: err.message, type: "danger" })
      } else {
        req.session.message = {
          type: 'success',
          message: 'User added successfully'
        }
        res.redirect('/admin/admin-user')
      }
    })
  },

  deleteUsers: (req, res, next) => {
    let id = req.params.id
    admin_users.findByIdAndRemove(id, (err, result) => {
      if (result.image != '') {
        try {
          fs.unlinkSync('./public/uploads/' + result.image)
        } catch (err) {
          console.log(err);
        }
      }
      if (err) {
        res.json({ message: err.message })
      } else {
        req.session.message = {
          type: 'success',
          message: 'User deleted successfully'
        }
        res.redirect('/admin/admin-user')
      }
    })
  },

  editUsersPage: (req, res, next) => {
    let id = req.params.id
    admin_users.findById(id, (err, user) => {
      if (err) {
        res.redirect('admin/admin-user')
      } else {
        if (user == null) {
          res.redirect('admin/admin-user')
        } else {
          res.render('admin/edit_user', { title: 'Edit user', page: 'Edit user', user: user, })
        }
      }
    })
  },

  editUsers: (req, res, next) => {
    let id = req.params.id
    let new_image = ''
    if (req.file) {
      new_image = req.file.filename
      try {
        fs.unlinkSync('./public/uploads/' + req.body.old_image)
      } catch (err) {
        console.log(err);
      }
    } else {
      new_image = req.body.old_image
    }

    admin_users.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    }, (err, result) => {
      if (err) {
        res.json({ message: err.message, type: 'danger' })
      } else {
        req.session.message = {
          type: 'success',
          message: 'User updated successfully'
        }
        res.redirect('/admin/admin-user')
      }
    })

  },


  bannerPage: async (req, res, next) => {
    const banners = await banner.find()
    res.render('admin/bannermgt', { title: 'Banner', page: 'Banner', banners })
  },

  addBannerPage: (req, res) => {
    res.render('admin/add-banner', { title: 'Add banner', page: 'Add banner' })
  },

  addBanner: (req, res) => {
    try {
      const bannerr = new banner({
        name: req.body.name,
        image: req.file.filename,
        description: req.body.description
      })

      bannerr.save((err, bannerr) => {
        if (err) {
          console.log(err);
          res.json({ message: err.message, type: "danger" })
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner added successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  },

  editBannerPage: (req, res, next) => {
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
  },

  editBanner: (req, res, next) => {
    try {
      let id = req.params.id
      let new_img = ''
      if (req.file) {
        new_img = req.file.filename
        try {
          fs.unlinkSync('./public/uploads/' + req.body.old_img)
        } catch (err) {
          console.log(err);
        }
      } else {
        new_img = req.body.old_img
      }
      banner.findByIdAndUpdate(id, {
        name: req.body.name,
        image: new_img,
        description: req.body.description
      }, (err, result) => {
        if (err) {
          res.json({ message: err.message, type: 'danger' })
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner updated successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      console.log(error);
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
    } catch (err) {
      console.log(err);
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
    } catch (err) {
      console.log(err);
      next(createError(404));
    }
  },

  deleteBanner: (req, res, next) => {
    try {
      let id = req.params.id
      banner.findByIdAndRemove(id, (err, result) => {
        if (result.image != '') {
          try {
            fs.unlinkSync('./public/uploads/' + result.image)
          } catch (err) {
            console.log(err);
          }
        }
        if (err) {
          res.json({ message: err.message })
        } else {
          req.session.message = {
            type: 'success',
            message: 'Banner deleted successfully'
          }
          res.redirect('/admin/admin-banner')
        }
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  },

  couponPage: async (req, res, next) => {
    const coupons = await coupon.find()
    res.render('admin/couponmgt', { title: 'Coupons', page: 'Coupons', coupons })
  },

  addCouponPage: (req, res, next) => {
    res.render('admin/add-coupon', { title: 'Add coupon', page: 'Add coupon' })
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
          console.log(err);
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
      console.log(error);
      next(createError(404));
    }

  },

  editCouponPage: (req, res, next) => {
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
          console.log("false");
          req.session.message = {
            type: 'success',
            message: 'Coupon updated successfully'
          }
          res.redirect('/admin/admin-coupon')
        }
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  },

  deleteCoupon: (req, res, next) => {
    try {
      let id = req.params.id
      coupon.findByIdAndRemove(id, (err, result) => {
        if (err) {
          res.json({ message: err.message })
        } else {
          req.session.message = {
            type: 'success',
            message: 'Coupon deleted successfully'
          }
          res.redirect('/admin/admin-coupon')
        }
      })
    } catch (error) {
      console.log(error);
      next(createError(404));
    }

  },



  vieworder: async (req, res, next) => {
    const order = await orders.find().populate('userId').sort({ ordered_date: -1 })
    res.render('admin/ordermgt', { title: 'Orders', page: 'Orders', order })
  },

  order_details: async (req, res, next) => {
    orderId = req.params.id
    let orderInfo = await orders.findOne({ _id: orderId }).populate(['products.item', 'userId'])

    res.render('admin/view-order', { title: 'Orders', page: 'View order', orderInfo })
  },

  cancel_order: async (req, res, next) => {
    try {
      orderId = req.params.id
      orders.updateOne({ _id: orderId }, { $set: { order_status: 'cancelled', 'delivery_status.cancelled.state': true, 'delivery_status.cancelled.date': Date.now() } }).then(() => {
        res.redirect('/admin/admin-order')
      })
    } catch (err) {
      console.log(err);
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
      console.log(error);
      next(createError(404));
    }

  },

  invoice: async (req, res, next) => {
    let orderId = req.params.id
    let orderInfo = await orders.findOne({ _id: orderId }).populate(['products.item', 'userId'])
    res.render('admin/invoice', { title: 'invoice', page: 'invoice', orderInfo })
  },

  adminLogout: (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      } else {
        // history.replaceState(null, null, '/');
        res.redirect('/admin')
      }
    });

  }


}