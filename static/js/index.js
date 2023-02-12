import { validateImageForm } from "./helpers.js";
import { displaySlide } from "./slide.js";

(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    // Toggle add image form on click
    const addImageBtn = document.querySelector(".add-image-btn");
    const formElement = document.querySelector(".add-image-form");
    addImageBtn.addEventListener("click", function () {
      formElement.classList.toggle("hidden");
      // If any error messages are showing, hide them
      const errorElements = document.querySelectorAll(".error-message");
      errorElements.forEach((errorElement) => {
        errorElement.innerText = "";
      });
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
        // Add image to gallery
        apiService.addImage(imageTitle, authorName, image).then((res) => {
          if (res.error) {
            // Display error message(s)
            const errorElements = document.querySelectorAll(".error-message");
            errorElements.forEach((errorElement) => {
              const inputName = errorElement.id.split("-")[0];
              if (res.error[inputName]) {
                errorElement.innerText = res.error[inputName];
              } else {
                errorElement.innerText = "";
              }
            });
          } else {
            formElement.classList.toggle("hidden");
            // Display new image (new image is always first in array)
            apiService.getImages().then((res) => {
              if (res.results.length > 0) {
                displaySlide(res.results[0], res.prevLink, res.nextLink);
              }
            });
          }
        });
      }
    });

    apiService.getImages().then((res) => {
      // Display first image, if any
      if (res.results.length > 0) {
        displaySlide(res.results[0], res.prevLink, res.nextLink);
      }
    });
  });
})();
