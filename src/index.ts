import path from "path";
import express, { Express, Request, Response } from "express";
import { logger } from "../middleware/logEvents";
import { errorHandler } from "../middleware/errorHandler";
import { credentials } from "../middleware/credentials";
import { router as registerRouter } from "../routes/register.route";
// import { router as blogRouter } from "../routes/blog.route";
import { router as loginRouter } from "../routes/login.route";
import { router as refreshRouter } from "../routes/refresh.route";
import { router as logoutRouter } from "../routes/logout.route";
import cors from "cors";
import { corsOptions } from "../config/corsOptions";
import { verifyJWT } from "../middleware/verifyJWT";

const cookieParser = require("cookie-parser");
const app: Express = express();
const PORT = process.env.PORT || 8001;

// Middlewares apply on all routes

app.use(logger); // custom middleware logger
app.use(cookieParser());
app.use(credentials);
app.use(cors(corsOptions)); // cross origin resource sharing
app.use(express.urlencoded({ extended: false })); // for getting form data
app.use(express.json()); // for getting json data
app.use(express.static(path.join(__dirname, "/public")));

// Routes
app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);
app.use("/api/logout", logoutRouter);
app.use("/api/refresh", refreshRouter);

// app.use("/api/blog", verifyJWT, blogRouter);

// maybe implement a catch all here
app.get("/", (req: Request, res: Response) => {
  res.send("Hello dude");
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
