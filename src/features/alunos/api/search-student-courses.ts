import type { MockCourse } from "@/features/alunos/api/student-mock-service";
import { getCourseById } from "@/features/cursos/api/course-upsert";
import {
  getCourses,
  type CourseFilterInput,
  type GetCoursesVariables
} from "@/features/cursos/api/get-courses";

type SearchableCourseField = "name" | "code";
type SearchTextOperator = "contains" | "equals" | "startsWith";

export type StudentCourseSearchFilter = {
  field: SearchableCourseField;
  operator?: SearchTextOperator;
  value: string;
};

export type SearchStudentCoursesInput = {
  query?: string;
  filters?: StudentCourseSearchFilter[];
  limit?: number;
};

type TextFilter = NonNullable<CourseFilterInput["name"]>;

const courseTypeLabel: Record<string, string> = {
  AFTER_SCHOOL: "Reforco Escolar",
  LANGUAGE: "Idiomas",
  SCHOOL_CLASS: "Turma Regular",
  WORKSHOP: "Workshop",
  OTHER: "Outros"
};

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
  where: CourseFilterInput,
  field: SearchableCourseField,
  operator: SearchTextOperator,
  value: string
) {
  const filter = buildTextFilter(operator, value);
  if (field === "name") {
    where.name = filter;
    return;
  }

  where.code = filter;
}

function buildWhere(query?: string, filters: StudentCourseSearchFilter[] = []): CourseFilterInput | null {
  const where: CourseFilterInput = {};
  const trimmedQuery = query?.trim();

  if (trimmedQuery) {
    where.or = [{ name: { contains: trimmedQuery } }, { code: { contains: trimmedQuery } }];
  }

  for (const filter of filters) {
    const value = filter.value.trim();
    if (!value) continue;
    applyTextFilter(where, filter.field, filter.operator ?? "contains", value);
  }

  return Object.keys(where).length ? where : null;
}

function mapCourseToOption(course: {
  code?: string | null;
  id: string;
  name: string;
  type?: string | null;
}): MockCourse {
  const type = course.type ?? "OTHER";
  return {
    id: course.id,
    name: course.name,
    code: course.code ?? "",
    category: courseTypeLabel[type] ?? type
  };
}

export async function searchStudentCourses({
  query,
  filters = [],
  limit = 10
}: SearchStudentCoursesInput): Promise<MockCourse[]> {
  const variables: GetCoursesVariables = {
    first: Math.max(1, limit),
    where: buildWhere(query, filters),
    order: [{ name: "ASC" }]
  };

  const response = await getCourses(variables);
  return response.nodes.map(mapCourseToOption);
}

export async function getStudentCourseById(id: string): Promise<MockCourse | null> {
  const course = await getCourseById(id);
  return course ? mapCourseToOption(course) : null;
}
