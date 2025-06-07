import { exec } from "child_process";
import ts from "typescript";

const args = process.argv;

const preOptionIndex = args.findIndex((arg) => arg === "--pre");
const preScript: string | undefined = args[preOptionIndex + 1];

const postOptionIndex = args.findIndex((arg) => arg === "--post");
const postScript: string | undefined = args[postOptionIndex + 1];

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
  exec(`node ${script}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
    console.log(stdout);
    console.error(stderr);
  });
}

function getConfig(): string {
  const config = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
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
