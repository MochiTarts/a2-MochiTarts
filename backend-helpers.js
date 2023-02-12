import {
  User,
  Account,
  Guest,
  UserType,
  Post,
  Comment,
} from "./models/index.js";

export const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/svg+xml", "image/webp"];

export const testData = async () => {
  // Create a guest user
  const user = await User.create({
    name: "guest",
    type: 2,
  });
  await UserType.create({
    type: 2,
    userId: user.id,
  });
  await Guest.create({
    userId: user.id,
  });

  // Guest user uploads a post
  const post = await Post.create({
    title: "Test Post",
    picture: {
      path: "uploads/istockphoto-1071204136-612x612.jpg",
      mimetype: "image/jpeg",
    },
    UserId: user.id,
  });
  const post2 = await Post.create({
    title: "Test Post 2",
    picture: {
      path: "uploads/istockphoto-1071204136-612x612.jpg",
      mimetype: "image/jpeg",
    },
    UserId: user.id,
  });

  // Make comments on the post
  for (let i = 1; i <= 21; i++) {
    await Comment.create({
      content: `Comment ${i}`,
      PostId: post.id,
      UserId: user.id,
    });
  }

  // Console log the data
  console.log("Guest User:", user.toJSON());
  console.log("Post:", post.toJSON());
};

// Helper function to a guest user if there is no userId in the session, otherwise retrieve logged in user.
export const createOrRetrieveUser = async (req) => {
  let user = null;
  if (req.session.userId) {
    user = await User.findByPk(req.session.userId);
  }
  if (!user) {
    user = await User.create({
      name: req.body.author,
      type: 2,
    });
    await UserType.create({
      type: 2,
      userId: user.id,
    });
    await Guest.create({
      userId: user.id,
    });
  }
  return user;
};

export const validateFileForm = (req, file, cb) => {
  // Make sure title, author, and picture are present
  const errorMessage = {};
  if (!req.body.title) {
    errorMessage.title = "Title is required";
  }
  if (!req.body.author) {
    errorMessage.author = "Author is required";
  }
  if (!file) {
    errorMessage.picture = "Picture is required";
  }
  // Make picture is a valid image
  // Make sure title and author are valid (alphanumeric, space, bracket, punctuation, and dash)
  if (req.body.title && !req.body.title.match(/^[a-zA-Z0-9 .,?!-()]+$/)) {
    errorMessage.title = "Title must be alphanumerical";
  }
  if (req.body.author && !req.body.author.match(/^[a-zA-Z0-9 .,?!-()]+$/)) {
    errorMessage.author = "Author must be alphanumerical";
  }
  if (file && !validImageMimeTypes.includes(file.mimetype)) {
    errorMessage.picture = "Invalid image type. Valid types are: jpeg, png, gif, jpg, svg, and webp";
  }

  if (Object.keys(errorMessage).length > 0) {
    req.errorMessage = errorMessage;
    return cb(null, false);
  }
  return cb(null, true);
};

export const validateCommentForm = (req) => {
  // Make sure author name and content is present
  const errorMessage = {};
  if (!req.body.author) {
    errorMessage.author = "Author is required";
  }
  if (!req.body.content) {
    errorMessage.content = "Comment is required";
  }

  // Make sure author name is valid (alphanumeric, space, bracket, punctuation, and dash)
  if (req.body.author && !req.body.author.match(/^[a-zA-Z0-9 .,?!-()]+$/)) {
    errorMessage.author = "Author must be alphanumerical";
  }
  if (Object.keys(errorMessage).length > 0) {
    return errorMessage;
  }
  return null;
}