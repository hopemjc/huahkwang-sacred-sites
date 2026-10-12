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
  var changeSerial = 0;
  var fadingOverlay = null;

  // ===== 菩提伽耶 Lightbox：點擊主圖放大 =====
  var lightbox = document.getElementById('bodhgaya-lightbox');

  if (lightbox && gallery.contains(trio)) {
    var lightboxImage = lightbox.querySelector('.lightbox-image');
    var lightboxNumber = lightbox.querySelector('.lightbox-number');
    var lightboxCaption = lightbox.querySelector('.lightbox-caption');

    trioImages.forEach(function (image) {
      image.style.cursor = 'zoom-in';

      image.addEventListener('click', function () {
        var index = Number(image.dataset.galleryImage);
        if (!index) return;
        lightboxCurrentIndex = index;
        var captionData = window.bodhgayaGallery
          ? window.bodhgayaGallery[index]
          : null;

        lightboxImage.src = fullImagePath(index);
        lightboxImage.alt = image.alt;
        lightboxNumber.textContent =
          imageNumber(index) + ' / ' + imageNumber(count);
        lightboxCaption.textContent =
          captionData ? captionData.caption : '';

        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        clearInterval(autoPlayTimer);
      });
    });
  }

  // ===== Lightbox 左右切換功能 =====
  if (lightbox) {
    var lightboxPrev = lightbox.querySelector('.lightbox-prev');
    var lightboxNext = lightbox.querySelector('.lightbox-next');
    var lightboxCurrentIndex = 1;

    function showLightboxImage(index) {
      index = normalizeIndex(index);
      lightboxCurrentIndex = index;

      var captionData = window.bodhgayaGallery
        ? window.bodhgayaGallery[index]
        : null;

      lightboxImage.src = fullImagePath(index);
      lightboxImage.alt = '菩提伽耶照片 ' + index;

      lightboxNumber.textContent =
        imageNumber(index) + ' / ' + imageNumber(count);

      lightboxCaption.textContent =
        captionData ? captionData.caption : '';
    }

    lightboxPrev.addEventListener('click', function () {
      showLightboxImage(lightboxCurrentIndex - 1);
    });

    lightboxNext.addEventListener('click', function () {
      showLightboxImage(lightboxCurrentIndex + 1);
    });

    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;

      if (event.key === 'ArrowLeft') {
        showLightboxImage(lightboxCurrentIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        showLightboxImage(lightboxCurrentIndex + 1);
      }
    });
  }

  // ===== Lightbox 關閉功能 =====
  if (lightbox) {
    var closeLightboxButton = lightbox.querySelector('.lightbox-close');

    
function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';

    // 從放大視窗最後觀看的照片繼續輪播
    showGroup(lightboxCurrentIndex);

    // 重新開始原本的 6 秒自動輪播
    restartAutoPlay();
  }


    if (closeLightboxButton) {
      closeLightboxButton.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox ||
          event.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!lightbox.hidden && event.key === 'Escape') {
        closeLightbox();
      }
    });
  }

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


function showGroup(startIndex, scrollOnMobile) {
  startIndex = normalizeIndex(startIndex);
  currentStart = startIndex;

  // 避免快速切換時，較早的載入結果覆蓋新結果
  var serial = ++changeSerial;

  // 移除上一次尚未淡出完畢的覆蓋層
  if (fadingOverlay) {
    fadingOverlay.remove();
    fadingOverlay = null;
  }

  var indexes = [0, 1, 2].map(function (position) {
    return normalizeIndex(startIndex + position);
  });

  // 先載入下一組照片，再開始切換
  var preloadTasks = indexes.map(function (index) {
    return new Promise(function (resolve) {
      var preloader = new Image();
      preloader.onload = resolve;
      preloader.onerror = resolve;
      preloader.src = fullImagePath(index);

      if (preloader.complete) resolve();
    });
  });

  Promise.all(preloadTasks).then(function () {
    if (serial !== changeSerial) return;

    var main = gallery.querySelector('.gallery-main');
    var oldLayer = null;

    // 首次載入不需要轉場
    if (trio.dataset.galleryReady === 'true' && main) {
      oldLayer = trio.cloneNode(true);
      oldLayer.classList.remove('is-changing');
      oldLayer.classList.add('gallery-crossfade-old');
      oldLayer.setAttribute('aria-hidden', 'true');

      main.appendChild(oldLayer);
      fadingOverlay = oldLayer;
    }

    // 更新底層三張照片
    trioImages.forEach(function (image, position) {
      var imageIndex = indexes[position];
      var imagePath = fullImagePath(imageIndex);

      image.src = imagePath;
      image.alt = '菩提伽耶照片 ' + imageIndex;
      image.dataset.galleryImage = imageIndex;

      var photo = image.closest('.gallery-photo');
      if (!photo) return;

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

    // 更新縮圖選取狀態
    var thumbs = gallery.querySelectorAll('.gallery-thumb');

    thumbs.forEach(function (thumb, thumbIndex) {
      var imageIndex = thumbIndex + 1;
      var isActive = indexes.indexOf(imageIndex) !== -1;
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

    trio.dataset.galleryReady = 'true';

    // 舊照片慢慢消失，露出已載入的新照片
    if (oldLayer) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (serial !== changeSerial) return;
          oldLayer.style.opacity = '0';
        });
      });

      oldLayer.addEventListener('transitionend', function (event) {
        if (event.target !== oldLayer || event.propertyName !== 'opacity') {
          return;
        }

        oldLayer.remove();

        if (fadingOverlay === oldLayer) {
          fadingOverlay = null;
        }
      }, { once: true });

    }

    // 手機版：僅在手動切換照片後調整垂直捲動
    if (scrollOnMobile &&
        gallery.closest('#photo-gallery') &&
        window.matchMedia('(max-width: 560px)').matches) {

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (serial !== changeSerial) return;

          var thumbRect = thumbsContainer.getBoundingClientRect();
          var header = document.querySelector('.site-header');
          var headerBottom = header
            ? header.getBoundingClientRect().bottom
            : 0;

          var lowerLimit = window.innerHeight - 8;
          var upperLimit = headerBottom + 8;
          var adjustment = 0;

          if (thumbRect.bottom > lowerLimit) {
            // 縮圖列超出畫面下方：往下捲動
            adjustment = thumbRect.bottom - lowerLimit;
          } else if (thumbRect.top < upperLimit) {
            // 縮圖列跑到導覽列上方：往上捲動
            adjustment = thumbRect.top - upperLimit;
          }

          if (adjustment !== 0) {
            window.scrollBy({
              top: adjustment,
              behavior: 'smooth'
            });
          }
        });
      });
    }
  });
}


  function galleryStep() {

    return window.matchMedia('(max-width: 560px)').matches ? 1 : 3;
  }


  // ===== 桌機、手機：照片集可見時才自動輪播 =====

  function isGalleryVisible() {
    if (document.hidden) return false;
    if (lightbox && !lightbox.hidden) return false;

    var main = gallery.querySelector('.gallery-main');
    if (!main) return false;

    var rect = main.getBoundingClientRect();
    var visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) -
      Math.max(rect.top, 0)
    );

    return visibleHeight >= Math.min(120, window.innerHeight * 0.2);
  }

  function restartAutoPlay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;

    if (!isGalleryVisible()) return;

    autoPlayTimer = setInterval(function () {
      if (!isGalleryVisible()) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        return;
      }

      showGroup(currentStart + galleryStep());
    }, 6000);
  }

  var galleryWasVisible = false;
  var visibilityCheckPending = false;

  function updateGalleryVisibility() {
    if (visibilityCheckPending) return;
    visibilityCheckPending = true;

    requestAnimationFrame(function () {
      visibilityCheckPending = false;

      var visible = isGalleryVisible();

      if (visible !== galleryWasVisible) {
        galleryWasVisible = visible;
        restartAutoPlay();
      }
    });
  }

  window.addEventListener('scroll', updateGalleryVisibility, {
    passive: true
  });

  window.addEventListener('resize', updateGalleryVisibility);

  document.addEventListener(
    'visibilitychange',
    updateGalleryVisibility
  );

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
          showGroup(index, true);
        } else {
          var groupStart = Math.floor((index - 1) / 3) * 3 + 1;
          showGroup(groupStart, true);
        }
        restartAutoPlay();
      });

      thumbsContainer.appendChild(button);
    })(i);
  }

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      showGroup(currentStart - galleryStep(), true);
      restartAutoPlay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      showGroup(currentStart + galleryStep(), true);
      restartAutoPlay();
    });
  }



  // 菩提伽耶：照片導覽重新從第一張播放
  var photoGuideLink = document.querySelector(
    'a[href="#gallery-photo-start"]'
  );

  if (photoGuideLink && gallery.closest('#photo-gallery')) {
    photoGuideLink.addEventListener('click', function () {
      showGroup(1);
      restartAutoPlay();
    });
  }

  showGroup(1);
  restartAutoPlay();
  updateGalleryVisibility();

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