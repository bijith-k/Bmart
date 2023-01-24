 
function addToCart(proId){
  $.ajax({
    url:'/add-to-cart/'+proId,
    method:'get',
    success:(response)=>{
       if(response.status){
        Swal.fire(
          'Added!',
          'Product added to cart',
          'success'
        )
       }
      //  else if(response.repeat){
      //   Swal.fire(
      //     'Wait!',
      //     'Already in cart',
      //     'warning'
      //   )
      //  }
       else{
        Swal.fire({
          icon: 'error',
  title: 'Oops...',
  text: 'You need to login',
  footer: '<a href="/user-signin">Click here to Login</a>'}
        ) 
       }
       
    }
  })
}


function wishlist(proId){
  $.ajax({
    url:'/add-to-wishlist/'+proId,
    method:'get',
    success:(response)=>{
       if(response.status){
        Swal.fire(
          'Added!',
          'Product added to wishlist',
          'success'
        )
       }else if(response.added){
        Swal.fire(
          'Wait!',
          'Product already in wishlist',
          'warning'
        )
       }
       else{
        Swal.fire({
          icon: 'error',
  title: 'Oops...',
  text: 'You need to login',
  footer: '<a href="/user-signin">Click here to Login</a>'}
        ) 
       }
       
    }
  })
}