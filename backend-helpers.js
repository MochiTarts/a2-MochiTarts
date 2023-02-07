
import { User, Account, Guest, UserType, Post, Comment } from "./models/index.js";

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

  // Create an account user
  const account = await User.create({
    name: "account",
    type: 1,
  });
  await UserType.create({
    type: 1,
    userId: account.id,
  });
  await Account.create({
    email: "test@gmail.com",
    password: "password",
    userId: account.id,
  });

  // Guest user creates a post
  const post = await Post.create({
    title: "Test Post",
    picture: {
      path: "uploads/1234",
      mimetype: "image/jpeg",
    },
    UserId: user.id,
  });

  // Account user makes 11 comments for the post
  for (let i = 0; i < 11; i++) {
    await Comment.create({
      content: `Test Comment ${i}`,
      PostId: post.id,
      UserId: account.id,
    });
  }

  // Console log the data
  console.log("Guest User:", user.toJSON());
  console.log("Account User:", account.toJSON());
  console.log("Post:", post.toJSON());
}

// Helper function to a guest user if there is no userId in the session, otherwise retrieve user. session will be destroyed when the browser is closed.
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
    req.session.userId = user.id;
  }
  return user;
};