import js from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import vitest from "@vitest/eslint-plugin";
import {type Config, defineConfig} from "eslint/config";
import {createTypeScriptImportResolver} from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import noUnsanitized from "eslint-plugin-no-unsanitized";
import security from "eslint-plugin-security";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

const testFiles = [
  "tests/**/*.{ts,tsx}",
  "src/**/*.test.{ts,tsx}",
  "src/**/test-helpers/**/*.{ts,tsx}",
];
const e2eFiles = ["tests/e2e/**/*.ts", "tests/screenshots/**/*.ts"];
const configFiles = [
  "*.config.ts",
  "eslint.config.ts",
  "stryker.config.mjs",
  "stryker-ignore-console.mjs",
  ".dependency-cruiser.mjs",
];
// The one place that reads the environment. Everything else takes parsed config.
const environmentModules = ["src/server/config.ts"];
// The record types of the /events stream and of the Lightstreamer feed.
const wireRecordModules = ["src/contract/stream-record.ts", "src/server/feed-record.ts"];

const resultLibraries = [
  "neverthrow",
  "fp-ts",
  "effect",
  "ts-results",
  "true-myth",
  "oxide.ts",
];
const deepCloneLibraries = ["lodash/cloneDeep", "rfdc", "klona"];

const sourceSyntax = [
  {
    selector: "TSAsExpression > TSAsExpression",
    message: "No `x as unknown as T`.",
  },
  {
    selector: 'TSModuleDeclaration[kind="global"]',
    message: "No `declare global` to silence a missing type.",
  },
  {
    selector: 'TSModuleDeclaration[id.type="Literal"]',
    message: "No `declare module` stub. Install @types or import as unknown.",
  },
  {
    selector: "ExportAllDeclaration",
    message: "No `export *`.",
  },
  {
    selector: "ClassDeclaration:not([superClass])",
    message:
      "A class that extends nothing needs a disable naming what functions over a record could not do.",
  },
  {
    selector: "TSTypeAliasDeclaration[id.name=/^(Result|Either|Ok|Err)$/]",
    message: "No hand-rolled result type.",
  },
];

const environmentSyntax = [
  {
    selector: 'MemberExpression[object.name="process"][property.name="env"]',
    message: "Env is parsed once in the config module.",
  },
  {
    selector: 'MemberExpression[object.type="MetaProperty"][property.name="env"]',
    message: "Env is parsed once in the config module.",
  },
];

const testSyntax = [
  {
    selector: 'Program > VariableDeclaration[kind="let"]',
    message: "No module-level `let` in a test file.",
  },
  {
    selector: 'CallExpression[callee.name="describe"] VariableDeclaration[kind="let"]',
    message: "No shared `let` inside a describe.",
  },
  {
    selector: String.raw`CallExpression[callee.object.name="vi"][callee.property.name="mock"] > Literal[value=/^(\.|@\/)/]`,
    message:
      "vi.mock targets a builtin or third-party module, never one in this codebase.",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^toThrow(Error)?$/] > :matches(Literal[value=type(string)], TemplateLiteral)",
    message:
      "A string argument to toThrow is a substring match. Pass the class or an Error.",
  },
  {
    selector:
      'CallExpression[callee.name="test"] :matches(TryStatement, ForStatement, ForOfStatement, ForInStatement, WhileStatement)',
    message: "A test body holds no try or loop.",
  },
];

// @types/eslint-plugin-no-unsanitized and @types/eslint-plugin-security describe
// ESLint 9 config objects, which ESLint 10's Config rejects. They agree at runtime.
// @ts-expect-error -- see above
const noUnsanitizedConfig: Config = noUnsanitized.configs.recommended;
// @ts-expect-error -- see above
const securityConfig: Config = security.configs.recommended;

export default defineConfig(
  {
    ignores: ["dist/**", "reports/**", ".stryker-tmp/**", "src/harness/node_modules/**"],
  },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  noUnsanitizedConfig,
  securityConfig,
  eslintComments.recommended,
  jsdoc.configs["flat/recommended-typescript-error"],

  {
    languageOptions: {
      globals: {...globals.browser, ...globals.node},
      parserOptions: {
        projectService: {allowDefaultProject: ["*.mjs"]},
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      // Core
      "preserve-caught-error": "error",
      "no-console": ["error", {allow: ["debug", "info", "warn", "error"]}],
      // Vitest reads a fixture's dependencies from the destructuring pattern of
      // its first parameter, so a fixture with none takes `{}`. Fixtures are the
      // shared-setup pattern once `vitest/no-hooks` is on.
      "no-empty-pattern": ["error", {allowObjectPatternsAsParameters: true}],
      // Conflicts with @typescript-eslint/switch-exhaustiveness-check.
      "default-case": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...resultLibraries.map((name) => ({
              name,
              message:
                "Throw is the error channel. Edit this list to adopt a result library.",
            })),
            ...deepCloneLibraries.map((name) => ({
              name,
              message: "A changed copy spreads the field that changes.",
            })),
          ],
        },
      ],
      "no-nested-ternary": "error",
      "no-restricted-syntax": ["error", ...sourceSyntax, ...environmentSyntax],
      // A dedicated rule rather than a selector in sourceSyntax: one file can opt
      // out of it alone, which a JSON wire type needs, where a selector can only
      // go with the whole list. Pair the opt-out with `unicorn/no-null`.
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            null: "`undefined` is the absent value. `null` is converted at the boundary.",
          },
        },
      ],

      // typescript-eslint
      // `const { omitted, ...rest } = record` is how a copy drops a field.
      "@typescript-eslint/no-unused-vars": ["error", {ignoreRestSiblings: true}],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {allowDefaultCaseForExhaustiveSwitch: false},
      ],
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {accessibility: "no-public"},
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
          custom: {regex: "^I[A-Z]|(Type|Interface|Impl)$", match: false},
        },
      ],
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      // Its fix turns a narrowing cast into `!`, which no-non-null-assertion in the
      // strict preset then rejects. The preset wins.
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {assertionStyle: "as", objectLiteralTypeAssertions: "never"},
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // Banning numbers breeds `String(n)` wrappers, and the reflex carries nullish
      // values past the rule. An override resets omitted options to the rule's
      // permissive defaults, not strictTypeChecked's, so all six are restated.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],

      // unicorn
      // TypeScript has no single filename convention, so a project sets its own
      // here. Vite names its own type shim.
      "unicorn/filename-case": [
        "error",
        {case: "kebabCase", ignore: [/^vite-env\.d\.ts$/]},
      ],
      // A prefix list for boolean names. `eq` and `satisfiesSemver` are boolean
      // and well named; the naming prose in the coding skill covers this.
      "unicorn/consistent-boolean-name": "off",
      // A dictionary of abbreviations with no notion of scope: `i` in a three-line
      // loop and `mod` in a mod loader both fail. The naming prose in the coding
      // skill scales name length to scope; this cannot express it, and a project's
      // domain vocabulary hits it through the recommended set.
      "unicorn/name-replacements": "off",
      // This is on by default and requires parenthesis around nested ternaries rather
      // than banning them. Core rule above bans them correctly.
      "unicorn/no-nested-ternary": "off",
      // A fixture with nothing to hand its test still passes undefined to `use`,
      // which the rule cannot tell from a useless argument.
      "unicorn/no-useless-undefined": ["error", {checkArguments: false}],
      // `.dataset` is absent from Element and reads undefined where getAttribute
      // reads null. Attributes keep one kebab-case vocabulary.
      "unicorn/dom-node-dataset": ["error", {preferAttributes: true}],
      // Wants 0xFF; Biome formats to 0xff. Biome owns formatting.
      "unicorn/number-literal-case": "off",
      "unicorn/prefer-import-meta-properties": "error",
      "unicorn/prefer-json-import": "error",
      // These follow build.target in vite.config.ts; revisit them when it moves. Safari
      // 26.0 lacks Iterator.zip, Map#getOrInsertComputed and Element#setHTML, which the
      // first three propose; jsdom 30, which runs the client tests, also lacks getHTML().
      // Every target has the APIs the last three propose.
      "unicorn/prefer-iterator-zip": "off",
      "unicorn/prefer-get-or-insert-computed": "off",
      "unicorn/prefer-dom-node-html-methods": "off",
      "unicorn/prefer-regexp-escape": "error",
      "unicorn/prefer-uint8array-base64": "error",
      "unicorn/prefer-uint8array-hex": "error",
      "unicorn/expiring-todo-comments": ["error", {allowWarningComments: false}],
      // A one-line JSDoc is a block comment by definition.
      "unicorn/single-line-block-comment-style": [
        "error",
        "single-line",
        {ignore: [String.raw`^\*`]},
      ],

      // import-x
      "import-x/no-default-export": "error",
      // tsc checks that a default export exists. The other two misfire on plugin objects.
      "import-x/default": "off",
      "import-x/no-named-as-default": "off",
      "import-x/no-named-as-default-member": "off",

      // eslint-comments
      "@eslint-community/eslint-comments/require-description": "error",

      // security. Flags every non-literal path and cannot check containment.
      "security/detect-non-literal-fs-filename": "off",
      // Flags every computed property access and cannot tell user input from an
      // internal record.
      "security/detect-object-injection": "off",

      // functional: eslint-plugin-functional is not installed. Store, Relay, Clock,
      // App, the telemetry index and the Lightstreamer fakes are mutable classes by
      // design, which functional/immutable-data, functional/prefer-immutable-types
      // and functional/type-declaration-immutability each reject.

      // jsdoc
      "jsdoc/check-indentation": "error",
      "jsdoc/check-line-alignment": "error",
      "jsdoc/no-types": "error",
      "jsdoc/informative-docs": "error",
      // Earns its place at a package boundary, and this repo exports to nothing but itself.
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },

  {
    files: environmentModules,
    rules: {
      "no-restricted-syntax": ["error", ...sourceSyntax],
    },
  },

  {
    files: wireRecordModules,
    rules: {
      // The wire protocol carries JSON null for an absent value, and Lightstreamer's
      // getValue returns null for an absent field. The record types mirror both.
      "unicorn/no-null": "off",
      "@typescript-eslint/no-restricted-types": "off",
    },
  },

  {
    files: ["src/server/**/*.ts", "src/harness/**/*.ts"],
    ignores: testFiles,
    rules: {
      // The server and the harness are command-line programs, and their log is stdout.
      "no-console": ["error", {allow: ["log", "debug", "info", "warn", "error"]}],
    },
  },

  {
    files: configFiles,
    // A config module is glue for untyped plugin objects, not product code.
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // The loader requires a default export.
      "import-x/no-default-export": "off",
    },
  },

  {
    files: testFiles,
    // Playwright drives tests/e2e and tests/screenshots. Their specs take the block below, not these.
    ignores: e2eFiles,
    ...vitest.configs.recommended,
    settings: {
      // A test built with test.extend in a test-helpers module is still a test. Any
      // file name and import extension match. vite.config.ts and
      // stryker.config.mjs leave the same directory out of coverage and mutation.
      vitest: {vitestImports: [/\/test-helpers\/[^/]+$/]},
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/consistent-test-it": ["error", {fn: "test"}],
      "vitest/max-nested-describe": ["error", {max: 1}],
      "vitest/require-top-level-describe": "off",
      "vitest/valid-title": ["error", {disallowedWords: ["should"]}],
      // Shared setup is a fixture from test.extend in a test-helpers module, which
      // the settings above recognise.
      "vitest/no-hooks": "error",
      "vitest/prefer-called-with": "error",
      "vitest/prefer-strict-equal": "error",
      "vitest/no-restricted-matchers": [
        "error",
        {
          toBeTruthy: "Weak assertion. Assert the value.",
          toBeDefined: "Weak assertion. Assert the value.",
          toMatchObject: "Weak assertion. Use toStrictEqual.",
          toMatchSnapshot: "A snapshot proves nothing.",
          toThrowErrorMatchingSnapshot: "A snapshot proves nothing.",
        },
      ],
      // The tests assert through vitest's chai `assert` as well as `expect`. A project
      // with a property-testing library adds its runner here, such as `fc.assert`.
      "vitest/expect-expect": [
        "error",
        {assertFunctionNames: ["expect", "assert", "assert.*"]},
      ],
      "vitest/no-conditional-in-test": "error",
      "vitest/no-conditional-tests": "error",
      "vitest/no-conditional-expect": "error",
      "@typescript-eslint/return-await": ["error", "always"],
      "no-restricted-globals": [
        "error",
        {
          name: "setTimeout",
          message: "No sleep in a test. Fake timers or an injected clock.",
        },
        {
          name: "setInterval",
          message: "No sleep in a test. Fake timers or an injected clock.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...sourceSyntax,
        ...environmentSyntax,
        ...testSyntax,
      ],
    },
  },

  {
    files: e2eFiles,
    rules: {
      "no-restricted-syntax": [
        "error",
        ...sourceSyntax,
        ...environmentSyntax,
        {
          selector: 'CallExpression[callee.property.name="waitForTimeout"]',
          message: "No sleep in a test. Wait on the locator or the response.",
        },
      ],
    },
  },
);
