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
import { testData, createOrRetrieveUser, validImageMimeTypes, validateFileForm } from "./backend-helpers.js";
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
  await sequelize.sync({ force: true }); // Added this line to drop the tables and recreate them (will remove before submission)

  // This is a helper function that I created to populate the database with some test data.
  // You can remove this line if you want.
  await testData();

  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

// Helper api to test session
app.get("/test", (req, res) => {
  if (req.session.userId) {
    res.send(`Hello ${req.session.userId}`);
  } else {
    res.send("Hello World");
  }
});

// Helper api to test session
app.get("/api/session/set", async (req, res) => {
  req.session.userId = 1;
  res.json({ message: "Session set" });
});

// Helper api to destroy session
app.get("/api/session/destroy", (req, res) => {
  req.session.destroy();
  res.json({ message: "Session destroyed" });
});

const upload = multer({ dest: "uploads/", mimetype: validImageMimeTypes, fileFilter: validateFileForm });
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
  // Given the limit and startId, calculate the next startId. It is the id of the post whose createdAt is right before the oldest post in the current batch.
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
  // Given the limit and startId, calculate the previous startId. It is the id of the post whose createdAt is right after the newest post in the current batch.
  if (limit && posts.length > 0) {
    const newestPost = posts[0];
    const previousPost = await Post.findOne({
      where: {
        createdAt: {
          [Op.gt]: newestPost.createdAt,
        },
      },
      order: [["createdAt", "ASC"]],
    });
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
  // Delete image file
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  fs.unlinkSync(path.join(__dirname, post.picture.path));
  // Delete post
  const deleted = post;
  deleted.totalPosts = await Post.count();
  await post.destroy();
  res.json(deleted);
});

app.post("/api/posts/:id/comment", async (req, res) => {
  // Create a comment for a single post
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
  // Get all comments for a single post. May include pagination.
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }

  let comments = [];
  if (req.query.page && req.query.limit) {
    const offset = (req.query.page - 1) * req.query.limit;
    const limit = req.query.limit;
    comments = await Comment.findAll({
      where: {
        PostId: req.params.id,
      },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit,
    });
  } else {
    comments = await Comment.findAll({
      where: {
        PostId: req.params.id,
      },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
  res.json(comments);
});

app.delete("/api/posts/:id/comments/:commentId", async (req, res) => {
  // Anyone can delete a comment for now.
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) {
    res
      .status(404)
      .json({
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
