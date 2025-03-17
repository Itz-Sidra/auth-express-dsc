import { Request, Response } from "express";

export const healthController = (req: Request, res: Response) => {
  res.json({
    message: "Health ok!",
    success: true,
    time: Date.now(),
  });
};
