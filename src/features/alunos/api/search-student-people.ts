import type { MockPerson } from "@/features/alunos/api/student-mock-service";
import {
  getPeople,
  type GetPeopleVariables,
  type PersonFilterInput
} from "@/features/pessoas/api/get-people";
import { getPersonById } from "@/features/pessoas/api/person-upsert";

type SearchablePersonField = "fullName" | "documentNumber" | "phone" | "email";
type SearchTextOperator = "contains" | "equals" | "startsWith";

export type StudentPersonSearchFilter = {
  field: SearchablePersonField;
  operator?: SearchTextOperator;
  value: string;
};

export type SearchStudentPeopleInput = {
  query?: string;
  filters?: StudentPersonSearchFilter[];
  limit?: number;
};

type TextFilter = NonNullable<PersonFilterInput["fullName"]>;

function buildTextFilter(operator: SearchTextOperator, value: string): TextFilter {
  if (operator === "equals") {
    return { eq: value };
  }

  if (operator === "startsWith") {
    return { startsWith: value };
  }

  return { contains: value };
}

function applyTextFilter(
  where: PersonFilterInput,
  field: SearchablePersonField,
  operator: SearchTextOperator,
  value: string
) {
  const filter = buildTextFilter(operator, value);

  if (field === "fullName") {
    where.fullName = filter;
    return;
  }

  if (field === "documentNumber") {
    where.documentNumber = filter;
    return;
  }

  if (field === "email") {
    where.email = filter;
    return;
  }

  where.primaryPhone = filter;
}

function buildWhere(query?: string, filters: StudentPersonSearchFilter[] = []): PersonFilterInput | null {
  const where: PersonFilterInput = {};
  const trimmedQuery = query?.trim();

  if (trimmedQuery) {
    where.or = [
      { fullName: { contains: trimmedQuery } },
      { documentNumber: { contains: trimmedQuery } },
      { email: { contains: trimmedQuery } },
      { primaryPhone: { contains: trimmedQuery } }
    ];
  }

  for (const filter of filters) {
    const value = filter.value.trim();
    if (!value) {
      continue;
    }

    applyTextFilter(where, filter.field, filter.operator ?? "contains", value);
  }

  return Object.keys(where).length ? where : null;
}

function mapPersonToOption(person: {
  id: string;
  fullName: string;
  documentNumber?: string | null;
  primaryPhone?: string | null;
  email?: string | null;
}): MockPerson {
  return {
    id: person.id,
    fullName: person.fullName,
    documentNumber: person.documentNumber ?? "",
    phone: person.primaryPhone ?? "",
    email: person.email ?? ""
  };
}

export async function searchStudentPeople({
  query,
  filters = [],
  limit = 10
}: SearchStudentPeopleInput): Promise<MockPerson[]> {
  const variables: GetPeopleVariables = {
    first: Math.max(1, limit),
    where: buildWhere(query, filters),
    order: [{ fullName: "ASC" }]
  };

  const response = await getPeople(variables);
  return response.nodes.map(mapPersonToOption);
}

export async function getStudentPersonById(id: string): Promise<MockPerson | null> {
  const person = await getPersonById(id);
  return person ? mapPersonToOption(person) : null;
}
