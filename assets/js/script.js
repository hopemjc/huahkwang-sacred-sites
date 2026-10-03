(function () {
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yearNodes = document.querySelectorAll('[data-current-year]');
  var currentYear = new Date().getFullYear();
  yearNodes.forEach(function (node) {
    node.textContent = currentYear;
  });

  // ===== 八大聖地共用照片相簿 =====
  var galleries = document.querySelectorAll('[data-gallery]');

  galleries.forEach(function (gallery) {
    var count = Number(gallery.dataset.galleryCount);
    var path = gallery.dataset.galleryPath;
    var prefix = gallery.dataset.galleryPrefix;

    var mainImage = gallery.querySelector('[data-gallery-main]');
    var secondImage = gallery.querySelector('.gallery-image-b');
    var thumbsContainer = gallery.querySelector('[data-gallery-thumbs]');
    var prevButton = gallery.querySelector('.gallery-prev');
    var nextButton = gallery.querySelector('.gallery-next');

    if (!count || !path || !prefix || !mainImage || !thumbsContainer) {
      return;
    }

    var currentIndex = 1;
    var autoPlayTimer;
    var activeImage = mainImage;
    var inactiveImage = secondImage;

    function imageNumber(index) {
      return String(index).padStart(2, '0');
    }

    function fullImagePath(index) {
      return path + '/full/' + prefix + '-' + imageNumber(index) + '.jpeg';
    }

    function thumbImagePath(index) {
      return path + '/thumbs/' + prefix + '-' + imageNumber(index) + '.jpeg';
    }

    function showImage(index) {
      if (index < 1) {
        index = count;
      }

      if (index > count) {
        index = 1;
      }

      currentIndex = index;

      var nextSrc = fullImagePath(index);

      inactiveImage.onload = function () {
        inactiveImage.classList.add('is-visible');
        activeImage.classList.remove('is-visible');

        var oldActiveImage = activeImage;
        activeImage = inactiveImage;
        inactiveImage = oldActiveImage;

        inactiveImage.onload = null;
      };

      inactiveImage.src = nextSrc;
      inactiveImage.alt = '照片 ' + index;

      var thumbs = gallery.querySelectorAll('.gallery-thumb');

      thumbs.forEach(function (thumb, thumbIndex) {
        var isActive = thumbIndex + 1 === index;
        thumb.classList.toggle('is-active', isActive);

        if (isActive) {
          var targetLeft =
            thumb.offsetLeft -
            thumbsContainer.clientWidth / 2 +
            thumb.clientWidth / 2;

          thumbsContainer.scrollTo({
            left: targetLeft,
            behavior: 'smooth'
          });
        }
      });
    }

    function restartAutoPlay() {
      clearInterval(autoPlayTimer);

      autoPlayTimer = setInterval(function () {
        showImage(currentIndex + 1);
      }, 6000);
    }

    for (var i = 1; i <= count; i++) {
      (function (index) {
        var button = document.createElement('button');
        button.className = 'gallery-thumb';
        button.type = 'button';
        button.setAttribute('aria-label', '顯示第 ' + index + ' 張照片');

        var image = document.createElement('img');
        image.src = thumbImagePath(index);
        image.alt = '';
        image.loading = 'lazy';

        button.appendChild(image);

        button.addEventListener('click', function () {
          showImage(index);
          restartAutoPlay();
        });

        thumbsContainer.appendChild(button);
      })(i);
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        showImage(currentIndex - 1);
        restartAutoPlay();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        showImage(currentIndex + 1);
        restartAutoPlay();
      });
    }

    showImage(1);
    restartAutoPlay();
  });
})();
