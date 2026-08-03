import express from "express";
import { validate } from "../middleware/validate";
import { loginSchema } from "../schemas/login.schema";
import { authController } from "../controllers/auth.controller";

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);

export default router;
