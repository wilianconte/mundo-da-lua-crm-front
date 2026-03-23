import { gqlRequest } from "@/lib/graphql/client";

const GET_COURSES_QUERY = `
  query GetCourses(
    $first: Int
    $after: String
    $where: CourseFilterInput
    $order: [CourseSortInput!]
  ) {
    courses(
      first: $first
      after: $after
      where: $where
      order: $order
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        code
        type
        status
        isActive
        startDate
        endDate
        capacity
        workload
        scheduleDescription
        createdAt
      }
    }
  }
`;

export type CourseType = "AFTER_SCHOOL" | "LANGUAGE" | "SCHOOL_CLASS" | "WORKSHOP" | "OTHER";
export type CourseStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "COMPLETED" | "CANCELLED";

export type CourseNode = {
  id: string;
  name: string;
  code?: string | null;
  type: CourseType;
  status: CourseStatus;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  workload?: number | null;
  scheduleDescription?: string | null;
  createdAt: string;
};

export type CourseConnection = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
  nodes: CourseNode[];
};

type GetCoursesResponse = {
  courses: CourseConnection;
};

type StringFilter = {
  eq?: string;
  contains?: string;
  startsWith?: string;
};

type EnumFilter = {
  eq?: string;
  in?: string[];
};

export type CourseFilterInput = {
  or?: Array<{ name?: StringFilter; code?: StringFilter }>;
  name?: StringFilter;
  code?: StringFilter;
  type?: EnumFilter;
  status?: EnumFilter;
};

export type GetCoursesVariables = {
  first?: number;
  after?: string | null;
  where?: CourseFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getCourses(variables: GetCoursesVariables) {
  const data = await gqlRequest<GetCoursesResponse, GetCoursesVariables>(GET_COURSES_QUERY, variables);
  return data.courses;
}

