"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getStudentStatusLabel,
  searchStudents,
  studentStatusOptions,
  type StudentListItem,
  type StudentSearchFilters,
  type StudentStatus
} from "@/features/alunos/api/student-mock-service";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";

type SortableColumn = "studentName" | "registrationNumber" | "school" | "gradeClass" | "status" | "primaryGuardianName";
type SortDirection = "asc" | "desc";

const tableColumns: Array<{ label: string; sortKey?: SortableColumn }> = [
  { label: "Student", sortKey: "studentName" },
  { label: "Registration", sortKey: "registrationNumber" },
  { label: "School", sortKey: "school" },
  { label: "Grade/Class", sortKey: "gradeClass" },
  { label: "Status", sortKey: "status" },
  { label: "Primary guardian", sortKey: "primaryGuardianName" },
  { label: "Contact" },
  { label: "Actions" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function StudentSearchView() {
  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const [rows, setRows] = useState<StudentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortableColumn>("studentName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    let active = true;
    searchStudents(filters)
      .then((response) => {
        if (!active) return;
        setRows(response);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      const leftValue = normalize(String(left[sortBy]));
      const rightValue = normalize(String(right[sortBy]));
      const comparison = leftValue.localeCompare(rightValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortBy, sortDirection]);

  function toggleSort(column: SortableColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  function renderSortIcon(column: SortableColumn) {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  }

  function statusBadgeVariant(status: StudentStatus): "success" | "attention" | "neutral" {
    if (status === "ACTIVE") return "success";
    if (status === "PENDING") return "attention";
    return "neutral";
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Student</p>
          <h2 className="text-2xl font-semibold tracking-tight">Student search</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Mock list patterned after the People module and ready for future API integration.
          </p>
        </div>
        <Link href="/alunos/cadastro">
          <Button leadingIcon={<Plus className="size-4" />}>Create student</Button>
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search mock students by student, guardian, school, grade, and registration data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "studentName", label: "Student name", placeholder: "Type student name" },
              { key: "documentNumber", label: "Document number", placeholder: "CPF/RG" },
              { key: "guardianName", label: "Guardian name", placeholder: "Primary guardian" },
              { key: "registrationNumber", label: "Registration", placeholder: "Enrollment number" },
              { key: "school", label: "School", placeholder: "School unit" },
              { key: "gradeClass", label: "Grade/Class", placeholder: "Grade or classroom" }
            ].map((field) => (
              <div className="space-y-2" key={field.key}>
                <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor={`student-filter-${field.key}`}>
                  {field.label}
                </label>
                <Input
                  id={`student-filter-${field.key}`}
                  onChange={(event) => {
                    setIsLoading(true);
                    setFilters((current) => ({ ...current, [field.key]: event.target.value }));
                  }}
                  placeholder={field.placeholder}
                  value={String(filters[field.key as keyof StudentSearchFilters] ?? "")}
                />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="student-filter-status">
                Status
              </label>
              <select
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="student-filter-status"
                onChange={(event) => {
                  setIsLoading(true);
                  setFilters((current) => ({ ...current, status: event.target.value }));
                }}
                value={filters.status ?? ""}
              >
                <option value="">All statuses</option>
                {studentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Fake data source with empty/loading states and standard row actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SearchResultsTable
            canGoNext={false}
            canGoPrevious={false}
            columns={tableColumns}
            emptyText="No students found for the current filters."
            isLoading={isLoading}
            loadingText="Loading mock students..."
            onNextPage={() => undefined}
            onPreviousPage={() => undefined}
            onToggleSort={toggleSort}
            renderRow={(row) => (
              <tr className="border-t border-[var(--color-border)]" key={row.id}>
                <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{row.studentName}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{row.registrationNumber}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{row.school}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{row.gradeClass}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(row.status)}>{getStudentStatusLabel(row.status)}</Badge>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{row.primaryGuardianName}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{row.primaryGuardianPhone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/alunos/cadastro?mode=edit&id=${row.id}`}><Button size="sm" variant="outline">View</Button></Link>
                    <Link href={`/alunos/cadastro?mode=edit&id=${row.id}`}><Button size="sm" variant="ghost">Edit</Button></Link>
                  </div>
                </td>
              </tr>
            )}
            renderSortIcon={renderSortIcon}
            rows={sortedRows}
            sortBy={sortBy}
            totalText={`${sortedRows.length} student(s) listed in mock mode.`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
