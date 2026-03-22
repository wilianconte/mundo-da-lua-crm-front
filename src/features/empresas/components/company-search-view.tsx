"use client";

import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCompanies,
  type CompanyFilterInput,
  type CompanyNode,
  type CompanyStatus,
  type CompanyType,
  type GetCompaniesVariables
} from "@/features/empresas/api/get-companies";
import { GraphQLRequestError } from "@/lib/graphql/client";

type FilterFieldKey =
  | "legalName"
  | "tradeName"
  | "registrationNumber"
  | "email"
  | "primaryPhone"
  | "industry"
  | "status"
  | "companyType";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn = "legalName" | "registrationNumber" | "primaryPhone" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

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

const PAGE_SIZE = 8;

const filterFields: FilterField[] = [
  { key: "legalName", label: "Razao social", type: "text" },
  { key: "tradeName", label: "Nome fantasia", type: "text" },
  { key: "registrationNumber", label: "CNPJ", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "primaryPhone", label: "Telefone", type: "text" },
  { key: "industry", label: "Segmento", type: "text" },
  { key: "status", label: "Status", type: "category" },
  { key: "companyType", label: "Tipo", type: "category" }
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

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusEnum(value: string): CompanyStatus | null {
  const normalized = normalize(value);

  if (normalized === "active" || normalized === "ativo") return "ACTIVE";
  if (normalized === "inactive" || normalized === "inativo") return "INACTIVE";
  if (normalized === "blocked" || normalized === "bloqueado") return "BLOCKED";
  if (normalized === "suspended" || normalized === "suspenso") return "SUSPENDED";

  return null;
}

function toCompanyTypeEnum(value: string): CompanyType | null {
  const normalized = normalize(value).replace(/\s+/g, "_");
  const entries: Record<string, CompanyType> = {
    supplier: "SUPPLIER",
    fornecedor: "SUPPLIER",
    partner: "PARTNER",
    parceiro: "PARTNER",
    school: "SCHOOL",
    escola: "SCHOOL",
    corporate_customer: "CORPORATE_CUSTOMER",
    cliente_corporativo: "CORPORATE_CUSTOMER",
    billing_account: "BILLING_ACCOUNT",
    conta_faturamento: "BILLING_ACCOUNT",
    service_provider: "SERVICE_PROVIDER",
    prestador: "SERVICE_PROVIDER",
    sponsor: "SPONSOR",
    patrocinador: "SPONSOR",
    other: "OTHER",
    outro: "OTHER"
  };

  return entries[normalized] ?? null;
}

function toStatusLabel(status: CompanyStatus) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "INACTIVE") return "Inativo";
  if (status === "BLOCKED") return "Bloqueado";
  return "Suspenso";
}

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR");
}

function mapSortColumn(column: SortableColumn) {
  if (column === "legalName") return "legalName";
  if (column === "registrationNumber") return "registrationNumber";
  if (column === "primaryPhone") return "primaryPhone";
  if (column === "status") return "status";
  return "createdAt";
}

function mapTextOperator(operator: TextOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

type CursorMode = "forward" | "backward";

export function CompanySearchView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("legalName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<CompanyNode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [pageStartCursor, setPageStartCursor] = useState<string | null>(null);
  const [pageEndCursor, setPageEndCursor] = useState<string | null>(null);
  const [requestAfter, setRequestAfter] = useState<string | null>(null);
  const [requestBefore, setRequestBefore] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<CursorMode>("forward");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableOperators = selectedField?.type === "category" ? categoryOperators : textOperators;

  const where = useMemo<CompanyFilterInput | null>(() => {
    const nextWhere: CompanyFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.or = [
        { legalName: { contains: freeQuery.trim() } },
        { tradeName: { contains: freeQuery.trim() } },
        { registrationNumber: { contains: freeQuery.trim() } },
        { email: { contains: freeQuery.trim() } }
      ];
    }

    for (const chip of chips) {
      if (chip.field.key === "status") {
        const status = toStatusEnum(chip.value);
        if (!status) continue;
        nextWhere.status = chip.operator === "notEquals" ? { neq: status } : { eq: status };
        continue;
      }

      if (chip.field.key === "companyType") {
        const companyType = toCompanyTypeEnum(chip.value);
        if (!companyType) continue;
        nextWhere.companyType = chip.operator === "notEquals" ? { neq: companyType } : { eq: companyType };
        continue;
      }

      const key = chip.field.key;
      const value = chip.value.trim();
      if (!value) continue;

      const operator = mapTextOperator(chip.operator as TextOperator);
      nextWhere[key] = { [operator]: value };
    }

    return Object.keys(nextWhere).length ? nextWhere : null;
  }, [chips, freeQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanies() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetCompaniesVariables = {
          where,
          order: [{ [mapSortColumn(sortBy)]: sortDirection === "asc" ? "ASC" : "DESC" }]
        };

        if (cursorMode === "backward") {
          variables.last = PAGE_SIZE;
          variables.before = requestBefore;
        } else {
          variables.first = PAGE_SIZE;
          variables.after = requestAfter;
        }

        if (!requestBefore && !requestAfter) {
          variables.first = PAGE_SIZE;
          variables.after = null;
          delete variables.last;
          delete variables.before;
        }

        const response = await getCompanies(variables);
        if (!isMounted) return;

        setRows(response.nodes ?? []);
        setTotalCount(response.totalCount ?? 0);
        setHasNextPage(Boolean(response.pageInfo?.hasNextPage));
        setHasPreviousPage(Boolean(response.pageInfo?.hasPreviousPage));
        setPageStartCursor(response.pageInfo?.startCursor ?? null);
        setPageEndCursor(response.pageInfo?.endCursor ?? null);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof GraphQLRequestError
            ? error.message
            : "Nao foi possivel carregar a pesquisa de empresas.";
        setRows([]);
        setTotalCount(0);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      isMounted = false;
    };
  }, [where, sortBy, sortDirection, cursorMode, requestAfter, requestBefore]);

  function resetToFirstPage() {
    setCursorMode("forward");
    setRequestAfter(null);
    setRequestBefore(null);
  }

  function toggleSort(column: SortableColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
      resetToFirstPage();
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  }

  function renderSortIcon(column: SortableColumn) {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  }

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
    resetToFirstPage();
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
    resetToFirstPage();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!selectedField) return;
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    addChip();
  }

  function removeChip(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
    resetToFirstPage();
  }

  function openEditCompany(company: CompanyNode) {
    const params = new URLSearchParams({
      mode: "edit",
      id: company.id
    });

    router.push(`/empresas/cadastro?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Empresas</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Pesquisa de empresas</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Omnisearch com filtros tokenizados e busca livre global por razao social, nome fantasia e CNPJ.
            </p>
          </div>
          <Button
            className="min-w-40"
            leadingIcon={<Plus className="size-4" />}
            onClick={() => router.push("/empresas/cadastro")}
          >
            Adicionar
          </Button>
        </div>
      </section>

      <section className="space-y-5">
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
                [...textOperators, ...categoryOperators].find((operator) => operator.key === chip.operator)?.label ??
                chip.operator;

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

        {errorMessage ? (
          <p className="text-sm font-medium text-[var(--color-danger-strong)]">{errorMessage}</p>
        ) : null}

        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                    onClick={() => toggleSort("legalName")}
                    type="button"
                  >
                    Razao social
                    {renderSortIcon("legalName")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Nome fantasia</th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                    onClick={() => toggleSort("registrationNumber")}
                    type="button"
                  >
                    CNPJ
                    {renderSortIcon("registrationNumber")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                    onClick={() => toggleSort("primaryPhone")}
                    type="button"
                  >
                    Telefone
                    {renderSortIcon("primaryPhone")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                    onClick={() => toggleSort("status")}
                    type="button"
                  >
                    Status
                    {renderSortIcon("status")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    className="inline-flex items-center gap-1 text-left transition hover:text-[var(--color-foreground)]"
                    onClick={() => toggleSort("createdAt")}
                    type="button"
                  >
                    Criado em
                    {renderSortIcon("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={7}>
                    Carregando empresas...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((company) => (
                  <tr
                    className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
                    key={company.id}
                  >
                    <td className="px-4 py-3">{company.legalName}</td>
                    <td className="px-4 py-3">{company.tradeName ?? "-"}</td>
                    <td className="px-4 py-3">{company.registrationNumber ?? "-"}</td>
                    <td className="px-4 py-3">{company.primaryPhone ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={company.status === "ACTIVE" ? "success" : "attention"}>
                        {toStatusLabel(company.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{toDateTime(company.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button onClick={() => openEditCompany(company)} size="sm" variant="outline">
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={7}>
                    Nenhuma empresa encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {totalCount} empresas encontradas com os filtros atuais.
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={isLoading || !hasPreviousPage || !pageStartCursor}
              onClick={() => {
                setCursorMode("backward");
                setRequestAfter(null);
                setRequestBefore(pageStartCursor);
              }}
              size="sm"
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={isLoading || !hasNextPage || !pageEndCursor}
              onClick={() => {
                setCursorMode("forward");
                setRequestBefore(null);
                setRequestAfter(pageEndCursor);
              }}
              size="sm"
              variant="outline"
            >
              Proxima
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
