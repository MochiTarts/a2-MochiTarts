import { validateCommentForm, dateOptions } from "./helpers.js";

const movePage = (e) => {
  "use strict";
  e.preventDefault();
  const commentSection = e.target.closest(".comment-section");
  const commentsUri = e.target.dataset.uri;
  apiService.getCommentsByUri(commentsUri).then((res) => {
    loadComments(commentSection, res.results, res.prevLink, res.nextLink);
  });
};

const addNewComment = async (commentSection, imageId) => {
  "use strict";
  const nameInput = commentSection.querySelector("input[name='name']").value;
  const commentInput = commentSection.querySelector(
    "input[name='comment']"
  ).value;
  if (validateCommentForm(nameInput, commentInput)) {
    apiService.addComment(imageId, nameInput, commentInput).then((res) => {
      if (res.error) {
        // Display error message(s)
        const errorElements = commentSection.querySelectorAll(".error-message");
        errorElements.forEach((errorElement) => {
          const inputName = errorElement.id.split("-")[0];
          if (res.error[inputName]) {
            errorElement.innerText = res.error[inputName];
          } else {
            errorElement.innerText = "";
          }
        });
      } else {
        apiService.getComments(imageId).then((res) => {
          loadComments(commentSection, res.results, res.prevLink, res.nextLink);
        });
      }
    });
  }
};

const deleteAComment = (commentSection, comment, prev, next) => {
  "use strict";
  const topCommentId = parseInt(commentSection.querySelector(".comment").id);
  const totalCommentsOnPage =
    commentSection.querySelectorAll(".comment").length;
  apiService.deleteComment(comment.id).then((res) => {
    if (res.error) {
      alert(
        "Sorry, there was an error deleting this comment. Please try again later."
      );
    } else {
      if (comment.id === topCommentId && totalCommentsOnPage === 1 && prev) {
        apiService.getCommentsByUri(prev).then((res) => {
          loadComments(commentSection, res.results, res.prevLink, res.nextLink);
        });
      } else {
        if (comment.id === topCommentId) {
          apiService
            .getComments(comment.PostId, topCommentId - 1)
            .then((res) => {
              loadComments(
                commentSection,
                res.results,
                res.prevLink,
                res.nextLink
              );
            });
        } else {
          apiService.getComments(comment.PostId, topCommentId).then((res) => {
            loadComments(
              commentSection,
              res.results,
              res.prevLink,
              res.nextLink
            );
          });
        }
      }
    }
  });
};

const loadComments = (commentSection, comments, prev, next) => {
  "use strict";
  // Hide any error messages (from previous submit)
  const errorElements = commentSection.querySelectorAll(".error-message");
  errorElements.forEach((errorElement) => {
    errorElement.innerText = "";
  });
  // If page exists, remove it
  let page = commentSection.querySelector(".page");
  if (page) page.remove();

  const prevBtn = commentSection.querySelector(".previous");
  const nextBtn = commentSection.querySelector(".next");
  if (!prev && !next) {
    const paginationElmt = commentSection.querySelector(".pagination");
    paginationElmt.classList.add("hidden");
  } else {
    const paginationElmt = commentSection.querySelector(".pagination");
    paginationElmt.classList.remove("hidden");
  }

  // Show or hide the no comments message
  const noCommentsElmt = commentSection.querySelector(".no-comments");
  if (comments.length === 0) {
    noCommentsElmt.classList.remove("hidden");
  } else {
    noCommentsElmt.classList.add("hidden");
    // Create a fresh new page
    page = document.createElement("div");
    page.className = "page";
    commentSection.querySelector(".wrapper").append(page);

    // Remove any existing event listeners. Prevents multiple event listeners from being added
    prevBtn.removeEventListener("click", movePage);
    nextBtn.removeEventListener("click", movePage);
    prevBtn.dataset.uri = prev;
    nextBtn.dataset.uri = next;

    if (prev) {
      prevBtn.disabled = false;
      prevBtn.addEventListener("click", movePage);
    } else {
      prevBtn.disabled = true;
    }
    if (next) {
      nextBtn.disabled = false;
      nextBtn.addEventListener("click", movePage);
    } else {
      nextBtn.disabled = true;
    }

    // Add comments to the page
    comments.forEach((comment) => {
      const commentElmt = Comment(commentSection, comment, prev, next);
      page.appendChild(commentElmt);
    });
  }
};

const Comment = (function () {
  "use strict";
  return function newComment(commentSection, comment, prev, next) {
    const commentElmt = document.createElement("div");
    commentElmt.className = "comment";
    commentElmt.id = comment.id;
    comment.createdAt = new Date(comment.createdAt).toLocaleDateString(
      "en-US",
      dateOptions
    );
    commentElmt.innerHTML = `
      <div class="author-comment">${comment.User.name}</div>
      <div class="date-comment">${comment.createdAt}</div>
      <div class="content">${comment.content}</div>
      <img src="../media/trash.svg" alt="trash" class="delete" />`;

    // Add delete button event listener to each comment
    const deleteBtn = commentElmt.querySelector(".delete");
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      deleteAComment(commentSection, comment, prev, next);
    });

    return commentElmt;
  };
})();

const CommentSection = (function () {
  "use strict";
  return function newCommentSection(imageId) {
    // Make the comment section
    const commentSection = document.createElement("div");
    commentSection.className = "comment-section col-md-12 col-3";
    commentSection.innerHTML = `
      <div class="wrapper">
        <form class="comment-form">
          <input type="text" name="name" placeholder="Your name..." required/>
          <div class="error-message hidden" id="author-error-message"></div>
          <input type="text" name="comment" placeholder="Add a comment..." required/>
          <div class="error-message hidden" id="content-error-message"></div>
          <input type="submit" hidden />
        </form>
        <div class="pagination">
          <button class="previous">Previous</button>
          <button class="next">Next</button>
        </div>
        <div class="no-comments">No comments yet!</div>
      </div>`;

    apiService.getComments(imageId).then((res) => {
      loadComments(commentSection, res.results, res.prevLink, res.nextLink);
    });

    // Add comment form submit listener
    const commentForm = commentSection.querySelector(".comment-form");
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addNewComment(commentSection, imageId).then(() => {
        commentForm.reset();
      });
    });

    return commentSection;
  };
})();

export { CommentSection };
