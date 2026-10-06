import {assert, test} from "vitest";
import {targetsAsOf} from "../../vite.config.ts";

test("browser targets were reviewed within the last 90 days", () => {
  const ageInDays = (Date.now() - Date.parse(targetsAsOf)) / 86_400_000;
  assert.isAtMost(
    ageInDays,
    90,
    `build.target in vite.config.ts was last reviewed ${targetsAsOf}. ` +
      "Set each browser to its prior major version, then set targetsAsOf to today.",
  );
});
