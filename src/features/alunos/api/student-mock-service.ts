import { getPersonById } from "@/features/pessoas/api/person-upsert";
import { getCourseById } from "@/features/cursos/api/course-upsert";
import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const MOCK_DELAY_MS = 450;

export type StudentStatus = "Active" | "Inactive" | "Graduated" | "Transferred" | "Suspended";
export type GuardianRelationshipType =
  | "FATHER"
  | "MOTHER"
  | "GRANDMOTHER"
  | "GRANDFATHER"
  | "UNCLE"
  | "AUNT"
  | "LEGAL_GUARDIAN"
  | "OTHER";

export type MockPerson = {
  id: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  email: string;
};

export type MockCourse = {
  id: string;
  name: string;
  code: string;
  category: string;
};

export type StudentGuardian = {
  id: string;
  person: MockPerson;
  relationshipType: GuardianRelationshipType;
  isPrimaryGuardian: boolean;
  isFinancialResponsible: boolean;
  receivesNotifications: boolean;
  canPickupChild: boolean;
  notes?: string;
};

export type StudentCourseEnrollment = {
  id: string;
  course: MockCourse;
  registrationNumber: string;
  startDate: string;
  endDate?: string;
};

export type StudentRecord = {
  id: string;
  registrationNumber: string;
  personId: string;
  status: StudentStatus;
  schoolName: string;
  gradeOrClass: string;
  enrollmentType?: string;
  classGroup?: string;
  startDate?: string;
  notes?: string;
  academicObservation?: string;
  guardians: StudentGuardian[];
  courses: StudentCourseEnrollment[];
};

export type StudentListItem = {
  id: string;
  studentName: string;
  documentNumber: string;
  registrationNumber: string;
  school: string;
  gradeClass: string;
  status: StudentStatus;
  primaryGuardianName: string;
  primaryGuardianPhone: string;
};

export type StudentSearchFilters = {
  studentName?: string;
  documentNumber?: string;
  guardianName?: string;
  status?: string;
  registrationNumber?: string;
  school?: string;
  gradeClass?: string;
};

export type PersonSearchFilters = {
  query?: string;
  fullName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
};

export type CourseSearchFilters = {
  query?: string;
  name?: string;
  code?: string;
  category?: string;
};

export type StudentFormPayload = {
  personId: string;
  registrationNumber?: string;
  schoolName?: string;
  gradeOrClass?: string;
  enrollmentType?: string;
  classGroup?: string;
  startDate?: string;
  notes?: string;
  academicObservation?: string;
  guardians: StudentGuardian[];
  courses: StudentCourseEnrollment[];
};

export const guardianRelationshipOptions: Array<{ value: GuardianRelationshipType; label: string }> = [
  { value: "FATHER", label: "Pai" },
  { value: "MOTHER", label: "Mae" },
  { value: "GRANDMOTHER", label: "Avo (fem.)" },
  { value: "GRANDFATHER", label: "Avo (masc.)" },
  { value: "UNCLE", label: "Tio" },
  { value: "AUNT", label: "Tia" },
  { value: "LEGAL_GUARDIAN", label: "Responsavel legal" },
  { value: "OTHER", label: "Outro" }
];

export const studentStatusOptions: Array<{ value: StudentStatus; label: string }> = [
  { value: "Active", label: "Ativo" },
  { value: "Inactive", label: "Inativo" },
  { value: "Graduated", label: "Formado" },
  { value: "Transferred", label: "Transferido" },
  { value: "Suspended", label: "Suspenso" }
];

const mockPeople: MockPerson[] = [
  { id: "person-1", fullName: "Alice Martins", documentNumber: "123.456.789-00", phone: "(11) 99876-1234", email: "alice.martins@example.com" },
  { id: "person-2", fullName: "Bruno Lopes", documentNumber: "234.567.890-11", phone: "(11) 99765-4321", email: "bruno.lopes@example.com" },
  { id: "person-3", fullName: "Carolina Souza", documentNumber: "345.678.901-22", phone: "(21) 98888-1000", email: "carolina.souza@example.com" },
  { id: "person-4", fullName: "Daniela Costa", documentNumber: "456.789.012-33", phone: "(21) 97777-2000", email: "daniela.costa@example.com" },
  { id: "person-5", fullName: "Eduardo Lima", documentNumber: "567.890.123-44", phone: "(31) 96666-3000", email: "eduardo.lima@example.com" },
  { id: "person-6", fullName: "Fernanda Rocha", documentNumber: "678.901.234-55", phone: "(31) 95555-4000", email: "fernanda.rocha@example.com" },
  { id: "person-7", fullName: "Gabriel Almeida", documentNumber: "789.012.345-66", phone: "(41) 94444-5000", email: "gabriel.almeida@example.com" },
  { id: "person-8", fullName: "Helena Ramos", documentNumber: "890.123.456-77", phone: "(41) 93333-6000", email: "helena.ramos@example.com" }
];

const mockCourses: MockCourse[] = [
  { id: "course-1", name: "Ballet Infantil", code: "CUR-BAL-01", category: "Artes" },
  { id: "course-2", name: "Musicalizacao", code: "CUR-MUS-01", category: "Musica" },
  { id: "course-3", name: "Futebol Kids", code: "CUR-FUT-01", category: "Esportes" },
  { id: "course-4", name: "Ingles Basico", code: "CUR-ING-01", category: "Idiomas" },
  { id: "course-5", name: "Robotica Junior", code: "CUR-ROB-01", category: "Tecnologia" },
  { id: "course-6", name: "Teatro", code: "CUR-TEA-01", category: "Artes" }
];

let mockStudents: StudentRecord[] = [
  {
    id: "student-1",
    personId: "person-1",
    registrationNumber: "STU-2026-001",
    status: "Active",
    schoolName: "Mundo da Lua Kids",
    gradeOrClass: "Grade 2 / Sun",
    startDate: "2026-02-03",
    notes: "Needs support during adaptation week.",
    guardians: [
      {
        id: "guardian-1",
        person: mockPeople[2],
        relationshipType: "MOTHER",
        isPrimaryGuardian: true,
        isFinancialResponsible: true,
        receivesNotifications: true,
        canPickupChild: true,
        notes: "Prefers WhatsApp communication."
      },
      {
        id: "guardian-2",
        person: mockPeople[1],
        relationshipType: "FATHER",
        isPrimaryGuardian: false,
        isFinancialResponsible: false,
        receivesNotifications: true,
        canPickupChild: true,
        notes: "Available after 6 PM."
      }
    ],
    courses: [
      {
        id: "enrollment-1",
        course: mockCourses[0],
        registrationNumber: "MAT-BAL-2026-001",
        startDate: "2026-02-03",
        endDate: "2026-12-20"
      }
    ]
  },
  {
    id: "student-2",
    personId: "person-7",
    registrationNumber: "STU-2026-002",
    status: "Transferred",
    schoolName: "Mundo da Lua Bilingual",
    gradeOrClass: "Grade 1 / Moon",
    startDate: "2026-03-10",
    notes: "Awaiting school transport confirmation.",
    guardians: [
      {
        id: "guardian-3",
        person: mockPeople[3],
        relationshipType: "AUNT",
        isPrimaryGuardian: true,
        isFinancialResponsible: true,
        receivesNotifications: true,
        canPickupChild: false,
        notes: "Send email updates too."
      }
    ],
    courses: [
      {
        id: "enrollment-2",
        course: mockCourses[3],
        registrationNumber: "MAT-ING-2026-002",
        startDate: "2026-03-10",
        endDate: "2026-11-30"
      }
    ]
  },
  {
    id: "student-3",
    personId: "person-5",
    registrationNumber: "STU-2025-118",
    status: "Inactive",
    schoolName: "Mundo da Lua Kids",
    gradeOrClass: "Grade 3 / Star",
    startDate: "2025-08-14",
    notes: "Temporarily inactive while family is abroad.",
    guardians: [
      {
        id: "guardian-4",
        person: mockPeople[5],
        relationshipType: "LEGAL_GUARDIAN",
        isPrimaryGuardian: true,
        isFinancialResponsible: true,
        receivesNotifications: false,
        canPickupChild: true,
        notes: "Legal paperwork already reviewed."
      }
    ],
    courses: [
      {
        id: "enrollment-3",
        course: mockCourses[2],
        registrationNumber: "MAT-FUT-2025-118",
        startDate: "2025-08-14",
        endDate: "2025-12-10"
      }
    ]
  }
];

function wait(delay = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export function getStudentStatusLabel(status: StudentStatus) {
  if (status === "Active") return "Ativo";
  if (status === "Inactive") return "Inativo";
  if (status === "Graduated") return "Formado";
  if (status === "Transferred") return "Transferido";
  return "Suspenso";
}

export function getRelationshipLabel(value: GuardianRelationshipType) {
  return guardianRelationshipOptions.find((option) => option.value === value)?.label ?? value;
}

export function getAllMockPeople() {
  return [...mockPeople];
}

export function getAllMockCourses() {
  return [...mockCourses];
}

export async function searchPeople(filters: PersonSearchFilters) {
  await wait(300);
  const query = normalize(filters.query);

  return mockPeople.filter((person) => {
    const matchesQuery =
      !query ||
      [person.fullName, person.documentNumber, person.phone]
        .map((value) => normalize(value))
        .some((value) => value.includes(query));

    const matchesName = !filters.fullName || normalize(person.fullName).includes(normalize(filters.fullName));
    const matchesDocument =
      !filters.documentNumber || normalize(person.documentNumber).includes(normalize(filters.documentNumber));
    const matchesPhone = !filters.phone || normalize(person.phone).includes(normalize(filters.phone));
    const matchesEmail = !filters.email || normalize(person.email).includes(normalize(filters.email));

    return matchesQuery && matchesName && matchesDocument && matchesPhone && matchesEmail;
  });
}

export async function searchCourses(filters: CourseSearchFilters) {
  await wait(300);
  const query = normalize(filters.query);

  return mockCourses.filter((course) => {
    const matchesQuery =
      !query ||
      [course.name, course.code, course.category]
        .map((value) => normalize(value))
        .some((value) => value.includes(query));

    const matchesName = !filters.name || normalize(course.name).includes(normalize(filters.name));
    const matchesCode = !filters.code || normalize(course.code).includes(normalize(filters.code));
    const matchesCategory =
      !filters.category || normalize(course.category).includes(normalize(filters.category));

    return matchesQuery && matchesName && matchesCode && matchesCategory;
  });
}

const GET_STUDENTS_QUERY = `
  query GetStudents(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: StudentFilterInput
    $order: [StudentSortInput!]
  ) {
    students(
      first: $first
      after: $after
      last: $last
      before: $before
      where: $where
      order: $order
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        personId
        registrationNumber
        schoolName
        gradeOrClass
        enrollmentType
        unitId
        classGroup
        startDate
        status
        notes
        academicObservation
        createdAt
        updatedAt
        createdBy
        updatedBy
      }
    }
  }
`;

const GET_STUDENT_BY_ID_QUERY = `
  query GetStudentById($id: UUID!) {
    studentById(id: $id) {
      id
      personId
      registrationNumber
      schoolName
      gradeOrClass
      enrollmentType
      classGroup
      startDate
      notes
      academicObservation
      status
    }
  }
`;

const GET_STUDENT_COURSES_QUERY = `
  query GetStudentCourses($first: Int, $where: StudentCourseFilterInput, $order: [StudentCourseSortInput!]) {
    studentCourses(first: $first, where: $where, order: $order) {
      nodes {
        id
        studentId
        courseId
        enrollmentDate
        startDate
        endDate
      }
    }
  }
`;

const GET_STUDENT_GUARDIANS_QUERY = `
  query GetStudentGuardians($first: Int, $where: StudentGuardianFilterInput, $order: [StudentGuardianSortInput!]) {
    studentGuardians(first: $first, where: $where, order: $order) {
      nodes {
        id
        studentId
        guardianPersonId
        relationshipType
        isPrimaryGuardian
        isFinancialResponsible
        receivesNotifications
        canPickupChild
        notes
      }
    }
  }
`;

const CREATE_STUDENT_MUTATION = `
  mutation CreateStudent($input: CreateStudentInput!) {
    createStudent(input: $input) {
      student {
        id
        personId
        registrationNumber
        schoolName
        gradeOrClass
        enrollmentType
        unitId
        classGroup
        startDate
        notes
        academicObservation
        status
      }
    }
  }
`;

const CREATE_STUDENT_COURSE_MUTATION = `
  mutation CreateStudentCourse($input: CreateStudentCourseInput!) {
    createStudentCourse(input: $input) {
      studentCourse {
        id
        studentId
        courseId
        enrollmentDate
        startDate
        endDate
        classGroup
        shift
        scheduleDescription
        unitId
        notes
        status
      }
    }
  }
`;

const CREATE_STUDENT_GUARDIAN_MUTATION = `
  mutation CreateStudentGuardian($input: CreateStudentGuardianInput!) {
    createStudentGuardian(input: $input) {
      studentGuardian {
        id
        studentId
        guardianPersonId
        relationshipType
        isPrimaryGuardian
        isFinancialResponsible
        receivesNotifications
        canPickupChild
        notes
      }
    }
  }
`;

const UPDATE_STUDENT_MUTATION = `
  mutation UpdateStudent($id: UUID!, $input: UpdateStudentInput!) {
    updateStudent(id: $id, input: $input) {
      student {
        id
        personId
        registrationNumber
        schoolName
        gradeOrClass
        enrollmentType
        unitId
        classGroup
        startDate
        notes
        academicObservation
        status
        updatedAt
        updatedBy
      }
    }
  }
`;

const UPDATE_STUDENT_COURSE_MUTATION = `
  mutation UpdateStudentCourse($id: UUID!, $input: UpdateStudentCourseInput!) {
    updateStudentCourse(id: $id, input: $input) {
      studentCourse {
        id
        studentId
        courseId
        enrollmentDate
        startDate
        endDate
        classGroup
        shift
        scheduleDescription
        unitId
        notes
        status
        updatedAt
        updatedBy
      }
    }
  }
`;

const UPDATE_STUDENT_GUARDIAN_MUTATION = `
  mutation UpdateStudentGuardian($id: UUID!, $input: UpdateStudentGuardianInput!) {
    updateStudentGuardian(id: $id, input: $input) {
      studentGuardian {
        id
        studentId
        guardianPersonId
        relationshipType
        isPrimaryGuardian
        isFinancialResponsible
        receivesNotifications
        canPickupChild
        notes
        updatedAt
        updatedBy
      }
    }
  }
`;

const DELETE_STUDENT_MUTATION = `
  mutation DeleteStudent($id: UUID!) {
    deleteStudent(id: $id)
  }
`;

const DELETE_STUDENT_COURSE_MUTATION = `
  mutation DeleteStudentCourse($id: UUID!) {
    deleteStudentCourse(id: $id)
  }
`;

const DELETE_STUDENT_GUARDIAN_MUTATION = `
  mutation DeleteStudentGuardian($id: UUID!) {
    deleteStudentGuardian(id: $id)
  }
`;

type BackendStudentStatus = "Active" | "Inactive" | "Graduated" | "Transferred" | "Suspended";

type StudentsConnectionResponse = {
  students: {
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
    nodes: Array<{
      id: string;
      personId: string;
      registrationNumber?: string | null;
      schoolName?: string | null;
      gradeOrClass?: string | null;
      classGroup?: string | null;
      status?: BackendStudentStatus | null;
    }>;
  };
};

type StringFilter = {
  eq?: string;
  contains?: string;
  startsWith?: string;
  in?: string[];
};

type UuidFilter = {
  eq?: string;
  in?: string[];
};

type StudentStatusFilter = {
  eq?: BackendStudentStatus;
};

export type StudentFilterInput = {
  and?: StudentFilterInput[];
  or?: StudentFilterInput[];
  id?: UuidFilter;
  personId?: UuidFilter;
  registrationNumber?: StringFilter;
  schoolName?: StringFilter;
  gradeOrClass?: StringFilter;
  classGroup?: StringFilter;
  unitId?: UuidFilter;
  status?: StudentStatusFilter;
};

export type GetStudentsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: StudentFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export type StudentConnection = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  nodes: StudentListItem[];
};

type StudentByIdResponse = {
  studentById: {
    id: string;
    personId: string;
    registrationNumber?: string | null;
    schoolName?: string | null;
    gradeOrClass?: string | null;
    enrollmentType?: string | null;
    classGroup?: string | null;
    startDate?: string | null;
    notes?: string | null;
    academicObservation?: string | null;
    status?: BackendStudentStatus | null;
  } | null;
};

type StudentCoursesResponse = {
  studentCourses: {
    nodes: Array<{
      id: string;
      studentId: string;
      courseId: string;
      enrollmentDate?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }>;
  };
};

type StudentGuardiansResponse = {
  studentGuardians: {
    nodes: Array<{
      id: string;
      studentId: string;
      guardianPersonId: string;
      relationshipType: string;
      isPrimaryGuardian?: boolean | null;
      isFinancialResponsible?: boolean | null;
      receivesNotifications?: boolean | null;
      canPickupChild?: boolean | null;
      notes?: string | null;
    }>;
  };
};

type CreateStudentResponse = {
  createStudent: {
    student: {
      id: string;
      personId: string;
      registrationNumber?: string | null;
      schoolName?: string | null;
      gradeOrClass?: string | null;
      enrollmentType?: string | null;
      classGroup?: string | null;
      startDate?: string | null;
      notes?: string | null;
      academicObservation?: string | null;
      status?: BackendStudentStatus | null;
    };
  };
};

type UpdateStudentResponse = {
  updateStudent: {
    student: {
      id: string;
      personId: string;
      registrationNumber?: string | null;
      schoolName?: string | null;
      gradeOrClass?: string | null;
      enrollmentType?: string | null;
      classGroup?: string | null;
      startDate?: string | null;
      notes?: string | null;
      academicObservation?: string | null;
      status?: BackendStudentStatus | null;
    };
  };
};

type DeleteStudentResponse = {
  deleteStudent: boolean;
};

type DeleteStudentCourseResponse = {
  deleteStudentCourse: boolean;
};

type DeleteStudentGuardianResponse = {
  deleteStudentGuardian: boolean;
};

function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapBackendStatusToStudentStatus(status?: BackendStudentStatus | null): StudentStatus {
  if (!status) return "Active";
  return status;
}

function mapGuardianRelationshipToBackend(value: GuardianRelationshipType):
  | "FATHER"
  | "MOTHER"
  | "GRANDMOTHER"
  | "GRANDFATHER"
  | "UNCLE"
  | "AUNT"
  | "LEGAL_GUARDIAN"
  | "OTHER" {
  return value;
}

function mapGuardianRelationshipFromBackend(value: string): GuardianRelationshipType {
  if (value === "FATHER") return "FATHER";
  if (value === "MOTHER") return "MOTHER";
  if (value === "GRANDMOTHER") return "GRANDMOTHER";
  if (value === "GRANDFATHER") return "GRANDFATHER";
  if (value === "UNCLE") return "UNCLE";
  if (value === "AUNT") return "AUNT";
  if (value === "LEGAL_GUARDIAN") return "LEGAL_GUARDIAN";
  if (value === "OTHER") return "OTHER";

  // Tolerancia temporaria para payloads legados em PascalCase.
  if (value === "Father") return "FATHER";
  if (value === "Mother") return "MOTHER";
  if (value === "Grandmother") return "GRANDMOTHER";
  if (value === "Grandfather") return "GRANDFATHER";
  if (value === "Uncle") return "UNCLE";
  if (value === "Aunt") return "AUNT";
  if (value === "LegalGuardian") return "LEGAL_GUARDIAN";
  return "OTHER";
}

function mapCourseTypeToCategory(type?: string | null) {
  if (!type) return "Outros";
  if (type === "AFTER_SCHOOL") return "Reforco Escolar";
  if (type === "LANGUAGE") return "Idiomas";
  if (type === "SCHOOL_CLASS") return "Turma Regular";
  if (type === "WORKSHOP") return "Workshop";
  return "Outros";
}

const STUDENT_ERROR_MESSAGES: Record<string, string> = {
  STUDENT_NOT_FOUND: "Aluno nao encontrado.",
  STUDENT_PERSON_ALREADY_LINKED: "A pessoa selecionada ja esta vinculada a outro aluno.",
  STUDENT_REGISTRATION_DUPLICATE: "Este numero de matricula ja existe.",
  STUDENT_COURSE_DUPLICATE: "Este curso ja esta vinculado ao aluno.",
  STUDENT_COURSE_NOT_FOUND: "Matricula em curso nao encontrada.",
  STUDENT_GUARDIAN_DUPLICATE: "Este responsavel ja esta vinculado ao aluno.",
  STUDENT_GUARDIAN_NOT_FOUND: "Vinculo de responsavel nao encontrado."
};

export function mapStudentApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && STUDENT_ERROR_MESSAGES[error.code]) {
      return STUDENT_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return "Dados invalidos. Revise os campos informados.";
    }

    if (error.code === "AUTH_NOT_AUTHORIZED") {
      return "Sessao expirada. Entre novamente.";
    }

    return error.message || "Nao foi possivel salvar os dados do aluno.";
  }

  return "Nao foi possivel salvar os dados do aluno.";
}

export async function deleteStudent(id: string) {
  const data = await gqlRequest<DeleteStudentResponse, { id: string }>(DELETE_STUDENT_MUTATION, { id });
  return data.deleteStudent;
}

export async function deleteStudentCourse(id: string) {
  const data = await gqlRequest<DeleteStudentCourseResponse, { id: string }>(DELETE_STUDENT_COURSE_MUTATION, { id });
  return data.deleteStudentCourse;
}

export async function deleteStudentGuardian(id: string) {
  const data = await gqlRequest<DeleteStudentGuardianResponse, { id: string }>(DELETE_STUDENT_GUARDIAN_MUTATION, { id });
  return data.deleteStudentGuardian;
}

function isPersistedEntityId(id: string) {
  return !id.startsWith("enrollment-") && !id.startsWith("guardian-draft-") && !id.startsWith("legacy-course-");
}

function toDateOnly(value?: string | null) {
  const normalized = normalizeOptional(value);
  if (!normalized) return undefined;
  return normalized.split("T")[0];
}

function buildUpdateStudentInput(current: StudentRecord, payload: StudentFormPayload) {
  const input: {
    registrationNumber?: string;
    schoolName?: string;
    gradeOrClass?: string;
    enrollmentType?: string;
    classGroup?: string;
    startDate?: string;
    notes?: string;
    academicObservation?: string;
  } = {};

  if ((current.registrationNumber ?? "") !== (payload.registrationNumber ?? "")) {
    input.registrationNumber = normalizeOptional(payload.registrationNumber);
  }
  if ((current.schoolName ?? "") !== (payload.schoolName ?? "")) {
    input.schoolName = normalizeOptional(payload.schoolName);
  }
  if ((current.gradeOrClass ?? "") !== (payload.gradeOrClass ?? "")) {
    input.gradeOrClass = normalizeOptional(payload.gradeOrClass);
  }
  if ((current.enrollmentType ?? "") !== (payload.enrollmentType ?? "")) {
    input.enrollmentType = normalizeOptional(payload.enrollmentType);
  }
  if ((current.classGroup ?? "") !== (payload.classGroup ?? "")) {
    input.classGroup = normalizeOptional(payload.classGroup);
  }
  if ((toDateOnly(current.startDate) ?? "") !== (toDateOnly(payload.startDate) ?? "")) {
    input.startDate = toDateOnly(payload.startDate);
  }
  if ((current.notes ?? "") !== (payload.notes ?? "")) {
    input.notes = normalizeOptional(payload.notes);
  }
  if ((current.academicObservation ?? "") !== (payload.academicObservation ?? "")) {
    input.academicObservation = normalizeOptional(payload.academicObservation);
  }

  return input;
}

function buildUpdateCourseInput(
  current: StudentCourseEnrollment | undefined,
  next: StudentCourseEnrollment
) {
  const input: {
    enrollmentDate?: string;
    startDate?: string;
    endDate?: string;
  } = {};

  if (!current || (toDateOnly(current.startDate) ?? "") !== (toDateOnly(next.startDate) ?? "")) {
    input.enrollmentDate = toDateOnly(next.startDate);
    input.startDate = toDateOnly(next.startDate);
  }
  if (!current || (toDateOnly(current.endDate) ?? "") !== (toDateOnly(next.endDate) ?? "")) {
    input.endDate = toDateOnly(next.endDate);
  }

  return input;
}

export async function searchStudents(variables: GetStudentsVariables): Promise<StudentConnection> {
  const data = await gqlRequest<StudentsConnectionResponse, GetStudentsVariables>(GET_STUDENTS_QUERY, variables);

  const rows = await Promise.all(
    data.students.nodes.map(async (student) => {
      let person: MockPerson | null = null;
      try {
        const personRecord = await getPersonById(student.personId);
        if (personRecord) {
          person = {
            id: personRecord.id,
            fullName: personRecord.fullName,
            documentNumber: personRecord.documentNumber ?? "",
            phone: personRecord.primaryPhone ?? "",
            email: personRecord.email ?? ""
          };
        }
      } catch {
        person = null;
      }

      return {
        id: student.id,
        studentName: person?.fullName ?? "Aluno nao identificado",
        documentNumber: person?.documentNumber ?? "",
        registrationNumber: student.registrationNumber ?? "-",
        school: student.schoolName ?? "-",
        gradeClass: student.gradeOrClass ?? "-",
        status: mapBackendStatusToStudentStatus(student.status),
        primaryGuardianName: "-",
        primaryGuardianPhone: "-"
      } satisfies StudentListItem;
    })
  );

  return {
    totalCount: data.students.totalCount ?? rows.length,
    pageInfo: {
      hasNextPage: Boolean(data.students.pageInfo?.hasNextPage),
      hasPreviousPage: Boolean(data.students.pageInfo?.hasPreviousPage),
      startCursor: data.students.pageInfo?.startCursor ?? null,
      endCursor: data.students.pageInfo?.endCursor ?? null
    },
    nodes: rows
  } satisfies StudentConnection;
}

export async function getStudentById(studentId: string) {
  const data = await gqlRequest<StudentByIdResponse, { id: string }>(GET_STUDENT_BY_ID_QUERY, { id: studentId });
  const student = data.studentById;
  if (!student) return null;

  const coursesData = await gqlRequest<
    StudentCoursesResponse,
    { first: number; where: { studentId: { eq: string } }; order: Array<Record<string, "ASC" | "DESC">> }
  >(GET_STUDENT_COURSES_QUERY, {
    first: 50,
    where: { studentId: { eq: studentId } },
    order: [{ createdAt: "DESC" }]
  });

  const guardiansData = await gqlRequest<
    StudentGuardiansResponse,
    { first: number; where: { studentId: { eq: string } }; order: Array<Record<string, "ASC" | "DESC">> }
  >(GET_STUDENT_GUARDIANS_QUERY, {
    first: 50,
    where: { studentId: { eq: studentId } },
    order: [{ createdAt: "DESC" }]
  });

  const guardians = await Promise.all(
    guardiansData.studentGuardians.nodes.map(async (guardian) => {
      const guardianPerson = await getPersonById(guardian.guardianPersonId).catch(() => null);
      return {
        id: guardian.id,
        person: {
          id: guardian.guardianPersonId,
          fullName: guardianPerson?.fullName ?? "Pessoa nao identificada",
          documentNumber: guardianPerson?.documentNumber ?? "",
          phone: guardianPerson?.primaryPhone ?? "",
          email: guardianPerson?.email ?? ""
        },
        relationshipType: mapGuardianRelationshipFromBackend(guardian.relationshipType),
        isPrimaryGuardian: Boolean(guardian.isPrimaryGuardian),
        isFinancialResponsible: Boolean(guardian.isFinancialResponsible),
        receivesNotifications: Boolean(guardian.receivesNotifications),
        canPickupChild: Boolean(guardian.canPickupChild),
        notes: guardian.notes ?? undefined
      } satisfies StudentGuardian;
    })
  );

  const courses = await Promise.all(
    coursesData.studentCourses.nodes.map(async (enrollment) => {
      const course = await getCourseById(enrollment.courseId).catch(() => null);
      return {
        id: enrollment.id,
        course: {
          id: enrollment.courseId,
          name: course?.name ?? "Curso nao identificado",
          code: course?.code ?? "",
          category: mapCourseTypeToCategory(course?.type)
        },
        registrationNumber: course?.code ?? "",
        startDate: toDateOnly(enrollment.startDate ?? enrollment.enrollmentDate) ?? "",
        endDate: toDateOnly(enrollment.endDate) ?? undefined
      } satisfies StudentCourseEnrollment;
    })
  );

  return {
    id: student.id,
    personId: student.personId,
    registrationNumber: student.registrationNumber ?? "",
    status: mapBackendStatusToStudentStatus(student.status),
    schoolName: student.schoolName ?? "",
    gradeOrClass: student.gradeOrClass ?? "",
    enrollmentType: student.enrollmentType ?? undefined,
    classGroup: student.classGroup ?? undefined,
    startDate: toDateOnly(student.startDate) ?? undefined,
    notes: student.notes ?? undefined,
    academicObservation: student.academicObservation ?? undefined,
    guardians,
    courses
  } satisfies StudentRecord;
}

export async function saveStudent(studentId: string | null, payload: StudentFormPayload) {
  if (!studentId) {
    const createdStudentData = await gqlRequest<
      CreateStudentResponse,
      {
        input: {
          personId: string;
          registrationNumber?: string;
          schoolName?: string;
          gradeOrClass?: string;
          enrollmentType?: string;
          unitId?: string;
          classGroup?: string;
          startDate?: string;
          notes?: string;
          academicObservation?: string;
        };
      }
    >(CREATE_STUDENT_MUTATION, {
      input: {
        personId: payload.personId,
        registrationNumber: normalizeOptional(payload.registrationNumber),
        schoolName: normalizeOptional(payload.schoolName),
        gradeOrClass: normalizeOptional(payload.gradeOrClass),
        enrollmentType: normalizeOptional(payload.enrollmentType),
        classGroup: normalizeOptional(payload.classGroup),
        startDate: toDateOnly(payload.startDate),
        notes: normalizeOptional(payload.notes),
        academicObservation: normalizeOptional(payload.academicObservation)
      }
    });

    const createdStudent = createdStudentData.createStudent.student;
    const createdStudentId = createdStudent.id;

    await Promise.all(
      payload.courses.map((enrollment) =>
        gqlRequest(CREATE_STUDENT_COURSE_MUTATION, {
          input: {
            studentId: createdStudentId,
            courseId: enrollment.course.id,
            enrollmentDate: toDateOnly(enrollment.startDate),
            startDate: toDateOnly(enrollment.startDate),
            endDate: toDateOnly(enrollment.endDate)
          }
        })
      )
    );

    await Promise.all(
      payload.guardians.map((guardian) =>
        gqlRequest(CREATE_STUDENT_GUARDIAN_MUTATION, {
          input: {
            studentId: createdStudentId,
            guardianPersonId: guardian.person.id,
            relationshipType: mapGuardianRelationshipToBackend(guardian.relationshipType),
            isPrimaryGuardian: guardian.isPrimaryGuardian,
            isFinancialResponsible: guardian.isFinancialResponsible,
            receivesNotifications: guardian.receivesNotifications,
            canPickupChild: guardian.canPickupChild,
            notes: normalizeOptional(guardian.notes)
          }
        })
      )
    );

    const refreshedStudent = await getStudentById(createdStudentId);
    if (refreshedStudent) {
      return refreshedStudent;
    }

    return {
      id: createdStudent.id,
      personId: createdStudent.personId,
      registrationNumber: createdStudent.registrationNumber ?? payload.registrationNumber ?? "",
      status: mapBackendStatusToStudentStatus(createdStudent.status),
      schoolName: createdStudent.schoolName ?? payload.schoolName ?? "",
      gradeOrClass: createdStudent.gradeOrClass ?? payload.gradeOrClass ?? "",
      enrollmentType: createdStudent.enrollmentType ?? payload.enrollmentType ?? undefined,
      classGroup: createdStudent.classGroup ?? payload.classGroup ?? undefined,
      startDate: createdStudent.startDate ?? payload.startDate ?? undefined,
      notes: createdStudent.notes ?? payload.notes,
      academicObservation: createdStudent.academicObservation ?? payload.academicObservation,
      guardians: payload.guardians,
      courses: payload.courses
    } satisfies StudentRecord;
  }

  const currentStudent = await getStudentById(studentId);
  if (!currentStudent) {
    throw new GraphQLRequestError("Aluno nao encontrado.", "STUDENT_NOT_FOUND");
  }

  const updateStudentInput = buildUpdateStudentInput(currentStudent, payload);
  if (Object.keys(updateStudentInput).length) {
    await gqlRequest<UpdateStudentResponse, { id: string; input: typeof updateStudentInput }>(
      UPDATE_STUDENT_MUTATION,
      { id: studentId, input: updateStudentInput }
    );
  }

  const payloadCourseIds = new Set(payload.courses.map((course) => course.id));
  const removedCourseIds = currentStudent.courses
    .filter((course) => isPersistedEntityId(course.id) && !payloadCourseIds.has(course.id))
    .map((course) => course.id);
  await Promise.all(removedCourseIds.map((courseId) => deleteStudentCourse(courseId)));

  const currentCoursesById = new Map(currentStudent.courses.map((course) => [course.id, course]));
  await Promise.all(
    payload.courses.map((course) => {
      if (isPersistedEntityId(course.id) && currentCoursesById.has(course.id)) {
        const updateInput = buildUpdateCourseInput(currentCoursesById.get(course.id), course);
        if (!Object.keys(updateInput).length) {
          return Promise.resolve();
        }

        return gqlRequest(UPDATE_STUDENT_COURSE_MUTATION, {
          id: course.id,
          input: updateInput
        });
      }

      return gqlRequest(CREATE_STUDENT_COURSE_MUTATION, {
        input: {
          studentId,
          courseId: course.course.id,
          enrollmentDate: toDateOnly(course.startDate),
          startDate: toDateOnly(course.startDate),
          endDate: toDateOnly(course.endDate)
        }
      });
    })
  );

  const payloadGuardianIds = new Set(payload.guardians.map((guardian) => guardian.id));
  const removedGuardianIds = currentStudent.guardians
    .filter((guardian) => isPersistedEntityId(guardian.id) && !payloadGuardianIds.has(guardian.id))
    .map((guardian) => guardian.id);
  await Promise.all(removedGuardianIds.map((guardianId) => deleteStudentGuardian(guardianId)));

  const currentGuardiansById = new Map(currentStudent.guardians.map((guardian) => [guardian.id, guardian]));
  await Promise.all(
    payload.guardians.map((guardian) => {
      if (isPersistedEntityId(guardian.id) && currentGuardiansById.has(guardian.id)) {
        return gqlRequest(UPDATE_STUDENT_GUARDIAN_MUTATION, {
          id: guardian.id,
          input: {
            relationshipType: mapGuardianRelationshipToBackend(guardian.relationshipType),
            isPrimaryGuardian: guardian.isPrimaryGuardian,
            isFinancialResponsible: guardian.isFinancialResponsible,
            receivesNotifications: guardian.receivesNotifications,
            canPickupChild: guardian.canPickupChild,
            notes: normalizeOptional(guardian.notes)
          }
        });
      }

      return gqlRequest(CREATE_STUDENT_GUARDIAN_MUTATION, {
        input: {
          studentId,
          guardianPersonId: guardian.person.id,
          relationshipType: mapGuardianRelationshipToBackend(guardian.relationshipType),
          isPrimaryGuardian: guardian.isPrimaryGuardian,
          isFinancialResponsible: guardian.isFinancialResponsible,
          receivesNotifications: guardian.receivesNotifications,
          canPickupChild: guardian.canPickupChild,
          notes: normalizeOptional(guardian.notes)
        }
      });
    })
  );

  const refreshedStudent = await getStudentById(studentId);
  if (!refreshedStudent) {
    throw new GraphQLRequestError("Nao foi possivel atualizar o aluno.", "STUDENT_NOT_FOUND");
  }

  return refreshedStudent;
}
