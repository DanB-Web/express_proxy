import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs-extra";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());

// SIMPLE AUTH CHECK
const auth = (req, res, next) => {
  if (req.headers.auth === process.env.KEY) {
    next();
  } else {
    res.statusCode = 401;
    throw new Error("Unauthorized");
  }
};

app.use(auth);

// TEST ROUTE
app.get("/test", (req, res) => {
  res.json("Hello World, from your server!");
});

// GET FILE
app.get("/file", (req, res) => {
  try {
    const fileDirectory = path.join(process.cwd(), "files");

    // READ FILE IN DIRECTORY
    const files = fs.readdirSync(fileDirectory);

    // CHECK FOR EMPTY DIRECTORY
    if (files.length === 0) {
      throw new Error("No files in directory");
    }

    // SEND FIRST FILE IN ARRAY
    const options = {
      root: fileDirectory,
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };
    res.sendFile(files[0], options);

    // EMPTY DIRECTORY
    fs.emptyDir(fileDirectory, (err) => {
      if (err) {
        throw new Error("Error deleting files");
      }
    });
  } catch (e) {
    if (e.message) {
      throw e;
    } else {
      throw new Error("Error reading filesystem");
    }
  }
});

// MIDDLEWARE
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express proxy listening on port ${port}`);
});
