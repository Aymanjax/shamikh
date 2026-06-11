import { Router } from "express";
import * as themeService from "../services/themeService";

// Public, unauthenticated router. Mounted outside the admin router so the theme
// (incl. per-page backgrounds) can be applied before login — e.g. on the login
// page. Only the theme document is exposed; all other config stays behind auth.
const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const theme = await themeService.getTheme();
    res.json(theme);
  } catch (err) {
    next(err);
  }
});

export default router;
