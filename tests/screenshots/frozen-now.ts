// Preloaded into the server by playwright.screenshots.config.ts, so the buffer backfills the
// seed as though it had just arrived.
import {FROZEN_MS} from "./frozen-time.ts";

Date.now = () => FROZEN_MS;
