

exports.getProductList = (req,res)=>{
  let products=[
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:400,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    },
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:400,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    },
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:400,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    },
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:400,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    },
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:600,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    },
    {
      name:"ingiaiflsdldkfjlsldfj",
      price:400,
      old_price:500,
      image:"images/g1_1_asus-tuf-f15-fx506lhb.jpg"
    }
  ]
  res.render('user/products',{title:'products',products})
}