import { CommentSection } from "./comment-section.js";
import { allImages, reloadImages } from "./helpers.js";

const moveSlide = (imageId) => {
  "use strict";
  allImages.then((images) => {
    const image = images.find((image) => image.id === imageId);
    displaySlide(image);
  });
};

export const displaySlide = (image) => {
  "use strict";
  // Remove current slide if it exists
  const currentSlide = document.querySelector(".slide.active");
  if (currentSlide) {
    currentSlide.remove();
  }

  // Make new active slide for image
  const newSlide = new SlideComponent(image);
  newSlide.classList.add("active");
  const slidesContainer = document.querySelector(".slides-container");
  slidesContainer.appendChild(newSlide);
};

const SlideComponent = (function () {
  "use strict";
  return function newSlide(image) {
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

    allImages.then((images) => {
      // If only one image, hide arrows
      if (images.length === 1) {
        leftArrow.style.display = "none";
        rightArrow.style.display = "none";
      }

      // If on first slide, disable left arrow
      //console.log(slide.id);
      //console.log(images[0].id);
      if (image.id === images[0].id) {
        leftArrow.disabled = true;
      } else {
        leftArrow.disabled = false;
      }
      // If on last slide, disable right arrow
      if (image.id === images[images.length - 1].id) {
        rightArrow.disabled = true;
      } else {
        rightArrow.disabled = false;
      }

      // Move slides on click
      leftArrow.addEventListener("click", (e) => {
        e.preventDefault();
        if (image.previousPostId) {
          moveSlide(image.previousPostId);
        }
      });
      rightArrow.addEventListener("click", (e) => {
        e.preventDefault();
        if (image.nextPostId) {
          moveSlide(image.nextPostId);
        }
      });

      // Add delete button listener
      const deleteBtn = slide.querySelector(".delete");
      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        apiService.deleteImage(image.id).then((deletedImage) => {
          reloadImages().then(() => {
            if (images.length === 1) {
              // If only one image, remove slide and reload images
              slide.remove();
            } else {
              if (image.nextPostId) {
                moveSlide(image.nextPostId);
              } else {
                // Move to first image if on last image
                moveSlide(images[0].id);
              }
            }
          });
        });
      });
    });

    return slide;
  };
})();

export { SlideComponent };
