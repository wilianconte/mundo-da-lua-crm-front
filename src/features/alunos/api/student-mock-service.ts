import { getPersonById } from "@/features/pessoas/api/person-upsert";

const MOCK_DELAY_MS = 450;

export type StudentStatus = "ACTIVE" | "PENDING" | "INACTIVE";
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
  school: string;
  gradeClass: string;
  startDate: string;
  notes?: string;
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
  registrationNumber: string;
  status: StudentStatus;
  school: string;
  gradeClass: string;
  startDate: string;
  notes?: string;
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
  { value: "ACTIVE", label: "Ativo" },
  { value: "PENDING", label: "Pendente" },
  { value: "INACTIVE", label: "Inativo" }
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
    status: "ACTIVE",
    school: "Mundo da Lua Kids",
    gradeClass: "Grade 2 / Sun",
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
    status: "PENDING",
    school: "Mundo da Lua Bilingual",
    gradeClass: "Grade 1 / Moon",
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
    status: "INACTIVE",
    school: "Mundo da Lua Kids",
    gradeClass: "Grade 3 / Star",
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
  if (status === "ACTIVE") return "Ativo";
  if (status === "PENDING") return "Pendente";
  return "Inativo";
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

export async function searchStudents(filters: StudentSearchFilters) {
  await wait();
  const studentsWithPerson = await Promise.all(
    mockStudents.map(async (student) => {
      const mockPerson = mockPeople.find((item) => item.id === student.personId);
      if (mockPerson) {
        return { student, person: mockPerson };
      }

      try {
        const person = await getPersonById(student.personId);
        if (!person) return { student, person: null };
        return {
          student,
          person: {
            id: person.id,
            fullName: person.fullName,
            documentNumber: person.documentNumber ?? "",
            phone: person.primaryPhone ?? "",
            email: person.email ?? ""
          } satisfies MockPerson
        };
      } catch {
        return { student, person: null };
      }
    })
  );

  return studentsWithPerson
    .map<StudentListItem>(({ student, person }) => {
      const primaryGuardian = student.guardians.find((guardian) => guardian.isPrimaryGuardian) ?? student.guardians[0];

      return {
        id: student.id,
        studentName: person?.fullName ?? "Aluno nao identificado",
        documentNumber: person?.documentNumber ?? "",
        registrationNumber: student.registrationNumber,
        school: student.school,
        gradeClass: student.gradeClass,
        status: student.status,
        primaryGuardianName: primaryGuardian?.person.fullName ?? "-",
        primaryGuardianPhone: primaryGuardian?.person.phone ?? "-"
      };
    })
    .filter((student) => {
      const matchesName = !filters.studentName || normalize(student.studentName).includes(normalize(filters.studentName));
      const matchesDocument =
        !filters.documentNumber || normalize(student.documentNumber).includes(normalize(filters.documentNumber));
      const matchesGuardian =
        !filters.guardianName || normalize(student.primaryGuardianName).includes(normalize(filters.guardianName));
      const matchesStatus = !filters.status || student.status === filters.status;
      const matchesRegistration =
        !filters.registrationNumber || normalize(student.registrationNumber).includes(normalize(filters.registrationNumber));
      const matchesSchool = !filters.school || normalize(student.school).includes(normalize(filters.school));
      const matchesGrade = !filters.gradeClass || normalize(student.gradeClass).includes(normalize(filters.gradeClass));

      return (
        matchesName &&
        matchesDocument &&
        matchesGuardian &&
        matchesStatus &&
        matchesRegistration &&
        matchesSchool &&
        matchesGrade
      );
    });
}

export async function getStudentById(studentId: string) {
  await wait(350);
  const student = mockStudents.find((item) => item.id === studentId);
  if (!student) return null;

  return {
    ...student,
    guardians: student.guardians.map((guardian) => ({ ...guardian, person: { ...guardian.person } })),
    courses: student.courses?.map((enrollment) => ({
      ...enrollment,
      course: { ...enrollment.course }
    })) ?? []
  } satisfies StudentRecord;
}

export async function saveStudent(studentId: string | null, payload: StudentFormPayload) {
  await wait(500);

  const nextStudent: StudentRecord = {
    id: studentId ?? `student-${Date.now()}`,
    ...payload,
    notes: payload.notes?.trim() || undefined,
    guardians: payload.guardians.map((guardian, index) => ({
      ...guardian,
      id: guardian.id || `guardian-${Date.now()}-${index}`,
      notes: guardian.notes?.trim() || undefined
    })),
    courses: payload.courses.map((enrollment, index) => ({
      ...enrollment,
      id: enrollment.id || `enrollment-${Date.now()}-${index}`,
      course: { ...enrollment.course }
    }))
  };

  if (studentId) {
    mockStudents = mockStudents.map((student) => (student.id === studentId ? nextStudent : student));
    return nextStudent;
  }

  mockStudents = [nextStudent, ...mockStudents];
  return nextStudent;
}
