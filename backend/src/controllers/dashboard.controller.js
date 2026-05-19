import { getClientStats } from "../models/client.model.js";

export async function getDashboard(req, res) {
  const stats = await getClientStats(req.user);
  res.json(stats);
}
