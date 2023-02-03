const admin_users = require('../models/admin_users')
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer")
const Category = require('../models/admin_category')
const Banner = require('../models/admin_banner')
const cart = require('../models/cart')
const { ObjectId, LoggerLevel } = require('mongodb')
const admin_products = require('../models/admin_products')
const coupon = require('../models/admin_coupons')
const orders = require('../models/admin_orders')
const randomstring = require('randomstring')
const Razorpay = require('razorpay')
const { KEY_ID, SECRET_KEY, mailId, password } = process.env;
const ITEMS_PAGE = 6
const createError = require("http-errors");
var instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: SECRET_KEY
})



let transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,

  auth: {
    user: mailId,
    pass: password,
  }

});
var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);




module.exports = {

  homePage: async (req, res, next) => {
    try {
      let user = req.session.user
      const categories = await Category.find()
      const banners = await Banner.find()
      const users = await admin_users.find()
      const products = await admin_products.find({deleted:false}).sort({ created: -1 }).limit(8)
      res.render('user/home', { title: 'Home', categories, banners, users, user,products })
    } catch (error) {
      next(createError(404));
    }
  },

  registrationPage: (req, res, next) => {
    try {
      if (req.session.userLoggedIn) {
        res.redirect('/')
      } else {
        res.render('user/register', { title: 'Signup' })
      }
    } catch (error) {
      next(createError(404));
    }
  },
  getOTP: (req, res, next) => {
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
          from: 'bmartlaps@outlook.com',
          subject: "Otp for registration is: ",
          html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        }
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

          res.render('user/otp', { title: 'Verify otp', errorMessage: null })
        });
      }
    }).catch((err) => {
      next(createError(404));
    })
  },

  resendOTP: (req, res, next) => {
    try {
      var mailOptions = {
        to: Email,
        from: 'bmartlaps@outlook.com',
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
      }
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        res.render('user/otp', { title: 'Verify otp', errorMessage: null })
      });
    } catch (error) {
      next(createError(404));
    }
  },

  verifyOTP: (req, res, next) => {
    if (req.body.otp == otp) {
      console.log('otp correct');
      const user = new admin_users({
        name: Name,
        email: Email,
        password: Password,
        phone: Phone,
      })
      const saltRounds = 10
      bcrypt.hash(user.password, saltRounds).then((hashedPassword) => {
        user.password = hashedPassword
        user.save().then((data) => {
          req.session.message = {
            type: 'success',
            message: 'Signup successful'
          }
          req.session.userLoggedIn = true
          req.session.user = data

          res.redirect('/')
        }).catch((err) => {
          next(createError(404));
        })

      }).catch((err) => {
        next(createError(404));
      })
    } else {
      req.session.message = {
        type: 'danger',
        message: 'Entered otp is incorrect'
      }
      res.locals.errorMessage = 'OTP is incorrect';
      req.session.userLoggedIn = false
      var errorMessage = "OTP is incorrect";
      res.render('user/otp', { title: 'verify OTP', errorMessage: errorMessage })
    }
  },

  signinPage: (req, res, next) => {
    try {
      if (req.session.userLoggedIn) {
        res.redirect('/')
      } else {
        res.render('user/login', { title: 'Signin' })
      }
    } catch (error) {
      next(createError(404));
    }
  },

  signin: async (req, res, next) => {
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
      admin_users.findOne({ email, status: 'unblocked' }).then((data) => {
        if (data) {
          const hashedPassword = data.password
          bcrypt.compare(password, hashedPassword).then((result) => {
            if (result) {
              req.session.message = {
                type: 'success',
                message: 'Signin successful'
              }
              req.session.userLoggedIn = true
              req.session.user = data

              res.redirect('/')
            } else {
              req.session.userLoggedIn = false
              req.session.message = {
                type: 'danger',
                message: 'Invalid password'
              }
              res.redirect('/user-signin')
            }
          })
            .catch((err) => {
              next(createError(404));
            })
        } else {
          req.session.message = {
            type: 'danger',
            message: 'Invalid credentialssss'
          }
          res.redirect('/user-signin')
        }
      })
        .catch((err) => {
          req.session.message = {
            type: 'danger',
            message: 'Invalid credentialsd'
          }
          res.redirect('/user-signin')
        })
    }
  },

  forgotPasswordPage: (req, res, next) => {
    try {
      res.render('user/forgotPassword', { title: 'Reset password' })
    } catch (error) {
      next(createError(404));
    }
  },

  forgotPassword: async (req, res, next) => {

    try {
      const email = req.body.email
      const oldUser = await admin_users.findOne({ email: email })
      if (oldUser) {
        const randomStringg = randomstring.generate()
        const updatedData = await admin_users.updateOne({ email: email }, { $set: { token: randomStringg } })


        var mailOptions = {
          to: oldUser.email,
          from: 'bmartlaps@outlook.com',
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
      next(createError(404));
    }
  },

  resetPasswordPage: async (req, res, next) => {
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
      next(createError(404));
    }
  },

  resetPassword: async (req, res, next) => {
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
      next(createError(404));
    }
  },

  productListing: async (req, res, next) => {
    try {
      let user = req.session.user
      const query = req.query.category
      if (query) {
        try {
          const categories = await Category.find()
          const products = await admin_products.find({ category: query })
          res.render('user/listing', { products, categories, title: 'categories', user })
        }
        catch (error) {
          next(createError(404))
        }
      }
      else if (req.query.search) {
        try {
          let key = req.query.search
          let products = await admin_products.find({ name: { $regex: key, $options: 'i' }, deleted: false })
          const categories = await Category.find()
          res.render('user/listing', { products, categories, title: 'categories', user })
        } catch (err) {
          next(createError(404))
        }
      }
      else if (req.query.sort) {
        try {
          if (req.query.sort == "name") {
            let products = await admin_products.find().collation({ locale: "en" }).sort({ name: 1 })
            const categories = await Category.find()
            res.render('user/listing', { products, categories, title: 'categories', user })
          }
          else if (req.query.sort = "price") {
            let products = await admin_products.find().sort({ selling_price: -1 }).collation({ locale: "en", numericOrdering: true })
            const categories = await Category.find()
            res.render('user/listing', { products, categories, title: 'categories', user })
          }

        } catch (err) {
          next(createError(404))
        }
      }
      else if (req.query.page) {
        const page = req.query.page
        let products = await admin_products.find({ deleted: false }).skip((page - 1) * ITEMS_PAGE).limit(ITEMS_PAGE)
        const categories = await Category.find()
        res.render('user/listing', { products, categories, title: 'categories', user })
      }
      else {
        const categories = await Category.find()
        const products = await admin_products.find()
        res.render('user/listing', { products, categories, title: 'categories', user })
      }
    } catch (error) {
      next(createError(404));
    }
  },

  singleProduct: async (req, res, next) => {
    try {
      let id = req.params.id
      let user = req.session.user
      admin_products.findById(id, (err, product) => {
        if (product == null) {
          res.redirect('/categories')
        } else {
          res.render('user/single-product', { title: 'Product', product: product, user })
        }
      }).populate('category')
    } catch (error) {
      next(createError(404));
    }
  },
  accountPage: async (req, res, next) => {
    try {
      let user = req.session.user
      let id = req.session.user._id
      let userInfo = await admin_users.findById({ _id: id })
      res.render('user/account', { title: 'Account', userInfo, user })
    } catch (error) {
      next(createError(404));
    }
  },

  addressPage: async (req, res, next) => {
    try {
      let user = req.session.user
      let id = req.session.user._id
      let userInfo = await admin_users.findById({ _id: id })
      res.render('user/address', { title: 'Address', userInfo, user })
    } catch (error) {
      next(createError(404));
    }
  },

  addAddress: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let newaddresss = {
        'name': req.body.name,
        'house': req.body.house,
        'post': req.body.post,
        'city': req.body.city,
        'district': req.body.district,
        'state': req.body.state,
        'pin': req.body.pin
      }
      await admin_users.updateOne({ _id: id }, { $push: { address: newaddresss } })

      res.redirect('/address')
    } catch (error) {
      next(createError(404));
    }

  },

  editAddressPage: async (req, res, next) => {
    try {
      const addressId = req.params.id
      const userId = req.session.user._id
      let user = await admin_users.findOne({ _id: userId })
      user.address.forEach((row) => {
        if (row.id.toString() == addressId.toString()) {
          res.json(row)
        }
      })

    } catch (err) {
      next(createError(404));
    }
  },

  updateAddress: async (req, res, next) => {
    try {
      const addressId = req.params.id
      let addressUpdate = {
        'address.$.name': req.body.name,
        'address.$.house': req.body.house,
        'address.$.post': req.body.post,
        'address.$.city': req.body.city,
        'address.$.district': req.body.district,
        'address.$.state': req.body.state,
        'address.$.pin': req.body.pin
      }
      const userId = req.session.user._id
      await admin_users.updateOne({ _id: userId, 'address._id': addressId }, { $set: addressUpdate }).then(() => {
        res.redirect('/address')
      })
    } catch (err) {
      next(createError(404));
    }
  },

  deleteAddress: async (req, res, next) => {
    try {
      let id = req.params.id
      let userId = req.session.user._id
      await admin_users.findByIdAndUpdate({ _id: userId }, { $pull: { address: { _id: id } } })
      res.json("deleted")
    }
    catch (err) {
      next(createError(404));
    }
  },

  editInfo: (req, res, next) => {
    try {
      let id = req.session.user._id
      admin_users.findByIdAndUpdate(id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone
      }, (err, result) => {
        if (err) {
          req.session.message = {
            type: 'danger',
            message: 'Error while updating,' + err.message
          }
          res.redirect('/account')
        } else {
          req.session.message = {
            type: 'success',
            message: 'Details updated successfully'
          }
          res.redirect('/account')
        }
      })
    } catch (error) {
      next(createError(404));
    }
  },

  settingsPage: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let user = req.session.user
      let userInfo = await admin_users.findById({ _id: id })
      res.render('user/settings', { title: 'Settings', userInfo, user })
    } catch (error) {
      next(createError(404));
    }
  },

  changePassword: async (req, res, next) => {
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
      next(createError(404));
    }
  },

  addOrderAddress: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let newaddresss = {
        'name': req.body.name,
        'house': req.body.house,
        'post': req.body.post,
        'city': req.body.city,
        'district': req.body.district,
        'state': req.body.state,
        'pin': req.body.pin
      }

      await admin_users.updateOne({ _id: id }, { $push: { address: newaddresss } })
      res.redirect('/checkout')
    } catch (error) {
      next(createError(404));
    }
  },


  checkoutPage: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let user = req.session.user
      let userInfo = await admin_users.findById({ _id: id })
      let cartInfo = await cart.findOne({ user: id }).populate('products.item')

      if (cartInfo.products.length > 0) {

        const isStockAvailable = cartInfo.products.every(product => {
          return product.quantity <= product.item.stock_count;
        });


        if (!isStockAvailable) {
          console.log("innnsfjsfasfjladjflas");
          let outOfStockProducts = [];
          cartInfo.products.forEach(product => {
            if (product.quantity > product.item.stock_count) {
              console.log("indfsdfsjdf");
              outOfStockProducts.push(product.item.name);
            }
          });
          req.session.message = {
            type: 'danger',
            message: `${outOfStockProducts} is out of stock`
          }
          res.redirect("/cart");
        }
        res.render('user/checkout', { title: 'Check out', userInfo, cartInfo, user })
      }
      else {
        res.redirect('/cart')
      }
    } catch (error) {
      next(createError(404));
    }
  },

  applyCoupon: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let userInfo = await admin_users.findById({ _id: id })
      let cartInfo = await cart.findOne({ user: id })
      var couponCode = req.body.code;

      // Check if the coupon code is valid
      let couponDet = await coupon.findOne({ code: couponCode, used_user: { $nin: [id] } })

      if (couponDet) {
        let date = new Date(couponDet.expire)
        const currentDate = new Date();
        if (date.getTime() < currentDate.getTime()) {
          res.json({ expired: true });
        } else {

          if (cartInfo.totalprice > couponDet.min_bill) {
            let discount = Math.round(cartInfo.totalprice * (couponDet.discount / 100))

            if (discount > couponDet.cap) {
              let maxDiscount = Math.round(couponDet.cap)
              let total = cartInfo.totalprice - maxDiscount
              req.session.coupon = couponCode

              res.json({ success: true, newTotal: total, discount: maxDiscount });
            } else {
              let total = cartInfo.totalprice - discount
              req.session.coupon = couponCode
              res.json({ success: true, newTotal: total, discount: discount });
            }
            await couponDet.updateOne(
              {
                $addToSet: {
                  used_user: id,
                },
              }
            );

          } else {
            req.session.coupon = null
            res.json({ notapplicable: true });
          }
        }
      } else {
        req.session.coupon = null
        res.json({ success: false });
      }

    }
    catch (err) {
      req.session.coupon = null
      res.json({ success: false });
      next(createError(404));
    };
  },

  removeCoupon: async (req, res, next) => {
    try {
      let id = req.session.user._id
      let userInfo = await admin_users.findById({ _id: id })
      let cartInfo = await cart.findOne({ user: id })
      var couponCode = req.body.code;

      // Check if the coupon code is valid
      let couponDet = await coupon.findOne({ code: couponCode })

      if (couponDet) {
        await couponDet.updateOne(
          { $pull: { used_user: id } }
        );

        let total = cartInfo.totalprice
        let maxDiscount = 0
        req.session.coupon = null
        res.json({ success: true, newTotal: total, discount: maxDiscount });

      } else {
        res.json({ success: false });
      }
    }
    catch (err) {
      next(createError(404));
    }
  },

  placeOrder: async (req, res, next) => {
    try {
      let order = req.body
      let cartData = await cart.findOne({ user: order.userId }).populate('products.item')

      const isStockAvailable = cartData.products.every(product => {
        return product.quantity <= product.item.stock_count;
      });

      if (!isStockAvailable) {
        let outOfStockProducts = [];
        cartData.products.forEach(product => {
          if (product.quantity > product.item.stock_count) {
            outOfStockProducts.push(product.item.name);
          }
        });
        req.session.message = {
          type: 'danger',
          message: `${outOfStockProducts} is out of stock`
        }

        let couponDet = await coupon.findOne({ used_user: order.userId })
        if (couponDet) {
          await couponDet.updateOne(
            { $pull: { used_user: order.userId } }
          );
        }
        req.session.coupon = null

        res.json({ outOfStock: true })
      } else {
        if (req.session.coupon != null) {
          couponData = req.session.coupon
          let userCoupon = await coupon.findOne({ code: couponData })
          couponss = {
            name: userCoupon.name,
            code: userCoupon.code,
            discount: userCoupon.discount,
          }
          if (userCoupon) {
            let discount = Math.round(cartData.totalprice * (userCoupon.discount / 100))

            if (discount > userCoupon.cap) {
              maxDiscount = Math.round(userCoupon.cap)
              total = cartData.totalprice - maxDiscount
            } else {
              total = cartData.totalprice - discount
              maxDiscount = discount
            }
          }

        } else {
          couponss = {
            name: 'nil',
            code: 'nil',
            discount: 0,
          }
          total = cartData.totalprice
          maxDiscount = 0
        }

        cartData.products.forEach(async (product) => {
          new_stock = product.item.stock_count - product.quantity
          await admin_products.findByIdAndUpdate({ _id: product.item._id }, { $set: { stock_count: new_stock } })
        })


        let selectAddress = await admin_users.findOne({ _id: order.userId }, { 'address': 1, _id: 0 }).exec()
        let addr = selectAddress.address[order['order-address']]
        let prods = cartData.products
        let totalPrice = cartData.totalprice

        let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
        orderData = orders({
          userId: ObjectId(order.userId),
          address: addr,
          payment: {
            pay_method: order['payment-method']
          },
          coupon: couponss,
          total: totalPrice,
          discount_amount: maxDiscount,
          grand_total: total,
          products: prods,
          order_status: status,
          delivery_status: {
            ordered: {
              state: true
            }
          }
        })

        let userOrder = await orderData.save().then(req.session.coupon = null)
        if (order['payment-method'] === 'COD') {
          await orders.updateOne({ _id: userOrder._id }, { $set: { "payment.pay_id": "COD_" + userOrder._id } })
          await cart.deleteOne({ user: order.userId })
          res.json({ codSuccess: true })
        }
        else {

          var options = {
            amount: userOrder.grand_total * 100,
            currency: "USD",
            receipt: "" + userOrder._id
          }
          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            } else {
              console.log(order, "orrd");
              res.json(order)
            }
          })
        }
      }
    } catch (error) {
      next(createError(404));
    }
  },

  verifyPayment: async (req, res, next) => {
    try {
      let id = req.session.user._id
      const crypto = require('crypto')
      let hmac = crypto.createHmac('sha256', SECRET_KEY)
      hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id)
      hmac = hmac.digest('hex')
      if (hmac == req.body.payment.razorpay_signature) {
        await orders.updateOne({ _id: req.body.order.receipt }, { $set: { order_status: 'placed', "payment.pay_status": 'success', "payment.pay_id": req.body.payment.razorpay_payment_id } })
        await cart.deleteOne({ user: id })
        res.json({ status: true })
      } else {
        await orders.updateOne({ _id: req.body.order.receipt }, { $set: { order_status: 'failed', "payment.pay_status": 'failed', "payment.pay_id": "failed" } })
        res.json({ status: false, errMsg: '' })
      }
    } catch (error) {
      next(createError(404));
    }
  },



  orderSuccessPage: (req, res, next) => {
    try {
      let user = req.session.user
      res.render('user/order-success', { title: 'Order Success', user })
    } catch (error) {
      next(createError(404));
    }
  },

  orderPage: async (req, res, next) => {
    try {
      let user = req.session.user
      let id = req.session.user._id
      let userInfo = await admin_users.findById({ _id: id })
      let orderInfo = await orders.find({ userId: id }).sort({ ordered_date: -1 })
      res.render('user/orders', { title: 'Orders', userInfo, orderInfo, user })
    } catch (error) {
      next(createError(404));
    }
  },

  orderProductsPage: async (req, res, next) => {
    try {
      let usersId = req.session.user._id
      let user = req.session.user
      let ordId = req.params.id
      let userInfo = await admin_users.findById({ _id: usersId })
      let orderInfo = await orders.find({ userId: usersId, _id: ordId }).populate('products.item')

      res.render('user/ordered_items', { title: 'Orders', userInfo, orderInfo, user })
    } catch (error) {
      next(createError(404));
    }

  },


  contactUs: (req, res, next) => {
    try {
      let user = req.session.user
      res.render('user/contact', { title: 'Contact Us', user })
    } catch (error) {
      next(createError(404));
    }
  },

  userCancelOrder: async (req, res, next) => {
    try {
      orderId = req.params.id
      orders.updateOne({ _id: orderId }, { $set: { order_status: 'cancelled', 'delivery_status.cancelled.state': true, 'delivery_status.cancelled.date': Date.now() } }).then(() => {
        res.redirect('/ordered-items/' + orderId)
      })
    } catch (err) {
      next(createError(404));
    }
  },

  userLogout: (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        } else {
          res.redirect('/user-signin')
        }
      });
    } catch (error) {
      next(createError(404));
    }
  }
}