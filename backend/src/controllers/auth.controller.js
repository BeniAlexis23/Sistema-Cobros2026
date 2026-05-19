import { comparePassword, hashPassword } from "../libs/password.js";
import { signToken } from "../libs/jwt.js";
import { createUser, findUserByEmail } from "../models/user.model.js";

export async function register(req, res) {
  const { name, email, password } = req.body;
  const existing = await findUserByEmail(email);

  if (existing) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const password_hash = await hashPassword(password);
  const user = await createUser({ name, email, password_hash });
  const token = signToken({ id: user.id });

  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id });
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    },
    token
  });
}

export function me(req, res) {
  res.json({ user: req.user });
}
