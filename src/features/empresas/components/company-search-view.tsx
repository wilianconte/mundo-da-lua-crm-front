"use client";

import { ArrowDown, ArrowUp, Building2, Plus, Search, X } from "lucide-react";
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

function toCompanyTypeLabel(companyType?: CompanyType | null) {
  if (!companyType) return "-";

  const labels: Record<CompanyType, string> = {
    SUPPLIER: "Fornecedor",
    PARTNER: "Parceiro",
    SCHOOL: "Escola",
    CORPORATE_CUSTOMER: "Cliente corporativo",
    BILLING_ACCOUNT: "Conta faturamento",
    SERVICE_PROVIDER: "Prestador",
    SPONSOR: "Patrocinador",
    OTHER: "Outro"
  };

  return labels[companyType];
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

  function selectField(field: FilterField) {
    setSelectedField(field);
    setSelectedOperator(field.type === "category" ? "equals" : "contains");
    setIsFieldDropdownOpen(false);
    setSearchInput("");
    setFreeQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function clearSelection() {
    setSelectedField(null);
    setSelectedOperator("contains");
    setSearchInput("");
    inputRef.current?.focus();
  }

  function addChip() {
    const value = searchInput.trim();
    if (!value || !selectedField) {
      if (value) {
        setFreeQuery(value);
        resetToFirstPage();
      }
      return;
    }

    const chip: FilterChip = {
      id: `${selectedField.key}-${selectedOperator}-${value}-${Date.now()}`,
      field: selectedField,
      operator: selectedOperator,
      value
    };

    setChips((current) => [...current, chip]);
    setSearchInput("");
    setSelectedField(null);
    setSelectedOperator("contains");
    resetToFirstPage();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function removeChip(chipId: string) {
    setChips((current) => current.filter((chip) => chip.id !== chipId));
    resetToFirstPage();
  }

  function clearAllFilters() {
    setChips([]);
    setFreeQuery("");
    setSearchInput("");
    setSelectedField(null);
    setSelectedOperator("contains");
    resetToFirstPage();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addChip();
      return;
    }

    if (event.key === "Backspace" && !searchInput && selectedField) {
      event.preventDefault();
      clearSelection();
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Empresas</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Pesquisa de empresas</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Consulte empresas por nome, CNPJ, tipo, status e principais dados de contato.
            </p>
          </div>
          <Button leadingIcon={<Plus className="size-4" />} onClick={() => router.push("/empresas/cadastro")}>
            Adicionar empresa
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                className="pl-11"
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={selectedField ? `Digite um valor para ${selectedField.label.toLowerCase()}` : "Buscar por razao social, nome fantasia, CNPJ ou e-mail"}
                ref={inputRef}
                value={searchInput}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Button onClick={() => setIsFieldDropdownOpen((current) => !current)} variant="outline">
                  {selectedField ? selectedField.label : "Campo"}
                </Button>
                {isFieldDropdownOpen ? (
                  <div className="absolute z-10 mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]">
                    <div className="space-y-1">
                      {filterFields.map((field) => (
                        <button
                          className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition hover:bg-[var(--color-surface-muted)]"
                          key={field.key}
                          onClick={() => selectField(field)}
                          type="button"
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <select
                className="h-11 min-w-44 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm outline-none focus:border-[var(--color-primary)]"
                onChange={(event) => setSelectedOperator(event.target.value as FilterOperator)}
                value={selectedOperator}
              >
                {availableOperators.map((operator) => (
                  <option key={operator.key} value={operator.key}>
                    {operator.label}
                  </option>
                ))}
              </select>

              <Button onClick={addChip} variant="secondary">
                Aplicar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {freeQuery ? (
              <Badge className="gap-2" variant="neutral">
                Busca livre: {freeQuery}
                <button aria-label="Remover busca livre" onClick={() => setFreeQuery("")} type="button">
                  <X className="size-3.5" />
                </button>
              </Badge>
            ) : null}
            {chips.map((chip) => (
              <Badge className="gap-2" key={chip.id} variant="neutral">
                {chip.field.label} {chip.operator} {chip.value}
                <button aria-label={`Remover filtro ${chip.field.label}`} onClick={() => removeChip(chip.id)} type="button">
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
            {selectedField ? (
              <Badge className="gap-2" variant="attention">
                Campo: {selectedField.label}
                <button aria-label="Limpar campo selecionado" onClick={clearSelection} type="button">
                  <X className="size-3.5" />
                </button>
              </Badge>
            ) : null}
            {(chips.length || freeQuery) ? (
              <Button onClick={clearAllFilters} size="sm" variant="ghost">
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">Resultados</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{totalCount} empresa(s) encontrada(s).</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="px-5 py-8 text-sm font-medium text-[var(--color-danger-strong)]">{errorMessage}</div>
        ) : isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted-foreground)]">Carregando empresas...</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <div className="rounded-full bg-[var(--color-surface-muted)] p-3 text-[var(--color-primary)]">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Nenhuma empresa encontrada.</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Ajuste os filtros ou cadastre uma nova empresa para iniciar a base.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-surface-muted)]/65">
                <tr>
                  {[
                    { key: "legalName", label: "Razao social" },
                    { key: "registrationNumber", label: "CNPJ" },
                    { key: "primaryPhone", label: "Telefone" },
                    { key: "status", label: "Status" },
                    { key: "createdAt", label: "Criado em" }
                  ].map((column) => (
                    <th className="px-5 py-3 text-left font-semibold" key={column.key}>
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort(column.key as SortableColumn)}
                        type="button"
                      >
                        {column.label}
                        {renderSortIcon(column.key as SortableColumn)}
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((company) => (
                  <tr className="hover:bg-[var(--color-surface-muted)]/35" key={company.id}>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-medium">{company.legalName}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {company.tradeName || toCompanyTypeLabel(company.companyType)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{company.registrationNumber || "-"}</td>
                    <td className="px-5 py-4">{company.primaryPhone || "-"}</td>
                    <td className="px-5 py-4">
                      <Badge variant={company.status === "ACTIVE" ? "success" : "neutral"}>{toStatusLabel(company.status)}</Badge>
                    </td>
                    <td className="px-5 py-4">{toDateTime(company.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        onClick={() => router.push(`/empresas/cadastro?mode=edit&id=${company.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">Paginacao por cursor.</p>
          <div className="flex gap-2">
            <Button
              disabled={!hasPreviousPage || isLoading || !pageStartCursor}
              onClick={() => {
                setCursorMode("backward");
                setRequestBefore(pageStartCursor);
                setRequestAfter(null);
              }}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={!hasNextPage || isLoading || !pageEndCursor}
              onClick={() => {
                setCursorMode("forward");
                setRequestAfter(pageEndCursor);
                setRequestBefore(null);
              }}
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
