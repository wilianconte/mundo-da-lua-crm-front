"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Client = {
  id: string;
  name: string;
  document: string;
  phone: string;
  status: "Ativo" | "Em analise" | "Inativo";
  city: string;
};

type FilterFieldKey = "name" | "document" | "status" | "city";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;

type FilterField = {
  key: FilterFieldKey;
  label: string;
  type: FieldType;
};

type FilterChip = {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

const filterFields: FilterField[] = [
  { key: "name", label: "Nome", type: "text" },
  { key: "document", label: "CPF/CNPJ", type: "text" },
  { key: "status", label: "Status", type: "category" },
  { key: "city", label: "Cidade", type: "text" }
];

const textOperators: Array<{ key: TextOperator; label: string }> = [
  { key: "contains", label: "contem" },
  { key: "equals", label: "e exatamente" },
  { key: "startsWith", label: "comeca com" }
];

const categoryOperators: Array<{ key: CategoryOperator; label: string }> = [
  { key: "equals", label: "e igual a" },
  { key: "notEquals", label: "e diferente de" }
];

const clients: Client[] = [
  {
    id: "CLI-1038",
    name: "Amanda Oliveira",
    document: "123.456.789-01",
    phone: "(11) 98765-1122",
    status: "Ativo",
    city: "Sao Paulo"
  },
  {
    id: "CLI-1094",
    name: "Bruno Martins",
    document: "987.654.321-00",
    phone: "(11) 97654-4432",
    status: "Em analise",
    city: "Campinas"
  },
  {
    id: "CLI-1142",
    name: "Carla Menezes",
    document: "204.881.660-90",
    phone: "(21) 98871-2204",
    status: "Ativo",
    city: "Rio de Janeiro"
  },
  {
    id: "CLI-1177",
    name: "Diego Santana",
    document: "777.001.993-10",
    phone: "(31) 99555-4400",
    status: "Inativo",
    city: "Belo Horizonte"
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function evaluateText(fieldValue: string, operator: TextOperator, filterValue: string) {
  const source = normalize(fieldValue);
  const target = normalize(filterValue);

  if (!target) return true;
  if (operator === "equals") return source === target;
  if (operator === "startsWith") return source.startsWith(target);
  return source.includes(target);
}

function evaluateCategory(fieldValue: string, operator: CategoryOperator, filterValue: string) {
  const source = normalize(fieldValue);
  const target = normalize(filterValue);

  if (!target) return true;
  return operator === "equals" ? source === target : source !== target;
}

export function ClientSearchView() {
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableOperators = selectedField?.type === "category" ? categoryOperators : textOperators;

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const byChips = chips.every((chip) => {
        const value = String(client[chip.field.key]);
        if (chip.field.type === "category") {
          return evaluateCategory(value, chip.operator as CategoryOperator, chip.value);
        }
        return evaluateText(value, chip.operator as TextOperator, chip.value);
      });

      if (!byChips) return false;
      if (!freeQuery.trim()) return true;

      const query = normalize(freeQuery);
      return normalize(client.name).includes(query) || normalize(client.document).includes(query);
    });
  }, [chips, freeQuery]);

  function openFieldDropdown() {
    setIsFieldDropdownOpen(true);
  }

  function selectField(field: FilterField) {
    setSelectedField(field);
    setSelectedOperator(field.type === "category" ? "equals" : "contains");
    setIsFieldDropdownOpen(false);
    setSearchInput("");
    setFreeQuery("");
    inputRef.current?.focus();
  }

  function addChip() {
    if (!selectedField) return;
    const value = searchInput.trim();
    if (!value) return;

    const chip: FilterChip = {
      id: `${selectedField.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      field: selectedField,
      operator: selectedOperator,
      value
    };

    setChips((current) => [...current, chip]);
    setSearchInput("");
    setIsFieldDropdownOpen(false);
  }

  function handleInputChange(value: string) {
    setSearchInput(value);

    if (selectedField) return;

    if (value.includes("@")) {
      setIsFieldDropdownOpen(true);
      setFreeQuery("");
      return;
    }

    setIsFieldDropdownOpen(false);
    setFreeQuery(value);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!selectedField) return;
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    addChip();
  }

  function removeChip(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          Clientes
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Pesquisa de clientes</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Omnisearch com filtros tokenizados e busca livre global por nome e documento.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de clientes</CardTitle>
          <CardDescription>
            Digite @ para escolher um atributo de filtro ou use busca livre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            {selectedField ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="attention">{selectedField.label}</Badge>
                <select
                  aria-label="Operador logico"
                  className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                  onChange={(event) => setSelectedOperator(event.target.value as FilterOperator)}
                  value={selectedOperator}
                >
                  {availableOperators.map((operator) => (
                    <option key={operator.key} value={operator.key}>
                      {operator.label}
                    </option>
                  ))}
                </select>
                <button
                  className="text-xs font-medium text-[var(--color-muted-foreground)] underline-offset-2 hover:underline"
                  onClick={() => {
                    setSelectedField(null);
                    setSearchInput("");
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  trocar atributo
                </button>
              </div>
            ) : null}

            <div className="relative flex flex-wrap items-center gap-3">
              <div className="relative min-w-72 flex-1">
                <Input
                  onChange={(event) => handleInputChange(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    selectedField
                      ? `Digite um valor para ${selectedField.label}`
                      : "Digite para busca livre ou use @ para filtrar"
                  }
                  ref={inputRef}
                  value={searchInput}
                />
                <button
                  aria-label="Adicionar filtro"
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                  onClick={openFieldDropdown}
                  type="button"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <Button
                leadingIcon={<Search className="size-4" />}
                onClick={() => {
                  if (selectedField) addChip();
                }}
              >
                Filtrar
              </Button>

              {isFieldDropdownOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.45rem)] z-20 w-52 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-soft)]">
                  {filterFields.map((field) => (
                    <button
                      className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
                      key={field.key}
                      onClick={() => selectField(field)}
                      type="button"
                    >
                      <span>{field.label}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">@</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Finalize filtros com Enter/Tab para gerar chips.
              </p>
            </div>
          </div>

          {chips.length ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => {
                const operatorLabel =
                  [...textOperators, ...categoryOperators].find(
                    (operator) => operator.key === chip.operator
                  )?.label ?? chip.operator;

                return (
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-foreground)]"
                    key={chip.id}
                  >
                    {chip.field.label} {operatorLabel} {chip.value}
                    <button
                      aria-label={`Remover filtro ${chip.field.label}`}
                      className="inline-flex size-4 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]"
                      onClick={() => removeChip(chip.id)}
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Codigo</th>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Telefone</th>
                  <th className="px-4 py-3 font-semibold">Cidade</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr className="border-t border-[var(--color-border)]" key={client.id}>
                    <td className="px-4 py-3 font-medium">{client.id}</td>
                    <td className="px-4 py-3">{client.name}</td>
                    <td className="px-4 py-3">{client.document}</td>
                    <td className="px-4 py-3">{client.phone}</td>
                    <td className="px-4 py-3">{client.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant={client.status === "Ativo" ? "success" : "attention"}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline">
                        Abrir ficha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {filteredClients.length} clientes encontrados com os filtros atuais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
