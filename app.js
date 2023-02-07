import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./datasource.js";
import { User, Post, Comment, UserType, Guest, Account } from "./models/index.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { testData, createOrRetrieveUser } from "./backend-helpers.js";
import session from "express-session";

export const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: "keyboardcat",
  name: "sessionId",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // We're not using HTTPS yet
}));

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
  //await testData();

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

const upload = multer({ dest: "uploads/", mimetype: "image/jpeg" });
app.post("/api/post", upload.single("picture"), async (req, res) => {
  // Make a new post
  console.log(req.body);
  console.log(req.file);
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
  // Get all posts. Include author's name and all comments (with commenter's name)
  const posts = await Post.findAll({
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
  res.json(posts);
});

app.get("/api/posts/:id", async (req, res) => {
  // Get a single post. Include author's name and all comments (with commenter's name)
  const post = await Post.findByPk(req.params.id, {
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
  if (!post) {
    res.status(404).json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  res.json(post);
});

app.post("/api/posts/:id/comment", async (req, res) => {
  // Create a comment for a single post
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res.status(404).json({ error: "Post with id " + req.params.id + " not found" });
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
    res.status(404).json({ error: "Post with id " + req.params.id + " not found" });
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

app.delete("/api/posts/:id", async (req, res) => {
  // Delete a post. This should also delete all comments for that post. (Anyone can delete a post for now.)
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res.status(404).json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  const deleted = post;
  await post.destroy();
  res.json(deleted);
});

app.delete("/api/posts/:id/comments/:commentId", async (req, res) => {
  // Anyone can delete a comment for now.
  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res.status(404).json({ error: "Post with id " + req.params.id + " not found" });
    return;
  }
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) {
    res.status(404).json({ error: "Comment with id " + req.params.commentId + " not found" });
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