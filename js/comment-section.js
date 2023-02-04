import { validateCommentForm, dateOptions } from "./helpers.js";

const getCurrentPage = (commentSection) => {
  "use strict";
  return commentSection.querySelector(".page.active");
};

const movePage = (commentSection, i) => {
  "use strict";
  const currentPage = getCurrentPage(commentSection);
  const pages = commentSection.querySelectorAll(".page");
  const currentPageIndex = Array.from(pages).indexOf(currentPage);

  displayPage(commentSection, parseInt(currentPageIndex) + i);
};

const displayPage = (commentSection, i) => {
  "use strict";
  const pages = commentSection.querySelectorAll(".page");
  const currentPage = getCurrentPage(commentSection);
  currentPage.classList.remove("active");
  pages[i].classList.add("active");

  const previousBtn = commentSection.querySelector(".previous");
  const nextBtn = commentSection.querySelector(".next");

  // Disable previous button if on first page
  const udpatedCurrentPage = getCurrentPage(commentSection);

  if (udpatedCurrentPage === pages[0]) {
    previousBtn.disabled = true;
  } else {
    previousBtn.disabled = false;
  }
  // Disable next button if on last page
  if (udpatedCurrentPage === pages[pages.length - 1]) {
    nextBtn.disabled = true;
  } else {
    nextBtn.disabled = false;
  }
};

const addNewComment = (commentSection, imageId) => {
  "use strict";
  const nameInput = commentSection.querySelector("input[name='name']").value;
  const commentInput = commentSection.querySelector(
    "input[name='comment']"
  ).value;
  if (validateCommentForm(nameInput, commentInput)) {
    const commentId = apiService.addComment(imageId, nameInput, commentInput);

    reloadComments(commentSection, imageId);
    //alert("Comment added!");
  }
};

const deleteAComment = (commentSection, commentId, imageId) => {
  "use strict";
  apiService.deleteComment(commentId);
  reloadComments(commentSection, imageId);
  //alert("Comment deleted!");
};

const reloadComments = (commentSection, imageId) => {
  "use strict";
  // Check for existing pages. Grab current comment count and calculate new page total.
  const pages = commentSection.querySelectorAll(".page") || [];
  const comments = apiService.getComments(imageId);
  const newPageTotal = Math.ceil(comments.length / 10);

  // Show or hide no comments message depending on if there are comments
  if (comments.length !== 0) {
    commentSection.querySelector(".no-comments").style.display = "none";
  } else {
    commentSection.querySelector(".no-comments").style.display = "block";
  }

  // Don't add or remove pages if the number of pages didn't change
  if (pages.length < newPageTotal) {
    // Add new pages
    for (let i = pages.length; i < newPageTotal; i++) {
      const page = document.createElement("div");
      page.className = "page";
      commentSection.appendChild(page);
    }
  } else if (pages.length > newPageTotal) {
    // Remove pages
    for (let i = pages.length - 1; i >= newPageTotal; i--) {
      pages[i].remove();
    }
  }

  // If there is more than one page, show pagination div (previous and next buttons)
  if (newPageTotal > 1) {
    // Show pagination div
    const pagination = commentSection.querySelector(".pagination");
    pagination.style.display = "flex";
  } else {
    // Hide pagination div
    const pagination = commentSection.querySelector(".pagination");
    pagination.style.display = "none";
  }

  // Remove all comments from pages before starting afresh
  for (let i = 0; i < pages.length; i++) {
    pages[i].innerHTML = "";
  }

  // Add the latest 2 (will increase to 10, but use 2 for now) comments to each page
  const allPages = commentSection.querySelectorAll(".page");
  for (let i = 0; i < allPages.length; i++) {
    const commentsForPage = apiService.getCommentsByPage(imageId, i + 1, 10);
    if (i === 0) {
      allPages[i].classList.add("active");
    } else {
      allPages[i].classList.remove("active");
    }
    commentsForPage.forEach((comment) => {
      const commentElmt = new Comment(
        commentSection,
        comment.commentId,
        comment.imageId,
        comment.author,
        comment.content,
        comment.date
      );
      allPages[i].append(commentElmt);
    });
  }

  const previousBtn = commentSection.querySelector(".previous");
  const nextBtn = commentSection.querySelector(".next");

  // Disable previous button if on first page
  const udpatedCurrentPage = getCurrentPage(commentSection);
  if (udpatedCurrentPage === allPages[0]) {
    previousBtn.disabled = true;
  } else {
    previousBtn.disabled = false;
  }
  // Disable next button if on last page
  if (udpatedCurrentPage === allPages[allPages.length - 1]) {
    nextBtn.disabled = true;
  } else {
    nextBtn.disabled = false;
  }
};

const Comment = (function () {
  "use strict";
  return function newComment(
    commentSection,
    commentId,
    imageId,
    author,
    content,
    date
  ) {
    const comment = document.createElement("div");
    comment.className = "comment";
    comment.id = commentId;
    date = new Date(date).toLocaleDateString("en-US", dateOptions);
    comment.innerHTML = `
      <div class="author-comment">${author}</div>
      <div class="date-comment">${date}</div>
      <div class="content">${content}</div>
      <img src="../media/trash.svg" alt="trash" class="delete" />`;

    // Add delete button event listener to each comment
    const deleteBtn = comment.querySelector(".delete");
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      deleteAComment(commentSection, commentId, imageId);
    });

    return comment;
  };
})();

const CommentSection = (function () {
  "use strict";
  return function newCommentSection(imageId) {
    // Make the comment section
    const commentSection = document.createElement("div");
    commentSection.className = "comment-section col-md-12 col-3";
    commentSection.innerHTML = `
      <div class="comment-head">
        <form class="comment-form">
          <input type="text" name="name" placeholder="Your name..." required/>
          <input type="text" name="comment" placeholder="Add a comment..." required/>
          <input type="submit" hidden />
        </form>
        <div class="pagination">
          <button class="previous">Previous</button>
          <button class="next">Next</button>
        </div>
      </div>
      <div class="no-comments">No comments yet!</div>`;

    reloadComments(commentSection, imageId);

    // Add pagination event listeners
    const previousBtn = commentSection.querySelector(".previous");
    const nextBtn = commentSection.querySelector(".next");
    previousBtn.addEventListener("click", (e) => {
      e.preventDefault();
      movePage(commentSection, -1);
    });
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      movePage(commentSection, 1);
    });

    // Add comment form submit listener
    const commentForm = commentSection.querySelector(".comment-form");
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addNewComment(commentSection, imageId);
      commentForm.reset();
    });

    return commentSection;
  };
})();

export { CommentSection };
