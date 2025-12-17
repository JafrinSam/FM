// src/modules/mixer/mixer.routes.js
const express = require("express");
const router = express.Router();

const {
  requireAdmin,
  getState,
  postSetLevels,
  postFadeOut,
  postFadeIn,
  postMuteMic,
  postUnmuteMic
} = require("../controller/mixer.controller");

// Base path: /api/mixer

router.get("/state", requireAdmin, getState);

router.post("/set-levels", requireAdmin, postSetLevels);

router.post("/fade-out", requireAdmin, postFadeOut);

router.post("/fade-in", requireAdmin, postFadeIn);

router.post("/mic/mute", requireAdmin, postMuteMic);

router.post("/mic/unmute", requireAdmin, postUnmuteMic);

module.exports = router;
