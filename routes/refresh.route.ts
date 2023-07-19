import express from "express";
import { refreshToken } from "../controllers/refreshToken.controller";

const router = express.Router();

router.get("/", refreshToken);

export { router };
