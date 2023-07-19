import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthRouteResponse, RouteResponse } from "../interfaces/interfaces";
import { Request, Response } from "express";

dotenv.config();
const prisma = new PrismaClient();

const refreshToken = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  const response: RouteResponse<null> = {
    code: 401,
    data: null,
    success: false,
    error: "You are not authorized to make this request.",
    message: "You are not authorized to make this request.",
  };

  // If you dont have a cookie , user must login again.
  if (!cookies?.jwt) {
    return res.status(response.code).json(response);
  }
  // If you have the cookie get the cookie for further use
  const refreshToken = cookies.jwt;

  // find the user with the associated refreshToken
  const foundUser = await prisma.user.findFirst({ where: { refreshToken: refreshToken } });

  // if there is no user with this refresh token , user must login again.
  if (!foundUser) {
    response.code = 403;
    response.error = "You are forbidden from making this request";
    response.message = "You are forbidden from making this request";
    return res.status(response.code).json(response);
  }

  // if the refreshToken matches the one stored in the database
  // try to verify it

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundUser.username !== decoded.username) {
      response.code = 403;
      response.error = "You are forbidden from making this request";
      response.message = "You are forbidden from making this request";
      return res.status(response.code).json(response);
    }

    // everything is ok so issue and return the new access token
    const accessToken = jwt.sign({ UserInfo: { username: decoded.username } }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "5m",
    });
    const resp: RouteResponse<AuthRouteResponse> = {
      code: 200,
      success: true,
      error: null,
      message: "Token refreshed successfully.",
      data: { accessToken: accessToken, id: foundUser.id, username: foundUser.username },
    };
    res.status(resp.code).json(resp);
  });
};

export { refreshToken };
