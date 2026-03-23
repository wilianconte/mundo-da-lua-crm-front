import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";
import type { CourseStatus, CourseType } from "./get-courses";

const GET_COURSE_BY_ID_QUERY = `
  query GetCourseById($id: UUID!) {
    courseById(id: $id) {
      id
      name
      code
      type
      description
      status
      isActive
      startDate
      endDate
      scheduleDescription
      capacity
      workload
      unitId
      notes
      createdAt
      updatedAt
    }
  }
`;

const CREATE_COURSE_MUTATION = `
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(input: $input) {
      course {
        id
        name
        code
        type
        status
        isActive
        startDate
        endDate
        createdAt
      }
    }
  }
`;

const UPDATE_COURSE_MUTATION = `
  mutation UpdateCourse($id: UUID!, $input: UpdateCourseInput!) {
    updateCourse(id: $id, input: $input) {
      course {
        id
        name
        code
        type
        status
        isActive
        startDate
        endDate
        updatedAt
      }
    }
  }
`;

const DELETE_COURSE_MUTATION = `
  mutation DeleteCourse($id: UUID!) {
    deleteCourse(id: $id)
  }
`;

export type CourseRecord = {
  id: string;
  name: string;
  code?: string | null;
  type: CourseType;
  description?: string | null;
  status: CourseStatus;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  scheduleDescription?: string | null;
  capacity?: number | null;
  workload?: number | null;
  unitId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CourseUpsertInput = {
  name: string;
  type: CourseType;
  status?: CourseStatus;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  scheduleDescription?: string;
  capacity?: number;
  workload?: number;
  notes?: string;
};

type GetCourseByIdResponse = {
  courseById: CourseRecord | null;
};

type CreateCourseResponse = {
  createCourse: { course: CourseRecord };
};

type UpdateCourseResponse = {
  updateCourse: { course: CourseRecord };
};

type DeleteCourseResponse = {
  deleteCourse: boolean;
};

export async function getCourseById(id: string) {
  const data = await gqlRequest<GetCourseByIdResponse, { id: string }>(GET_COURSE_BY_ID_QUERY, { id });
  return data.courseById;
}

export async function createCourse(input: CourseUpsertInput) {
  const data = await gqlRequest<CreateCourseResponse, { input: CourseUpsertInput }>(CREATE_COURSE_MUTATION, {
    input
  });
  return data.createCourse.course;
}

export async function updateCourse(id: string, input: CourseUpsertInput) {
  const data = await gqlRequest<UpdateCourseResponse, { id: string; input: CourseUpsertInput }>(
    UPDATE_COURSE_MUTATION,
    { id, input }
  );
  return data.updateCourse.course;
}

export async function deleteCourse(id: string) {
  const data = await gqlRequest<DeleteCourseResponse, { id: string }>(DELETE_COURSE_MUTATION, { id });
  return data.deleteCourse;
}

const COURSE_ERROR_MESSAGES: Record<string, string> = {
  COURSE_NOT_FOUND: "Curso nao encontrado.",
  CODE_ALREADY_EXISTS: "Ja existe um curso com este codigo."
};

export function mapCourseApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && COURSE_ERROR_MESSAGES[error.code]) {
      return COURSE_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    if (error.code === "AUTH_NOT_AUTHORIZED") {
      return "Sessao expirada. Entre novamente.";
    }

    return error.message || "Ocorreu um erro inesperado. Tente novamente.";
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}
