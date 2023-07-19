import express from "express";
import { logout } from "../controllers/logout.controller";

const router = express.Router();

router.get("/", logout);

export { router };
