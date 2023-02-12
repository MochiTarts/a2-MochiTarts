import { CommentSection } from "./comment-section.js";

const moveSlide = (imageUri) => {
  "use strict";
  apiService.getImageByUri(imageUri).then((res) => {
    const image = res.results[0];
    const prev = res.prevLink;
    const next = res.nextLink;
    displaySlide(image, prev, next);
  });
};

export const displaySlide = (image, prev, next) => {
  "use strict";
  // Remove current slide if it exists
  const currentSlide = document.querySelector(".slide.active");
  if (currentSlide) {
    currentSlide.remove();
  }

  // Make new active slide for image
  const newSlide = new SlideComponent(image, prev, next);
  newSlide.classList.add("active");
  const slidesContainer = document.querySelector(".slides-container");
  slidesContainer.appendChild(newSlide);
};

const SlideComponent = (function () {
  "use strict";
  return function newSlide(image, prev, next) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = image.id;
    slide.innerHTML = `
      <div class="title-container">
        <span class="title">${image.title}</span>
        <span class="author">${image.User.name}</span>
      </div>
      <div class="content-container row">
        <div class="image-frame col-md-12 col-9">
          <img class="image" src="/api/posts/${image.id}/picture" loading="lazy" />
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
    const commentSection = new CommentSection(image.id);
    slide.querySelector(".content-container").appendChild(commentSection);

    const leftArrow = slide.querySelector(".left-arrow");
    const rightArrow = slide.querySelector(".right-arrow");

    // If only one image, hide arrows
    if (prev === null && next === null) {
      leftArrow.classList.add("hidden");
      rightArrow.classList.add("hidden");
    }

    // If on first slide, disable left arrow
    if (prev === null) {
      leftArrow.disabled = true;
    } else {
      leftArrow.disabled = false;
    }
    // If on last slide, disable right arrow
    if (next === null) {
      rightArrow.disabled = true;
    } else {
      rightArrow.disabled = false;
    }

    // Move slides on click
    leftArrow.addEventListener("click", (e) => {
      e.preventDefault();
      if (prev) {
        moveSlide(prev);
      }
    });
    rightArrow.addEventListener("click", (e) => {
      e.preventDefault();
      if (next) {
        moveSlide(next);
      }
    });

    // Add delete button listener
    const deleteBtn = slide.querySelector(".delete");
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      apiService.deleteImage(image.id).then((deletedImage) => {
        if (prev === null && next === null) {
          // If only one image, remove slide
          slide.remove();
        } else {
          // If not on last slide, move to next slide
          if (next) {
            moveSlide(next);
          } else {
            // If on last slide, move to first slide
            apiService.getImages().then((res) => {
              displaySlide(res.results[0], res.prevLink, res.nextLink);
            });
          }
        }
      });
    });

    return slide;
  };
})();

export { SlideComponent };
