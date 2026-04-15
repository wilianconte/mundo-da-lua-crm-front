import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const inputDir = path.join(workspaceRoot, "build", "input");
const outputDir = path.join(workspaceRoot, "build", "output");
const stateFile = path.join(outputDir, ".request-heartbeat-state.json");
const heartbeatJsonFile = path.join(outputDir, "_heartbeat.json");
const heartbeatMdFile = path.join(outputDir, "_heartbeat.md");
const pollIntervalMs = Number(process.env.BUILD_REQUEST_HEARTBEAT_MS ?? 5000);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatDate(value) {
  return new Date(value).toISOString();
}

function listFilesRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listFilesRecursively(fullPath);
    }

    return [fullPath];
  });
}

function readState() {
  if (!fs.existsSync(stateFile)) {
    return { requests: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return { requests: {} };
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getProcessedMarkerPath(inputFullPath) {
  const relativeFromInput = path.relative(inputDir, inputFullPath);
  return path.join(outputDir, ".processed", `${relativeFromInput}.done`);
}

function removeEmptyParentDirectories(startDir, stopDir) {
  let currentDir = startDir;

  while (currentDir.startsWith(stopDir) && currentDir !== stopDir) {
    if (!fs.existsSync(currentDir)) {
      currentDir = path.dirname(currentDir);
      continue;
    }

    if (fs.readdirSync(currentDir).length > 0) {
      break;
    }

    fs.rmdirSync(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

function cleanupProcessedInputs(state) {
  const inputFiles = listFilesRecursively(inputDir);

  for (const inputFullPath of inputFiles) {
    const markerPath = getProcessedMarkerPath(inputFullPath);
    if (!fs.existsSync(markerPath)) {
      continue;
    }

    const relativePath = path.relative(workspaceRoot, inputFullPath).replaceAll("\\", "/");
    const markerStats = fs.statSync(markerPath);

    fs.unlinkSync(inputFullPath);
    removeEmptyParentDirectories(path.dirname(inputFullPath), inputDir);

    delete state.requests[relativePath];
    console.log(`Solicitacao removida apos processamento: ${relativePath}`);

    const processedLog = state.processed ?? {};
    processedLog[relativePath] = {
      deletedAt: formatDate(Date.now()),
      markerPath: path.relative(workspaceRoot, markerPath).replaceAll("\\", "/"),
      markerUpdatedAt: formatDate(markerStats.mtimeMs)
    };
    state.processed = processedLog;
  }
}

function writeHeartbeatMarkdown(snapshot) {
  const lines = [
    "# Heartbeat de Solicitacoes",
    "",
    `Atualizado em: ${snapshot.generatedAt}`,
    `Intervalo de varredura: ${snapshot.pollIntervalMs}ms`,
    "",
    "## Entradas",
    ""
  ];

  if (!snapshot.requests.length) {
    lines.push("Nenhuma solicitacao encontrada em `build/input`.");
  } else {
    for (const request of snapshot.requests) {
      lines.push(`- ${request.relativePath}`);
      lines.push(`  status: ${request.status}`);
      lines.push(`  atualizado em: ${request.updatedAt}`);
      if (request.firstSeenAt) {
        lines.push(`  visto pela primeira vez em: ${request.firstSeenAt}`);
      }
      if (request.lastOutputAt) {
        lines.push(`  ultima saida registrada em: ${request.lastOutputAt}`);
      }
    }
  }

  lines.push("");
  lines.push("## Observacao");
  lines.push("");
  lines.push("Este heartbeat apenas monitora arquivos e registra pendencias.");
  lines.push("A implementacao da solicitacao continua dependendo da execucao do agente neste workspace.");
  lines.push("");

  fs.writeFileSync(heartbeatMdFile, `${lines.join("\n")}\n`, "utf8");
}

function buildSnapshot(state) {
  const requestFiles = listFilesRecursively(inputDir)
    .map((fullPath) => {
      const stats = fs.statSync(fullPath);
      const relativePath = path.relative(workspaceRoot, fullPath).replaceAll("\\", "/");
      const currentFingerprint = `${stats.size}:${stats.mtimeMs}`;
      const existing = state.requests[relativePath];

      let status = existing?.status ?? "pending";
      if (!existing || existing.fingerprint !== currentFingerprint) {
        status = "pending";
      }

      state.requests[relativePath] = {
        fingerprint: currentFingerprint,
        firstSeenAt: existing?.firstSeenAt ?? formatDate(Date.now()),
        updatedAt: formatDate(stats.mtimeMs),
        status,
        lastOutputAt: existing?.lastOutputAt ?? null
      };

      return {
        relativePath,
        updatedAt: state.requests[relativePath].updatedAt,
        firstSeenAt: state.requests[relativePath].firstSeenAt,
        status: state.requests[relativePath].status,
        lastOutputAt: state.requests[relativePath].lastOutputAt
      };
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const livePaths = new Set(requestFiles.map((item) => item.relativePath));

  for (const relativePath of Object.keys(state.requests)) {
    if (!livePaths.has(relativePath)) {
      delete state.requests[relativePath];
    }
  }

  return {
    generatedAt: formatDate(Date.now()),
    pollIntervalMs,
    requests: requestFiles
  };
}

function runHeartbeat() {
  ensureDir(inputDir);
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, ".processed"));

  const state = readState();
  cleanupProcessedInputs(state);
  const snapshot = buildSnapshot(state);

  writeJson(stateFile, state);
  writeJson(heartbeatJsonFile, snapshot);
  writeHeartbeatMarkdown(snapshot);
}

runHeartbeat();

setInterval(runHeartbeat, pollIntervalMs);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

console.log(`Heartbeat ativo. Monitorando ${inputDir}`);
