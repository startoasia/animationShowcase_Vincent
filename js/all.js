// 彈跳視窗
const $body = $('body');
function popUpShow($element) {
  const $show = $('.popBG').add($element)
  $body.css('overflow', 'hidden')
  $show.addClass('popControl--active')
}
function popUpClose() {
  const $activePopups = $('.popControl--active')
  $body.css('overflow', 'visible')
  $activePopups.removeClass('popControl--active')
}
// 收合功能
// function scrollShow(scrollID) {
//   const $showscroll = $(scrollID);
//   $showscroll.toggleClass("show");
// }
$(window).on("load", function (){
  // AOS
  AOS.init({
    // Settings that can be overridden on per-element basis, by `aos-*` attributes:
    offset: 120, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 400, // values from 0 to 3000, with step 50ms
    easing: "ease", // default easing for AOS animations
    once: false, // whether animation should happen only once - while scrolling down
    mirror: false, // whether elements should animate out while scrolling past them
    anchorPlacement: "top-bottom", // defines which position of the element regarding to window should trigger the animation
  });
  //頁面內跳轉
  // function toTarget(target) {
  //   const $target = $(target);
  //   const target_offsetTop = $target.offset().top;
  //   const $navContainer = $("#header");
  //   const navHeight = $navContainer.height();
  //   $("html, body").animate({ scrollTop: target_offsetTop - navHeight }, 400);
  // }
  // const $item03_3 = $(".item03-3");
  // $item03_3.click(() => { 
  //   toTarget("#ctaEnd")
  // });
  // 折扣碼
  // const copyEl = "OZIOSNK2588";
  // const btnEl = document.querySelector(".headerBanner");
  // let discountCode = document.querySelector(".discount_code");
  // let discountBox = document.querySelector(".discount_box");
  // btnEl.addEventListener("click", () => {
  //   discountBox.classList.add("openDiscount");
  //   discountCode.innerText = copyEl;
  //   navigator.clipboard
  //     .writeText(copyEl)
  //     .then(() => {
  //       console.log("複製成功");
  //     })
  //     .catch(() => {
  //       console.log("複製失敗");
  //     });
  //   window.setTimeout(function () {
  //     window.scrollTo({
  //       // top: offer.offsetTop - header.offsetHeight,
  //       behavior: "smooth",
  //     });
  //     discountBox.classList.remove("openDiscount");
  //   }, 1500);
  // });


})
// Swiper
// var swiper = new Swiper(".mySwiper", {
//   // 動畫過度:單位豪秒
//   speed: 1000,
//   // 是否重複撥放
//   loop: true,
//   // 自動撥放
//   autoplay: {
//     // 每張輪播圖要【停留】多久
//     delay: 1500,
//     // 當使用者點及切換時，是否停止輪播功能
//     disableOnInteraction: false,
//   },
//   // 頁籤
//   pagination: {
//     el: ".thing01 .swiper-pagination",
//   },
//   // 左右按鈕
//   navigation: {
//     nextEl: ".thing01 .swiper-button-next",
//     prevEl: ".thing01 .swiper-button-prev",
//   },
// });
