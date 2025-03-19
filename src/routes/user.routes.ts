import express, { Request, Response, NextFunction } from "express";
import { UserController } from "../controller/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/rate.limiter";

export const userRouter = express.Router();

userRouter.use(rateLimiter);

// Create middleware wrappers for controller methods
const asyncHandler =
  (fn: Function) =>
  (req: Request, res: Response): void => {
    Promise.resolve(fn(req, res)).catch((err) => {
      res.status(500).json({
        error: err.message,
        message: "Something went wrong!",
        success: false,
      });
    });
  };

// Route-specific middleware to handle auth
const authHandler = (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, next);
};

userRouter.post("/login", asyncHandler(UserController.login));
userRouter.post("/register", asyncHandler(UserController.postUser));
userRouter.get("/user", asyncHandler(UserController.getUserById));
userRouter.put("/user", asyncHandler(UserController.putUser));
userRouter.delete("/deleteUser", asyncHandler(UserController.deleteUser));
userRouter.get("/user/:email", asyncHandler(UserController.getUserByEmail));
userRouter.post("/logout", authHandler, asyncHandler(UserController.logout));
userRouter.get("/refresh", asyncHandler(UserController.refresh));
userRouter.get("/me", authHandler, asyncHandler(UserController.me));
