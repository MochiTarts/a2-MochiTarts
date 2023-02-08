import { validateImageForm, allImages, reloadImages } from "./helpers.js";
import { displaySlide } from "./slide.js";

(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    // Toggle add image form on click
    const addImageBtn = document.querySelector(".add-image-btn");
    const formElement = document.querySelector(".add-image-form");
    addImageBtn.addEventListener("click", function () {
      formElement.classList.toggle("hidden");
    });

    // Add image to gallery on submit
    const addImageForm = document.querySelector(".add-image-form");
    addImageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const imageTitle = addImageForm.querySelector(
        'input[name="image-title"]'
      ).value;
      const authorName = addImageForm.querySelector(
        'input[name="author-name"]'
      ).value;
      const image = addImageForm.querySelector('input[name="image"]').files[0];
      // Make sure all fields are filled out
      if (validateImageForm(imageTitle, authorName, image)) {
        formElement.reset();
        formElement.classList.toggle("hidden");

        // Add image to gallery
        apiService.addImage(imageTitle, authorName, image).then((image) => {
          // Display new image
          reloadImages().then(() => {
            allImages.then((images) => {
              displaySlide(images[images.length - 1]);
            });
          });
        });
      }
    });

    allImages.then((images) => {
      //console.log(images);
      // Display first image, if any
      if (images.length > 0) {
        displaySlide(images[0]);
      }
    });
  });
})();
