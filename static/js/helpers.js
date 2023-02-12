// Date options for formatting date
export const dateOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
};

export const validateImageForm = (title, author, image) => {
  "use strict";
  // Check if all fields are filled out
  if (!title || !author || !image) {
    alert("Please fill out all fields");
    return false;
  }

  // Make sure no script tags are in inputs
  const scriptRegex = /<script>/gi;
  if (scriptRegex.test(title) || scriptRegex.test(author)) {
    alert("Please do not use script tags");
    return false;
  }

  // Check if title is valid (alphanumeric, space, bracket, punctuation, and dash)
  const titleAuthorRegex = /^[a-zA-Z0-9\s.,?!-()]+$/i;
  if (!titleAuthorRegex.test(title)) {
    alert("Title cannot contain special characters");
    return false;
  }
  // Check if author is valid (alphanumeric, space, bracket, punctuation, and dash)
  const authorRegex = /^[a-zA-Z0-9\s.,?!-()]+$/i;
  if (!authorRegex.test(author)) {
    alert("Name cannot contain special characters");
    return false;
  }
  return true;
};

export const validateCommentForm = (name, comment) => {
  "use strict";
  // Check if all fields are filled out
  if (!name || !comment) {
    alert("Please fill out all fields");
    return false;
  }

  // Make sure no script tags are in inputs
  const scriptRegex = /<script>/i;
  if (scriptRegex.test(name) || scriptRegex.test(comment)) {
    alert("Please do not use script tags");
    return false;
  }

  // Make sure name is valid (alphanumeric, space, bracket, punctuation, and dash)
  const nameRegex = /^[a-zA-Z0-9\s.,?!-()]+$/;
  if (!nameRegex.test(name)) {
    alert("Name cannot contain special characters");
    return false;
  }
  return true;
};
