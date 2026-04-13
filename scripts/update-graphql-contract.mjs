import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const CONTRACT_URL = "https://crm-core.dev.espacomundodalua.com/contracts/schema.graphql";
const LOCAL_SCHEMA_PATH = resolve(process.cwd(), "contracts/schema.graphql");

function diffSchemas(previous, next) {
  const prevLines = new Set(previous.split("\n").map((l) => l.trim()).filter(Boolean));
  const nextLines = new Set(next.split("\n").map((l) => l.trim()).filter(Boolean));

  const added = [...nextLines].filter((l) => !prevLines.has(l));
  const removed = [...prevLines].filter((l) => !nextLines.has(l));

  return { added, removed };
}

async function main() {
  const response = await fetch(CONTRACT_URL, { headers: { Accept: "text/plain" } });

  if (!response.ok) {
    throw new Error(`Nao foi possivel baixar o contrato GraphQL (${response.status} ${response.statusText})`);
  }

  const newSchema = await response.text();

  const hasExisting = existsSync(LOCAL_SCHEMA_PATH);
  const previousSchema = hasExisting ? readFileSync(LOCAL_SCHEMA_PATH, "utf-8") : null;

  if (previousSchema && previousSchema === newSchema) {
    console.log("Contrato GraphQL ja esta atualizado.");
    return;
  }

  mkdirSync(dirname(LOCAL_SCHEMA_PATH), { recursive: true });
  writeFileSync(LOCAL_SCHEMA_PATH, newSchema, "utf-8");

  if (!previousSchema) {
    console.log(`Contrato GraphQL salvo em ${LOCAL_SCHEMA_PATH}.`);
    return;
  }

  const { added, removed } = diffSchemas(previousSchema, newSchema);

  console.log("Contrato GraphQL atualizado.\n");

  if (removed.length > 0) {
    console.log("Removido:");
    for (const line of removed) {
      console.log(`  - ${line}`);
    }
  }

  if (added.length > 0) {
    console.log("Adicionado:");
    for (const line of added) {
      console.log(`  + ${line}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
