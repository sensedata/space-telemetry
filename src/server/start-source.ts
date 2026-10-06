import type {SourceName} from "./config.ts";
import * as lightstreamer from "./lightstreamer.ts";
import * as replay from "./replay.ts";
import type {Source} from "./source.ts";

/**
 * Starts the producer that `name`, a SOURCE setting, names to emit into `source`:
 * lightstreamer starts the Lightstreamer adapter over the library `loadLightstreamer`
 * resolves with, replay plays the recording the command-line `args` name and resolves once
 * it ends, and none starts nothing.
 */
export async function startSource(
  name: SourceName,
  args: string[],
  source: Pick<Source, "emit" | "expectTimeWithin">,
  loadLightstreamer: () => Promise<lightstreamer.Lightstreamer>,
): Promise<void> {
  if (name === "lightstreamer") {
    lightstreamer.start(await loadLightstreamer(), source);
  } else if (name === "replay") {
    await replay.start(args, source);
  }
}
