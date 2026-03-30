"use client";

import { searchStudentPeople } from "@/features/alunos/api/search-student-people";
import { type MockPerson } from "@/features/alunos/api/student-mock-service";
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";

type PersonAutocompleteProps = {
  excludedPersonIds?: string[];
  label?: string;
  onCreateNew?: (query: string) => void;
  onOpenModal: () => void;
  onSelect: (person: MockPerson) => void;
  placeholder?: string;
  value: MockPerson | null;
};

function mapPersonDescription(person: MockPerson) {
  return `${person.documentNumber} - ${person.phone} - ${person.email}`;
}

function mapPersonId(person: MockPerson) {
  return person.id;
}

function mapPersonLabel(person: MockPerson) {
  return person.fullName;
}

function searchPeople(input: { query: string }) {
  return searchStudentPeople({ query: input.query, limit: 8 });
}

export function PersonAutocomplete({
  excludedPersonIds = [],
  onCreateNew,
  onOpenModal,
  onSelect,
  placeholder = "Pesquisar por nome, documento ou telefone",
  value
}: PersonAutocompleteProps) {
  return (
    <EntityAutocomplete<MockPerson>
      createNewLabel="Cadastrar nova pessoa"
      emptyMessage="Nenhum resultado encontrado."
      excludedIds={excludedPersonIds}
      getDescription={mapPersonDescription}
      getId={mapPersonId}
      getLabel={mapPersonLabel}
      onCreateNew={onCreateNew}
      onOpenModal={onOpenModal}
      onSearchErrorMessage="Nao foi possivel carregar pessoas agora."
      onSelect={onSelect}
      placeholder={placeholder}
      search={searchPeople}
      value={value}
    />
  );
}
