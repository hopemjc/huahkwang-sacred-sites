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

  var trio = gallery.querySelector('[data-gallery-trio]');
  var trioImages = gallery.querySelectorAll('.gallery-trio-image');
  var thumbsContainer = gallery.querySelector('[data-gallery-thumbs]');
  var prevButton = gallery.querySelector('.gallery-prev');
  var nextButton = gallery.querySelector('.gallery-next');

  if (!count || !path || !prefix || !trio || trioImages.length !== 3 || !thumbsContainer) {
    return;
  }

  var currentStart = 1;
  var autoPlayTimer;

  function imageNumber(index) {
    return String(index).padStart(2, '0');
  }

  function fullImagePath(index) {
    return path + '/full/' + prefix + '-' + imageNumber(index) + '.jpeg';
  }

  function thumbImagePath(index) {
    return path + '/thumbs/' + prefix + '-' + imageNumber(index) + '.jpeg';
  }

  function normalizeIndex(index) {
    while (index < 1) {
      index += count;
    }

    while (index > count) {
      index -= count;
    }

    return index;
  }

function showGroup(startIndex) {
  startIndex = normalizeIndex(startIndex);
  currentStart = startIndex;

  trio.classList.add('is-changing');

  setTimeout(function () {
  trioImages.forEach(function (image, position) {
      var imageIndex = normalizeIndex(startIndex + position);
      var imagePath = fullImagePath(imageIndex);

      image.src = imagePath;
      image.alt = '菩提迦耶照片 ' + imageIndex;
      image.dataset.galleryImage = imageIndex;

      var photo = image.closest('.gallery-photo');

      if (!photo) {
        return;
      }

      var frame = image.closest('.gallery-image-frame');

      if (frame) {
        frame.style.setProperty(
        '--gallery-bg',
        'url("' + new URL(imagePath, document.baseURI).href + '")'
      );
      }

      var caption = photo.querySelector('.gallery-photo-caption');
      var number = photo.querySelector('.gallery-photo-number');

      var captionData = window.bodhgayaGallery
        ? window.bodhgayaGallery[imageIndex]
        : null;

      if (caption) {
        caption.textContent = captionData ? captionData.caption : '';

        requestAnimationFrame(function () {
          var range = document.createRange();
          range.selectNodeContents(caption);

          var textHeight = range.getBoundingClientRect().height;
          var lineHeight = parseFloat(getComputedStyle(caption).lineHeight);
          var isMultiLine = textHeight > lineHeight * 1.5;

          caption.classList.toggle('is-multiline', isMultiLine);
        });
      }

      if (number) {
        number.textContent =
          imageNumber(imageIndex) + ' / ' + imageNumber(count);
      }
    });

    var visibleIndexes = [
      normalizeIndex(startIndex),
      normalizeIndex(startIndex + 1),
      normalizeIndex(startIndex + 2)
    ];

    var thumbs = gallery.querySelectorAll('.gallery-thumb');

    thumbs.forEach(function (thumb, thumbIndex) {
      var imageIndex = thumbIndex + 1;
      var isActive = visibleIndexes.indexOf(imageIndex) !== -1;

      thumb.classList.toggle('is-active', isActive);
    });

    var firstActiveThumb = thumbs[startIndex - 1];

    if (firstActiveThumb) {
      var targetLeft =
        firstActiveThumb.offsetLeft -
        thumbsContainer.clientWidth / 2 +
        firstActiveThumb.clientWidth / 2;

      thumbsContainer.scrollTo({
        left: targetLeft,
        behavior: 'smooth'
      });
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        trio.classList.remove('is-changing');
      }); 
    });
  }, 800);
}

  function galleryStep() {
    return window.matchMedia('(max-width: 560px)').matches ? 1 : 3;
  }

  function restartAutoPlay() {
    clearInterval(autoPlayTimer);

    autoPlayTimer = setInterval(function () {
    showGroup(currentStart + galleryStep());
}, 6000);
  }

  for (var i = 1; i <= count; i++) {
    (function (index) {
      var button = document.createElement('button');
      button.className = 'gallery-thumb';
      button.type = 'button';
      button.setAttribute('aria-label', '顯示包含第 ' + index + ' 張照片的組合');

      var image = document.createElement('img');
      image.src = thumbImagePath(index);
      image.alt = '';
      image.loading = 'lazy';

      button.appendChild(image);

      button.addEventListener('click', function () {
        if (galleryStep() === 1) {
          showGroup(index);
        } else {
          var groupStart = Math.floor((index - 1) / 3) * 3 + 1;
          showGroup(groupStart);
        }
        restartAutoPlay();
      });

      thumbsContainer.appendChild(button);
    })(i);
  }

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      showGroup(currentStart - galleryStep());
      restartAutoPlay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      showGroup(currentStart + galleryStep());
      restartAutoPlay();
    });
  }

  showGroup(1);
  restartAutoPlay();
});
})();

/* ===== 文章展開／收合 ===== */

document.querySelectorAll('.article-expand').forEach(function (button) {
  button.addEventListener('click', function () {
    var targetId = button.getAttribute('aria-controls');
    var content = document.getElementById(targetId);

    if (!content) return;

    var isExpanded = button.getAttribute('aria-expanded') === 'true';

    content.classList.toggle('is-expanded', !isExpanded);
    button.setAttribute('aria-expanded', String(!isExpanded));
    button.textContent = isExpanded ? '閱讀完整介紹' : '收起完整介紹';
  });
});