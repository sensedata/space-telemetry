export default {
  forbidden: [
    {
      name: "no-js-in-src",
      severity: "error",
      from: {path: String.raw`^src/.+\.js$`},
      to: {},
    },
    {
      name: "no-barrel-inside-package",
      comment: "Inside a package, import the file you need, not the package's index.ts.",
      severity: "error",
      from: {path: "^src/([^/]+)/"},
      to: {path: String.raw`^src/$1/index\.tsx?$`},
    },
    {
      name: "no-circular",
      comment: "Files must not import each other in a loop, even through other files.",
      severity: "error",
      from: {},
      to: {circular: true},
    },
    {
      name: "no-contract-to-client-or-server",
      comment:
        "Client and server both use src/contract, so it must not import from either.",
      severity: "error",
      from: {path: "^src/contract/"},
      to: {path: "^src/(client|server)/"},
    },
    {
      name: "no-grab-bag-module",
      comment:
        "Name a file for what it holds, not utils or helpers. Add more such names here.",
      severity: "error",
      from: {},
      to: {
        path: String.raw`/(utils|helpers|common|misc|shared|constants|types)\.tsx?$`,
      },
    },
    {
      name: "no-server-value-from-client",
      comment: "src/server never loads client code, so it may import client types only.",
      severity: "error",
      from: {path: "^src/server/"},
      to: {path: "^src/client/", dependencyTypesNot: ["type-only"]},
    },
  ],
  options: {
    tsConfig: {fileName: "tsconfig.json"},
    tsPreCompilationDeps: true,
    doNotFollow: {path: "node_modules"},
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
