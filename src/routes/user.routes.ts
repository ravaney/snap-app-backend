import express from "express";
import { validate } from "../middleware/validate";
import { createUser } from "../schemas/signupSchema";
import {
  meController,
  searchUsersController,
  signupController,
} from "../controllers/user.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.post("/signup", validate(createUser), signupController);
router.get("/me", requireAuth, meController);
router.get("/search", requireAuth, searchUsersController);

export default router;
