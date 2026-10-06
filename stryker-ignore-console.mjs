import {declareValuePlugin, PluginKind} from "@stryker-mutator/api/plugin";

function isConsoleBlock(path) {
  return (
    path.isBlockStatement() &&
    path.node.body.length > 0 &&
    path.get("body").every((statement) => isConsoleStatement(statement))
  );
}

function isConsoleCall(path) {
  return path.isCallExpression() && path.get("callee").matchesPattern("console", true);
}

function isConsoleStatement(path) {
  return path.isExpressionStatement() && isConsoleCall(path.get("expression"));
}

function isLog(path) {
  return isConsoleCall(path) || isConsoleStatement(path) || isConsoleBlock(path);
}

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, "console", {
    shouldIgnore(path) {
      if (isLog(path)) {
        return "Tests do not assert log output.";
      }
    },
  }),
];
