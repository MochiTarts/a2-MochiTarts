let apiService = (function () {
  let module = {};

  // Image store
  let imageStore = JSON.parse(localStorage.getItem("images")) || [];

  // Comment store
  let commentStore = JSON.parse(localStorage.getItem("comments")) || [];

  /*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) imageId 
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date
  */

  // add an image to the gallery
  module.addImage = function (title, author, imageFile) {
    // If any errors, return error message
    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("picture", imageFile);
    return fetch("/api/post", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .catch((err) => alert(err));
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId) {
    return fetch(`/api/posts/${imageId}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  // get all images (or a subset). By default, these parameters are set to get the first image (most recent)
  module.getImages = function (startId = null, limit = 1) {
    return fetch(`/api/posts?limit=${limit}&startId=${startId}`, {
      method: "GET",
    }).then((res) => res.json());
  };

  // given uri, get image
  module.getImageByUri = function (uri) {
    return fetch(uri, {
      method: "GET",
    }).then((res) => res.json());
  };

  // add a comment to an image
  module.addComment = function (imageId, author, content) {
    return fetch(`/api/posts/${imageId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author,
        content,
      }),
    })
      .then((res) => res.json())
      .catch((err) => alert(err));
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    return fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .catch((err) => alert(err));
  };

  // get all comments for an image (or a subset). by default, the parameters are set to get the 10 most recent comments
  module.getComments = function (imageId, startId = null, limit = 10) {
    return fetch(
      `/api/posts/${imageId}/comments?limit=${limit}&startId=${startId}`,
      {
        method: "GET",
      }
    ).then((res) => res.json());
  };

  // given uri, get comments
  module.getCommentsByUri = function (uri) {
    return fetch(uri, {
      method: "GET",
    }).then((res) => res.json());
  };

  return module;
})();
