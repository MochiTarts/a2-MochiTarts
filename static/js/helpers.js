// Date options for formatting date
export const dateOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
};

export const validateImageForm = (title, author, url) => {
  "use strict";
  // Check if all fields are filled out
  if (!title || !author || !url) {
    alert("Please fill out all fields");
    return false;
  }

  // Make sure no script tags are in inputs
  const scriptRegex = /<script>/gi;
  if (
    scriptRegex.test(title) ||
    scriptRegex.test(author) ||
    scriptRegex.test(url)
  ) {
    alert("Please do not use script tags");
    return false;
  }

  // Check if title is valid (alphanumeric and may contain spaces)
  const titleAuthorRegex = /^[a-zA-Z0-9\s]+$/i;
  if (!titleAuthorRegex.test(title)) {
    alert("Please enter a valid title");
    return false;
  }
  // Check if author is valid (alphanumeric and spaces)
  const authorRegex = /^[a-zA-Z0-9\s]+$/i;
  if (!authorRegex.test(author)) {
    alert("Please enter a valid author");
    return false;
  }
  // Check if url is valid
  const urlRegex =
    /^[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/gi;
  if (!urlRegex.test(url)) {
    alert("Please enter a valid image url");
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

  // Make sure name is valid (alphanumeric and spaces)
  const nameRegex = /^[a-zA-Z0-9\s]+$/i;
  if (!nameRegex.test(name)) {
    alert("Please enter a valid name");
    return false;
  }
  return true;
};
