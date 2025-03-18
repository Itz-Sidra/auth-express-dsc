import { Request, Response } from "express";
import { createId } from "@paralleldrive/cuid2";
import { MemoryCache } from "../db/memory.cache";
import { getPrismaClient } from "../db/prisma";
import { RedisSingleton } from "../db/redis.cache";
import { loginSchema, registerSchema } from "../models/user.model";
import { hash, verifyPassword } from "../utils/password.hash";
import { generateToken } from "../utils/generateToken";
import { MapData, UserMapData } from "../utils/types";

export class UserController {
  static async postUser(req: Request, res: Response) {
    try {
      const prisma = getPrismaClient();  
      const redisClient = RedisSingleton.getInstance();

      const body = req.body;
      const isValid = registerSchema.safeParse(body);

      if (!isValid.success) {
        return res.status(400).json({
          error: isValid.error.message,
          message: "Invalid input data",
          success: false,
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: { email: isValid.data.email },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Email already in use",
          message: "Email already registered",
          success: false,
        });
      }

      const hashed = await hash(isValid.data.password);

      const { name, email } = isValid.data;
      const userId = createId();

      const { accessToken, refreshToken } = await generateToken(
        {
          id: userId,
          email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
      );

      res.cookie("access", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // milliseconds
        path: "/"
      });

      res.cookie("token", refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 * 1000, // milliseconds
        path: "/"
      });

      const user = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          password: hashed,
          refreshToken
        },
      });

      const cacheData = {
        expiry: Math.floor(Date.now() / 1000) + 60 * 60,
        data: {
          token: accessToken,
          meta: email,
        },
      } as MapData;

      MemoryCache.setMemory(`access:${user.id}`, cacheData);
      await redisClient.set(`access:${user.id}`, JSON.stringify(cacheData));
      await redisClient.expire(`access:${user.id}`, 60 * 60);

      return res.status(201).json({
        message: "User registered!",
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const id = req.query.id as string;

      if (!id) {
        return res.status(400).json({
          error: "Missing ID parameter",
          message: "User ID is required",
          success: false,
        });
      }

      const cacheKey = `user:${id}`;
      const redisClient = RedisSingleton.getInstance();

      const memoryCache = MemoryCache.getMemory(cacheKey);
      if (memoryCache) {
        return res.status(200).json({
          message: "User found!",
          user: memoryCache,
          success: true,
        });
      }

      const redisCache = await redisClient.get(cacheKey);
      if (redisCache) {
        return res.status(200).json({
          message: "User found!",
          user: redisCache,
          success: true,
        });
      }

      const prisma = getPrismaClient();  
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          refreshToken: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "User with the provided ID does not exist",
          success: false,
        });
      }

      const cache: UserMapData = {
        ...user,
        expiry: Math.floor(Date.now() / 1000) + 60 * 60,
      } as UserMapData;

      MemoryCache.setMemory(cacheKey, cache);
      await redisClient.set(cacheKey, JSON.stringify(cache));
      await redisClient.expire(cacheKey, RedisSingleton.getTtl());

      return res.status(200).json({
        message: "User found!",
        user,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async getUserByEmail(req: Request, res: Response) {
    try {
      const email = req.params.email;

      if (!email) {
        return res.status(400).json({
          error: "Missing email parameter",
          message: "Email is required",
          success: false,
        });
      }

      const cacheKey = `email:${email}`;

      const memoryCache = MemoryCache.getMemory(cacheKey);
      if (memoryCache) {
        return res.status(200).json({
          message: "User found!",
          user: memoryCache,
          success: true,
        });
      }

      const redisClient = RedisSingleton.getInstance();
      const redisCache = await redisClient.get(cacheKey);

      if (redisCache) {
        return res.status(200).json({
          message: "User found!",
          user: redisCache,
          success: true,
        });
      }

      const prisma = getPrismaClient(); 
      const user = await prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          refreshToken: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "User with the provided email does not exist",
          success: false,
        });
      }

      const cache: UserMapData = {
        ...user,
        expiry: Math.floor(Date.now() / 1000) + 60 * 60,
      } as UserMapData;

      MemoryCache.setMemory(cacheKey, cache);
      await redisClient.set(cacheKey, JSON.stringify(cache));
      await redisClient.expire(cacheKey, RedisSingleton.getTtl());

      return res.status(200).json({
        message: "User found!",
        user,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async putUser(req: Request, res: Response) {
    try {
      const id = req.query.id as string;

      if (!id) {
        return res.status(400).json({
          error: "Missing ID parameter",
          message: "User ID is required",
          success: false,
        });
      }

      const body = req.body;

      if (Object.keys(body).length === 0) {
        return res.status(400).json({
          error: "Empty request body",
          message: "No data provided for update",
          success: false,
        });
      }

      const allowedFields = ["name", "email"];
      const filteredBody = Object.fromEntries(
        Object.entries(body).filter(([key]) => allowedFields.includes(key))
      );

      const prisma = getPrismaClient();

      if (filteredBody.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: filteredBody.email,
            id: { not: id },
          },
        });

        if (existingUser) {
          return res.status(409).json({
            error: "Email already in use",
            message: "Email already registered by another user",
            success: false,
          });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: filteredBody,
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const redisClient = RedisSingleton.getInstance();

      MemoryCache.delete(`user:${id}`);
      MemoryCache.delete(`email:${user.email}`);

      await redisClient.del(`user:${id}`);
      await redisClient.del(`email:${user.email}`);

      return res.status(200).json({
        message: "User updated!",
        user,
        success: true,
      });

    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return res.status(404).json({
          error: "User not found",
          message: "User with the provided ID does not exist",
          success: false,
        });
      }

      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = req.query.id as string;

      if (!id) {
        return res.status(400).json({
          error: "Missing ID parameter",
          message: "User ID is required",
          success: false,
        });
      }

      const prisma = getPrismaClient();  

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "User with the provided ID does not exist",
          success: false,
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      const redisClient = RedisSingleton.getInstance();

      MemoryCache.delete(`user:${id}`);
      MemoryCache.delete(`email:${user.email}`);
      MemoryCache.delete(`access:${id}`);

      await redisClient.del(`user:${id}`);
      await redisClient.del(`email:${user.email}`);
      await redisClient.del(`access:${id}`);

      res.clearCookie("access", { path: "/" });
      res.clearCookie("token", { path: "/" });

      return res.status(200).json({
        message: "User deleted!",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const prisma = getPrismaClient(); 
      const redisClient = RedisSingleton.getInstance();

      const body = req.body;
      const isValid = loginSchema.safeParse(body);

      if (!isValid.success) {
        return res.status(400).json({
          error: isValid.error.message,
          message: "Invalid input data",
          success: false,
        });
      }

      const { email, password } = isValid.data;

      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Invalid email or password",
          success: false,
        });
      }

      const isPasswordValid = await verifyPassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Invalid email or password",
          success: false,
        });
      }

      const { accessToken, refreshToken } = await generateToken(
        {
          id: user.id,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken,
          refreshToken,
        },
      });

      res.cookie("access", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // milliseconds
        path: "/"
      });

      res.cookie("token", refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 * 1000, // milliseconds
        path: "/"
      });

      const cacheData = {
        expiry: Math.floor(Date.now() / 1000) + 60 * 60,
        data: {
          token: accessToken,
          meta: email,
        },
      } as MapData;

      MemoryCache.setMemory(`access:${user.id}`, cacheData);
      await redisClient.set(`access:${user.id}`, JSON.stringify(cacheData));
      await redisClient.expire(`access:${user.id}`, 60 * 60);

      return res.status(200).json({
        message: "Login successful!",
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const payload = req.user; 

      if (!payload) throw new Error("Unauthorized");

      return res.status(200).json({
        message: "Authorized",
        success: true,
        payload,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong!",
        success: false,
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const payload = req.user; 
      if (!payload || !payload.id) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User not logged in",
          success: false,
        });
      }
      
      const userId = payload.id;
      const prisma = getPrismaClient();  
      const redisClient = RedisSingleton.getInstance();
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: "",
          refreshToken: "",
        },
      });

      const access = req.cookies.access;
      const refresh = req.cookies.token;

      await prisma.blacklist.createMany({
        data: [{
          token: access,
        },{
          token : refresh
        }]
      });
      
      MemoryCache.delete(`access:${userId}`);
      await redisClient.del(`access:${userId}`);
      
      res.clearCookie("access", { path: "/" });
      res.clearCookie("token", { path: "/" });
      
      return res.status(200).json({
        message: "Logout successful!",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong during logout!",
        success: false,
      });
    }
  }
  
  static async refresh(req: Request, res: Response) {
    try {
      const prisma = getPrismaClient(); 
      const redisClient = RedisSingleton.getInstance();
  
      const refreshToken = req.cookies.token;
  
      if (!refreshToken) {
        return res.status(400).json({
          error: "Missing refresh token",
          message: "Refresh token is required",
          success: false,
        });
      }
  
      const user = await prisma.user.findFirst({
        where: { refreshToken },
      });
  
      if (!user) {
        return res.status(401).json({
          error: "Invalid refresh token",
          message: "Refresh token is invalid or expired",
          success: false,
        });
      }
  
      const exp = Math.floor(Date.now() / 1000) + 60 * 60; 
      const { accessToken, refreshToken: newRefreshToken } = await generateToken(
        {
          id: user.id,
          email: user.email,
          exp,
        },
      );
  
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
  
      res.cookie("access", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // milliseconds
        path: "/"
      });

      res.cookie("token", newRefreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 * 1000, // milliseconds
        path: "/"
      });
  
      const cacheData = {
        expiry: exp,
        data: {
          token: accessToken,
          meta: user.email,
        },
      } as MapData;
  
      MemoryCache.setMemory(`access:${user.id}`, cacheData);
      await redisClient.set(`access:${user.id}`, JSON.stringify(cacheData));
      await redisClient.expire(`access:${user.id}`, 60 * 60);
  
      return res.status(200).json({
        message: "Token refreshed successfully!",
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: "Something went wrong during token refresh!",
        success: false,
      });
    }
  }
}