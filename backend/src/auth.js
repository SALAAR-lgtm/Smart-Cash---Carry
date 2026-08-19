import jwt from "jsonwebtoken";

export function createAuth({ jwtSecret }) {
  function createToken(admin) {
    return jwt.sign(
      {
        sub: String(admin.id),
        username: admin.username,
        role: "admin",
      },
      jwtSecret,
      { expiresIn: "8h" },
    );
  }

  function requireAdmin(request, response, next) {
    const authorization = request.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return response.status(401).json({ error: "An administrator token is required." });
    }

    try {
      const token = authorization.slice("Bearer ".length);
      const payload = jwt.verify(token, jwtSecret);

      if (payload.role !== "admin") {
        return response.status(403).json({ error: "Administrator access is required." });
      }

      request.admin = payload;
      return next();
    } catch {
      return response.status(401).json({ error: "The administrator token is invalid or expired." });
    }
  }

  return { createToken, requireAdmin };
}
