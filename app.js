import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./datasource.js";
import {
  User,
  Post,
  Comment,
  UserType,
  Guest,
  Account,
} from "./models/index.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import {
  testData,
  createOrRetrieveUser,
  validImageMimeTypes,
  validateFileForm,
  validateCommentForm,
} from "./backend-helpers.js";
import session from "express-session";
import { json, Op } from "sequelize";

export const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "keyboardcat",
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // We're not using HTTPS yet
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static("static"));

// I recommend putting this just below app.use(express.static("static")), so that it can run before your other code.
try {
  await sequelize.authenticate();
  // Automatically detect all of your defined models and create (or modify) the tables for you.
  // This is not recommended for production-use, but that is a topic for a later time!
  await sequelize.sync({ alter: { drop: false } });
  // await sequelize.sync({ force: true }); // Added this line to drop the tables and recreate them (will remove before submission)

  // This is a helper function that I created to populate the database with some test data.
  // Comment this out before submission.
  // await testData();

  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

/* Post (image) APIs */
const upload = multer({
  dest: "uploads/",
  mimetype: validImageMimeTypes,
  fileFilter: validateFileForm,
});
app.post("/api/post", upload.single("picture"), async (req, res) => {
  if (req.errorMessage) {
    res.status(400).json({ error: req.errorMessage });
    return;
  }

  // Make a new post
  const user = await createOrRetrieveUser(req);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const post = await Post.create({
    title: req.body.title,
    picture: {
      path: req.file.path,
      mimetype: req.file.mimetype,
    },
    UserId: user.id,
  });
  res.json(post);
});

app.get("/api/posts", async (req, res) => {
  // Get (limit; if no limit, get all) posts starting from startId (if not provided, start from the most recent post)
  const startId = req.query.startId ? parseInt(req.query.startId) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  const posts = await Post.findAll({
    where: startId ? { id: { [Op.lte]: startId } } : {},
    limit,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        attributes: ["name"],
      },
      {
        model: Comment,
        attributes: ["content"],
        include: [
          {
            model: User,
            attributes: ["name"],
          },
        ],
      },
    ],
  });
  const resp = {
    limit: limit,
    results: posts,
    size: posts.length,
    startId: startId,
    nextLink: null,
    prevLink: null,
  };
  // Given the limit and startId, calculate the next startId.
  // startId = id of the post whose createdAt is right before the oldest post in the current page
  if (limit && posts.length > 0) {
    const oldestPost = posts[posts.length - 1];
    const nextPost = await Post.findOne({
      where: {
        createdAt: {
          [Op.lt]: oldestPost.createdAt,
        },
      },
      order: [["createdAt", "DESC"]],
    });
    resp.nextLink = nextPost
      ? `/api/posts?limit=${limit}&startId=${nextPost.id}`
      : null;
  }
  // Given the limit and startId, calculate the previous startId.
  // startId = id of comment that is limit away from the newest comment in the current batch
  if (limit && posts.length > 0) {
    const newestPost = posts[0];
    const previousPostPage = await Post.findAll({
      where: {
        createdAt: {
          [Op.gt]: newestPost.createdAt,
        },
      },
      limit: limit,
      order: [["createdAt", "DESC"]],
    });
    const previousPost = previousPostPage[0];
    resp.prevLink = previousPost
      ? `/api/posts?limit=${limit}&startId=${previousPost.id}`
      : null;
  }
  res.json(resp);
});

app.get("/api/posts/:id/picture", async (req, res) => {
  // Get a single post's picture
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  res.setHeader("Content-Type", post.picture.mimetype);
  res.sendFile(path.join(__dirname, post.picture.path));
});

app.delete("/api/posts/:id", async (req, res) => {
  // Delete a post. This should also delete all comments for that post. (Anyone can delete a post for now.) Should also include number of posts left.
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  // Delete image file
  fs.unlinkSync(path.join(__dirname, post.picture.path));
  // Delete post
  const deleted = post;
  deleted.totalPosts = await Post.count();
  await post.destroy();
  res.json(deleted);
});

/* Comments APIs */
app.post("/api/posts/:id/comment", async (req, res) => {
  // Create a comment for a single post
  // Validate author and comment content
  const errorMessage = validateCommentForm(req);
  if (errorMessage) {
    res.status(400).json({ error: errorMessage });
    return;
  }
  // Retrieve post (make sure it exists)
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  // Create or retrieve user
  const user = await createOrRetrieveUser(req);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // Create comment
  const comment = await Comment.create({
    content: req.body.content,
    PostId: post.id,
    UserId: user.id,
  });
  res.json(comment);
});

app.get("/api/posts/:id/comments", async (req, res) => {
  // Retrieve comments up to (limit) for a single post starting from (startId), sorted from most recent to oldest.
  // If no limit provided, retrieve all comments. If no startId provided, retrieve comments from the most recent.
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }

  const startId = req.query.startId ? parseInt(req.query.startId) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  // Retrieve comments given the limit and startId, and post id
  const comments = await Comment.findAll({
    where: {
      PostId: post.id,
      ...(startId && { id: { [Op.lte]: startId } }),
    },
    limit,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        attributes: ["name"],
      },
    ],
  });
  const resp = {
    limit: limit,
    results: comments,
    size: comments.length,
    startId: startId,
    nextLink: null,
    prevLink: null,
  };
  // Given the post id, limit and startId, calculate the next startId.
  // startId = id whose createdAt is right before the oldest comment in the current batch
  if (limit && comments.length > 0) {
    const oldestComment = comments[comments.length - 1];
    const nextComment = await Comment.findOne({
      where: {
        createdAt: {
          [Op.lt]: oldestComment.createdAt,
        },
        PostId: post.id,
      },
      order: [["createdAt", "DESC"]],
    });
    resp.nextLink = nextComment
      ? `/api/posts/${post.id}/comments?limit=${limit}&startId=${nextComment.id}`
      : null;
  }
  // Given the post id, limit and startId, calculate the previous startId.
  // startId = id of comment that is limit away from the newest comment in the current batch
  if (limit && comments.length > 0) {
    const newestComment = comments[0];
    // Get all comments newer than the newest comment in the current batch, up to limit
    const previousCommentPage = await Comment.findAll({
      where: {
        createdAt: {
          [Op.gt]: newestComment.createdAt,
        },
        PostId: post.id,
      },
      limit: limit,
      order: [["createdAt", "ASC"]],
    });
    const previousComment = previousCommentPage[previousCommentPage.length - 1];
    resp.prevLink = previousComment
      ? `/api/posts/${post.id}/comments?limit=${limit}&startId=${previousComment.id}`
      : null;
  }
  res.json(resp);
});

app.delete("/api/comments/:commentId", async (req, res) => {
  // Anyone can delete a comment for now.
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) {
    res.status(404).json({
      error: "Comment with id " + req.params.commentId + " not found",
    });
    return;
  }
  const deleted = comment;
  await comment.destroy();
  res.json(deleted);
});

const PORT = 3000;

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
