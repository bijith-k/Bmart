const lens = document.querySelector('.magnifier-lens');
const product_img = document.querySelector('.product-img img');
const magnified_img = document.querySelector('.magnified-img');

function magnify(product_img,magnified_img){
  lens.addEventListener('mousemove', moveLens)
  product_img.addEventListener('mousemove', moveLens)
  //take mouse out of image
  lens.addEventListener('mouseleave', leaveLens)
}

function moveLens(e){
  // console.log("X :" + e.pageX + "Y:" + e.pageY );
  let x,y,cx,cy;
//Get postion of cursor
const product_img_rect = product_img.getBoundingClientRect()
x = e.pageX - product_img_rect.left - lens.offsetWidth/2
y = e.pageY - product_img_rect.top - lens.offsetHeight*2

    

   let max_xpos = product_img_rect.width - lens.offsetWidth
   let max_ypos = product_img_rect.height - lens.offsetHeight

   if(x>max_xpos) x = max_xpos
   if(x<0) x = 0
   if(y>max_ypos) y = max_ypos
   if(y<0) y = 0

   lens.style.cssText =  `top: ${y}px; left: ${x}px`;

   //calculate the magnified_img & lens's aspect ratio

   cx = magnified_img.offsetWidth / lens.offsetWidth
   cy = magnified_img.offsetHeight / lens.offsetHeight

  //  magnified_img.style.cssText =` background : url('${product_img.src}')
  //  -${x *cx}px -${y * cy}px 
  //  no-repeat
  //  `
  magnified_img.style.backgroundImage = `url(${product_img.src})`
  magnified_img.style.backgroundPosition = `-${x * cx}px -${y * cy}px `
  magnified_img.style.backgroundSize = `${product_img_rect.width * cx}px
  ${product_img_rect.height * cy}px`
  magnified_img.style.backgroundRepeat = 'no-repeat'

  lens.classList.add('active')
  magnified_img.classList.add('active')
}

function leaveLens(){
  lens.classList.remove('active')
  magnified_img.classList.remove('active')
}

magnify(product_img,magnified_img)