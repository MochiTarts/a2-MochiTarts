import { validateImageForm } from "./helpers.js";
import { displaySlide } from "./slide.js";

(function () {
  "use strict";
  const allImages = apiService.getImages();
  document.addEventListener("DOMContentLoaded", () => {
    // Display first image, if any
    if (allImages.length > 0) {
      displaySlide(0);
    }

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
      const imageUrl = addImageForm.querySelector(
        'input[name="image-url"]'
      ).value;
      // Make sure all fields are filled out
      if (validateImageForm(imageTitle, authorName, imageUrl)) {
        formElement.reset();
        formElement.classList.toggle("hidden");
        //alert("Adding image to gallery!");

        // Add image to gallery
        apiService.addImage(imageTitle, authorName, imageUrl);
        const newTotalImages = apiService.getImages().length;
        displaySlide(newTotalImages - 1);
      }
    });
  });
})();
