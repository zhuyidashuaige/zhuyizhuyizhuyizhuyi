(function ($) {
    "use strict";

/**-------------------------------
 * Table Of Content
 * ===============================
 * 01. Main Manu
 * 03. Sticky Menu
 * 03. Nice Select (Plugin Init)
 * 04. Counter Up (Plugin Init)
 * 05. Testimonial (Swiper Slider Init)
 * 
 *--------------------------------*/

/**---------------------------------
 * Header
 *---------------------------------*/
$('.toggler-btn').on('click', function() {
    $('.header-menu').slideToggle();
})
$('.has-dropdown').on('click', function(e) {
    e.preventDefault();
    $(this).children('.sub-menu').slideToggle();
})


/**---------------------------------
 *  Sticky Menu 
 *---------------------------------*/
$(window).on('scroll load', stickyMenu)

function stickyMenu() {
    if ($(window).scrollTop() > 100) {
        $('.header-section').addClass('sticky');
    } else {
        $('.header-section').removeClass('sticky');
    }
}

/**--------------------------------
 * Nice Select
 *--------------------------------- */
if ($("select").length > 0) {
    $("select").niceSelect();
}



/**---------------------------------
 * Counter-up
 *---------------------------------*/
    if ($('.counter__number').length) {
    $('.counter__number .num').counterUp({
        delay: 10,
        time: 1000
    });
}


/*---------------------------------
 * Testimonial Sliders
 *---------------------------------*/
var testimonial = new Swiper(".testimonialSwiper", {
    loop: false,
    spaceBetween: 30,
    navigation: {
        nextEl: ".testimonials .slider-nav .next",
        prevEl: ".testimonials .slider-nav .prev",
    },
    breakpoints: {
        480: {
            slidesPerView: 1
        },
        768: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
    },
});
})(jQuery);
