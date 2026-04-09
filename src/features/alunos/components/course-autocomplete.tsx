"use client";

import { searchStudentCourses } from "@/features/alunos/api/search-student-courses";
import { type MockCourse } from "@/features/alunos/api/student-mock-service";
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";

type CourseAutocompleteProps = {
  excludedCourseIds?: string[];
  onCreateNew?: (query: string) => void;
  onOpenModal: () => void;
  onSelect: (course: MockCourse) => void;
  placeholder?: string;
  value: MockCourse | null;
};

function mapCourseDescription(course: MockCourse) {
  return `${course.code} - ${course.category}`;
}

function mapCourseId(course: MockCourse) {
  return course.id;
}

function mapCourseLabel(course: MockCourse) {
  return course.name;
}

function searchCourses(input: { query: string }) {
  return searchStudentCourses({ query: input.query });
}

export function CourseAutocomplete({
  excludedCourseIds = [],
  onCreateNew,
  onOpenModal,
  onSelect,
  placeholder = "Pesquisar por nome, codigo ou categoria",
  value
}: CourseAutocompleteProps) {
  return (
    <EntityAutocomplete<MockCourse>
      createNewLabel="Cadastrar novo curso"
      emptyMessage="Nenhum curso encontrado."
      excludedIds={excludedCourseIds}
      getDescription={mapCourseDescription}
      getId={mapCourseId}
      getLabel={mapCourseLabel}
      onCreateNew={onCreateNew}
      onOpenModal={onOpenModal}
      onSelect={onSelect}
      placeholder={placeholder}
      search={searchCourses}
      value={value}
    />
  );
}
