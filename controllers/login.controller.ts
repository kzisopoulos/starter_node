import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ZodError } from "zod";
import { AuthRouteResponse, RouteResponse, loginPayloadSchema } from "../interfaces/interfaces";

dotenv.config();
const prisma = new PrismaClient();

const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    loginPayloadSchema.parse(req.body);

    // find the user
    const foundUser = await prisma.user.findFirst({ where: { username: username } });
    if (!foundUser) {
      const response: RouteResponse<null> = {
        code: 401,
        data: null,
        success: false,
        error: "No user found with this username.",
        message: "No user found with this username.",
      };
      return res.status(response.code).json(response);
    }
    // check password
    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
      // create a jwt to send to use with the other routes that we want to
      // be protected normal and refresh token.
      const accessToken = jwt.sign({ UserInfo: { username: foundUser.username } }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30s",
      });
      const refreshToken = jwt.sign({ username: foundUser.username }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      const currentUser = {
        ...foundUser,
        refreshToken,
      };

      // save the new refresh token to the database
      await prisma.user.update({ where: { username: username }, data: { refreshToken: refreshToken } });
      // saving refresh token with current user
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        // sameSite: "none",
        // secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      const response: RouteResponse<AuthRouteResponse> = {
        code: 200,
        success: true,
        error: null,
        message: `User ${username} successfully logged in`,
        data: {
          id: foundUser.id,
          username: foundUser.username,
          accessToken: accessToken,
        },
      };
      return res.status(response.code).json(response);
    } else {
      const response: RouteResponse<null> = {
        code: 401,
        data: null,
        success: false,
        error: "The password is incorrect.",
        message: "The password is incorrect.",
      };
      return res.status(response.code).json(response);
    }
  } catch (error) {
    const response: RouteResponse<null> = {
      code: 400,
      data: null,
      success: false,
      error: "Internal server error.",
      message: "Internal server error.",
    };
    if (error instanceof ZodError) {
      response.error = error.errors[0].message;
      response.message = error.errors[0].message;
      return res.status(response.code).json(response);
    }
    res.status(response.code).json(response);
  }
};

export { login };
