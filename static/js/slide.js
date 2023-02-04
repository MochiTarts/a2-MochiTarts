import { CommentSection } from "./comment-section.js";

const getCurrentSlide = () => {
  "use strict";
  return document.querySelector(".slide.active");
};

const moveSlide = (i) => {
  "use strict";
  const currentImage = getCurrentSlide();
  const allImages = apiService.getImages();
  // Get index of current image in allImages given the imageId
  const currentImageIndex = allImages.findIndex(
    (obj) => obj.imageId === currentImage.id
  );
  displaySlide(parseInt(currentImageIndex) + i);
};

export const displaySlide = (i) => {
  "use strict";
  // Remove current slide if it exists
  const currentSlide = document.querySelector(".slide.active");
  if (currentSlide) {
    currentSlide.remove();
  }

  // Make new active slide for image at index i
  const image = apiService.getImages()[i];
  const newSlide = new SlideComponent(
    image.imageId,
    image.title,
    image.author,
    image.url,
    image.date
  );
  newSlide.classList.add("active");
  const slidesContainer = document.querySelector(".slides-container");
  slidesContainer.appendChild(newSlide);
};

const SlideComponent = (function () {
  "use strict";
  return function newSlide(imageId, title, author, url, date) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = imageId;
    slide.innerHTML = `
      <div class="title-container">
        <span class="title">${title}</span>
        <span class="author">${author}</span>
      </div>
      <div class="content-container row">
        <div class="image-frame col-md-12 col-9">
          <img class="image" src=${url} loading="lazy" />
          <img src="../media/xmark.svg" alt="xmark" class="delete" />
          <button class="left-arrow">
            <img src="../media/angle-left.svg" alt="left arrow" class="angle-left" />
          </button>
          <button class="right-arrow">
            <img src="../media/angle-right.svg" alt="right arrow" class="angle-right" />
          </button>
        </div>
      </div>`;

    // Add comment section to image
    const commentSection = new CommentSection(imageId);
    slide.querySelector(".content-container").appendChild(commentSection);

    const leftArrow = slide.querySelector(".left-arrow");
    const rightArrow = slide.querySelector(".right-arrow");

    const allImages = apiService.getImages();

    // If only one image, hide arrows
    if (allImages.length === 1) {
      leftArrow.style.display = "none";
      rightArrow.style.display = "none";
    }

    // If on first slide, disable left arrow
    if (slide.id === allImages[0].imageId) {
      leftArrow.disabled = true;
    } else {
      leftArrow.disabled = false;
    }
    // If on last slide, disable right arrow
    if (slide.id === allImages[allImages.length - 1].imageId) {
      rightArrow.disabled = true;
    } else {
      rightArrow.disabled = false;
    }

    // Move slides on click
    leftArrow.addEventListener("click", (e) => {
      e.preventDefault();
      moveSlide(-1);
    });
    rightArrow.addEventListener("click", (e) => {
      e.preventDefault();
      moveSlide(1);
    });

    // Add delete button listener
    const deleteBtn = slide.querySelector(".delete");
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const allImages = apiService.getImages();
      const slidesContainer = document.querySelector(".slides-container");
      const currentImage = getCurrentSlide();
      const currentImageIndex = allImages.findIndex(
        (obj) => obj.imageId === currentImage.id
      );
      // Delete image from local storage. Which shifts all images after it to the left so currentImageIndex becomes the index of the next image
      apiService.deleteImage(imageId);
      // If current image is only image, remove slide
      if (allImages.length === 1) {
        slidesContainer.removeChild(currentImage);
      } else {
        // If current image was the last image, move to first image. Otherwise, move to next image
        if (currentImageIndex === allImages.length - 1) {
          displaySlide(0);
        } else {
          displaySlide(parseInt(currentImageIndex));
        }
      }
    });

    return slide;
  };
})();

export { SlideComponent };
