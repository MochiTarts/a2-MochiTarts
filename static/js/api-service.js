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
  module.addImage = function (title, author, url) {
    // add image to imageStore and store in localStorage
    const image = {
      imageId: imageStore.length.toString(),
      title: title,
      author: author,
      url: url,
      date: new Date(),
    };
    imageStore.push(image);
    localStorage.setItem("images", JSON.stringify(imageStore));
    return image.imageId;
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId) {
    // delete image from imageStore and store in localStorage, and all comments associated with the image
    imageStore = imageStore.filter((image) => image.imageId !== imageId);
    localStorage.setItem("images", JSON.stringify(imageStore));
    commentStore = commentStore.filter(
      (comment) => comment.imageId !== imageId
    );
    localStorage.setItem("comments", JSON.stringify(commentStore));
  };

  // get all images
  module.getImages = function () {
    // get images from localStorage
    const images = JSON.parse(localStorage.getItem("images")) || [];
    return images;
  };

  // add a comment to an image
  module.addComment = function (imageId, author, content) {
    //console.log(imageId, author, content);
    // add comment to commentStore and store in localStorage (new comments are added to the front of the array)
    const comment = {
      commentId: commentStore.length.toString(),
      imageId: imageId,
      author: author,
      content: content,
      date: new Date(),
    };
    commentStore.unshift(comment);
    localStorage.setItem("comments", JSON.stringify(commentStore));
    return comment.commentId;
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    // delete comment from commentStore and store in localStorage
    commentStore = commentStore.filter(
      (comment) => comment.commentId !== commentId
    );
    localStorage.setItem("comments", JSON.stringify(commentStore));
  };

  // get all comments for an image
  module.getComments = function (imageId) {
    // get comments from localStorage
    const comments = JSON.parse(localStorage.getItem("comments")) || [];
    return comments.filter((comment) => comment.imageId === imageId);
  };

  // get comments for an image given page number and number of comments per page
  module.getCommentsByPage = function (imageId, page, numComments) {
    // get comments from localStorage
    const comments = JSON.parse(localStorage.getItem("comments")) || [];
    const commentsForImage = comments.filter(
      (comment) => comment.imageId === imageId
    );
    const startIndex = (page - 1) * numComments;
    const endIndex = startIndex + numComments;
    return commentsForImage.slice(startIndex, endIndex);
  };

  // get all comments
  module.getAllComments = function () {
    // get comments from localStorage
    const comments = JSON.parse(localStorage.getItem("comments")) || [];
    return comments;
  };

  return module;
})();