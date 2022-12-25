// COMPLETE

// create short urls
// only authenticated users can access this route

import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../lib/dbConnect";
import ShortUrl from "../../models/ShortUrl";
import Token from "../../models/Token";
import User from "../../models/User";
import Domain from "../../models/Domain";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { url, domain } = req.body;
  const jwtToken = req.cookies.token;

  console.log("Cookies: ", req.cookies);
  console.log("Token: ");

  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET) as {
    username: string;
  };

  console.log("Decoded: ", decode);

  // Find the user with the given username
  // @ts-expect-error
  const user = await User.findOne({
    username: decode.username,
  });

  // If there is no user with the given username
  if (!user) {
    return res.status(400).json({
      message: "Username or password is incorrect",
      type: "UNAUTHORIZED",
    });
  }

  // Get the token from the database
  // @ts-expect-error
  const token = await Token.findOne({});

  if (!token) {
    // server error
    return res.status(500).json({
      message: "Server error",
      type: "SERVER_ERROR",
    });
  }

  // Check if the domain is already in the database
  // @ts-expect-error
  const domainExists = await Domain.findOne({
    domain,
  });

  if (!domainExists) {
    // Bad request
    return res.status(400).json({
      message: "Domain does not exist",
      type: "BAD_REQUEST",
    });
  }

  // Create a new short url
  // @ts-expect-error
  const shortUrl = await ShortUrl.create({
    originalUrl: url,
    token: token.token,
    domain,
    username: user.username,
    errorPage: domainExists.errorPage,
  });

  if (!shortUrl) {
    // server error
    return res.status(500).json({
      message: "Server error",
      type: "SERVER_ERROR",
    });
  }

  return res.status(200).json({
    message: "Url created",
    type: "SUCCESS",
    shortUrl,
  });
}
