import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AuthRouteResponse, RouteResponse, registerPayloadSchema } from "../interfaces/interfaces";
import { ZodError } from "zod";

const prisma = new PrismaClient();

const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;
    registerPayloadSchema.parse(req.body);
    // check for duplicate usernames in the db
    const duplicate = await prisma.user.findFirst({
      where: { OR: [{ username: username }, { email: email }] },
    });
    if (duplicate) {
      const response: RouteResponse<null> = {
        code: 409,
        data: null,
        success: false,
        error: "This username is already in use.",
        message: "This username is already in use.",
      };
      if (duplicate?.email === email) {
        response.error = "This email is already in use";
        response.message = "This email is already in use";
        res.status(response.code).json(response);
        return;
      }
      res.status(response.code).json(response);
      return;
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    // create access & refresh token
    const accessToken = jwt.sign({ UserInfo: { username: username } }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ username: username }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    // store the new user
    const user = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: hashedPassword,
        refreshToken: refreshToken,
      },
    });

    // res.cookie("jwt", refreshToken, {
    //   domain: "http://localhost:4200",
    //   path: "/",
    //   httpOnly: true,
    //   sameSite: "lax",
    //   secure: true,
    //   maxAge: 24 * 60 * 60 * 1000,
    // });

    const response: RouteResponse<AuthRouteResponse> = {
      success: true,
      message: `New user ${username} created.`,
      code: 201,
      error: null,
      data: {
        accessToken: accessToken,
        username: user.username,
        id: user.id,
      },
    };
    // send the access token back.
    res
      .cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(response.code)
      .json(response);
  } catch (error) {
    const response: RouteResponse<null> = {
      code: 500,
      data: null,
      success: false,
      error: "Internal server error.",
      message: "Internal server error.",
    };
    if (error instanceof ZodError) {
      response.code = 400;
      response.error = error.errors[0].message;
      response.message = error.errors[0].message;
      res.status(response.code).json(response);
      return;
    }
    res.status(response.code).json(response);
  }
};

export { register };
