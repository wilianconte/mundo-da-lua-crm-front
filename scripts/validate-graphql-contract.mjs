import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const DEFAULT_CONTRACT_URL = "https://crm-core.dev.espacomundodalua.com/contracts/schema.graphql";

function listSourceFiles() {
  const output = execSync("git ls-files 'src/**/*.ts' 'src/**/*.tsx'", { encoding: "utf-8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractOperations(content) {
  const operations = [];
  const templateRegex = /`([\s\S]*?)`/g;

  for (const match of content.matchAll(templateRegex)) {
    const candidate = match[1]?.trim();
    if (!candidate) {
      continue;
    }

    if (/\b(query|mutation|subscription)\s+[A-Za-z0-9_]+/.test(candidate)) {
      operations.push(candidate);
    }
  }

  return operations;
}

async function loadSchemaSDL() {
  const contractUrl = process.env.GRAPHQL_CONTRACT_URL ?? DEFAULT_CONTRACT_URL;
  const response = await fetch(contractUrl, {
    headers: {
      Accept: "text/plain"
    }
  });

  if (!response.ok) {
    throw new Error(`Nao foi possivel baixar o contrato GraphQL (${response.status} ${response.statusText}) em ${contractUrl}`);
  }

  return response.text();
}

function extractTypeFields(schemaSDL, typeName) {
  const typeRegex = new RegExp(`type\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`, "m");
  const match = schemaSDL.match(typeRegex);
  if (!match) {
    return new Set();
  }

  const block = match[1];
  const fields = new Set();
  const lines = block.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const fieldMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(\(|:)/);
    if (fieldMatch) {
      fields.add(fieldMatch[1]);
    }
  }

  return fields;
}

function stripComments(operation) {
  return operation
    .split("\n")
    .map((line) => line.replace(/#.*/, ""))
    .join("\n");
}

function extractRootField(operation) {
  const cleaned = stripComments(operation);
  const operationMatch = cleaned.match(/\b(query|mutation|subscription)\s+([A-Za-z0-9_]+)?[\s\S]*?\{/);

  if (!operationMatch) {
    return null;
  }

  const operationType = operationMatch[1];
  const startIndex = cleaned.indexOf("{", operationMatch.index ?? 0);

  if (startIndex < 0) {
    return null;
  }

  let depth = 0;
  let token = "";

  for (let index = startIndex; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        break;
      }
      continue;
    }

    if (depth === 1) {
      if (/[_A-Za-z0-9]/.test(char)) {
        token += char;
        continue;
      }

      if (token.length > 0) {
        return { operationType, fieldName: token };
      }
    }
  }

  if (token.length > 0) {
    return { operationType, fieldName: token };
  }

  return null;
}

function validateOperations(schemaSDL, operationsByFile) {
  const queryFields = extractTypeFields(schemaSDL, "Query");
  const mutationFields = extractTypeFields(schemaSDL, "Mutation");
  const subscriptionFields = extractTypeFields(schemaSDL, "Subscription");
  const errors = [];

  for (const [filePath, operations] of operationsByFile.entries()) {
    for (const operation of operations) {
      const root = extractRootField(operation);

      if (!root) {
        errors.push(`${filePath}:\n  - Nao foi possivel identificar o campo raiz da operacao.`);
        continue;
      }

      const knownFields =
        root.operationType === "query"
          ? queryFields
          : root.operationType === "mutation"
            ? mutationFields
            : subscriptionFields;

      if (!knownFields.has(root.fieldName)) {
        errors.push(
          `${filePath}:\n  - Campo raiz \"${root.fieldName}\" nao encontrado em type ${root.operationType[0].toUpperCase()}${root.operationType.slice(1)} do contrato.`
        );
      }
    }
  }

  return errors;
}

async function main() {
  const files = listSourceFiles();
  const operationsByFile = new Map();

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const operations = extractOperations(content);
    if (operations.length > 0) {
      operationsByFile.set(filePath, operations);
    }
  }

  if (operationsByFile.size === 0) {
    console.log("Nenhuma operacao GraphQL encontrada nos arquivos TypeScript.");
    return;
  }

  const schemaSDL = await loadSchemaSDL();
  const errors = validateOperations(schemaSDL, operationsByFile);

  if (errors.length > 0) {
    console.error("Foram encontrados erros de compatibilidade entre front e contrato GraphQL:\n");
    console.error(errors.join("\n\n"));
    process.exit(1);
  }

  console.log(`Contrato GraphQL validado com sucesso para ${operationsByFile.size} arquivo(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
