import { execFileSync } from "child_process";
import ts from "typescript";

const args = process.argv;

const rootIndex = args.findIndex((arg) => arg === "--root");
const root = rootIndex !== -1 ? args[rootIndex + 1] : "./";

const preOptionIndex = args.findIndex((arg) => arg === "--pre");
const preScript = preOptionIndex !== -1 ? args[preOptionIndex + 1] : undefined;

const postOptionIndex = args.findIndex((arg) => arg === "--post");
const postScript =
  postOptionIndex !== -1 ? args[postOptionIndex + 1] : undefined;

const formatHost: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getCanonicalFileName: (fileName: string): string => fileName,
  getNewLine: (): string => ts.sys.newLine
};

const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

function watch() {
  const host = ts.createWatchCompilerHost(
    getConfig(),
    {},
    ts.sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatusChanged
  );

  if (preScript) {
    const originalPreProgramCreate = host.createProgram;
    host.createProgram = (
      rootNames: readonly string[] | undefined,
      options,
      host,
      oldProgram
    ) => {
      execute(preScript);
      return originalPreProgramCreate(rootNames, options, host, oldProgram);
    };
  }

  if (postScript) {
    const originalPostProgramCreate = host.afterProgramCreate;
    host.afterProgramCreate = (program) => {
      execute(postScript);
      originalPostProgramCreate!(program);
    };
  }

  ts.createWatchProgram(host);
}

function execute(script: string) {
  try {
    execFileSync("node", [script], { stdio: "inherit" });
  } catch (error) {
    console.error(error);
  }
}

function getConfig(): string {
  const config = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!config) {
    throw new Error('Could not find "tsconfig.json"!');
  }
  return config;
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
  console.error(
    "Error",
    diagnostic.code,
    ":",
    ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )
  );
}

function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
  console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

watch();
