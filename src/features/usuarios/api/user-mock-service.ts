const MOCK_DELAY_MS = 350;

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type UserListItem = {
  id: string;
  fullName: string;
  email?: string | null;
  documentNumber?: string | null;
  primaryPhone?: string | null;
  role: string;
  status: UserStatus;
  createdAt: string;
};

const mockUsers: UserListItem[] = [
  {
    id: "user-1",
    fullName: "Ana Paula Mendes",
    email: "ana.mendes@mundodalua.com.br",
    documentNumber: "123.456.789-00",
    primaryPhone: "(11) 99876-2100",
    role: "Administrador",
    status: "ACTIVE",
    createdAt: "2026-02-02T10:20:00.000Z"
  },
  {
    id: "user-2",
    fullName: "Bruno Carvalho",
    email: "bruno.carvalho@mundodalua.com.br",
    documentNumber: "234.567.890-11",
    primaryPhone: "(11) 99711-4300",
    role: "Coordenador",
    status: "ACTIVE",
    createdAt: "2026-02-05T14:10:00.000Z"
  },
  {
    id: "user-3",
    fullName: "Camila Duarte",
    email: "camila.duarte@mundodalua.com.br",
    documentNumber: "345.678.901-22",
    primaryPhone: "(21) 98855-2200",
    role: "Atendente",
    status: "INACTIVE",
    createdAt: "2026-01-28T08:40:00.000Z"
  },
  {
    id: "user-4",
    fullName: "Diego Ferreira",
    email: "diego.ferreira@mundodalua.com.br",
    documentNumber: "456.789.012-33",
    primaryPhone: "(21) 97733-1188",
    role: "Financeiro",
    status: "ACTIVE",
    createdAt: "2026-02-11T16:05:00.000Z"
  },
  {
    id: "user-5",
    fullName: "Elisa Rocha",
    email: "elisa.rocha@mundodalua.com.br",
    documentNumber: "567.890.123-44",
    primaryPhone: "(31) 96622-9911",
    role: "Supervisor",
    status: "BLOCKED",
    createdAt: "2026-01-20T11:25:00.000Z"
  },
  {
    id: "user-6",
    fullName: "Felipe Nunes",
    email: "felipe.nunes@mundodalua.com.br",
    documentNumber: "678.901.234-55",
    primaryPhone: "(31) 95512-0198",
    role: "Atendente",
    status: "ACTIVE",
    createdAt: "2026-02-14T09:00:00.000Z"
  },
  {
    id: "user-7",
    fullName: "Gabriela Silva",
    email: "gabriela.silva@mundodalua.com.br",
    documentNumber: "789.012.345-66",
    primaryPhone: "(41) 94488-4455",
    role: "Coordenador",
    status: "ACTIVE",
    createdAt: "2026-02-17T13:45:00.000Z"
  },
  {
    id: "user-8",
    fullName: "Henrique Alves",
    email: "henrique.alves@mundodalua.com.br",
    documentNumber: "890.123.456-77",
    primaryPhone: "(41) 93340-7744",
    role: "Administrador",
    status: "INACTIVE",
    createdAt: "2026-01-15T15:35:00.000Z"
  },
  {
    id: "user-9",
    fullName: "Isabela Moraes",
    email: "isabela.moraes@mundodalua.com.br",
    documentNumber: "901.234.567-88",
    primaryPhone: "(51) 92200-1212",
    role: "Atendente",
    status: "ACTIVE",
    createdAt: "2026-02-19T10:05:00.000Z"
  },
  {
    id: "user-10",
    fullName: "Joao Pedro Lima",
    email: "joao.lima@mundodalua.com.br",
    documentNumber: "012.345.678-99",
    primaryPhone: "(51) 91110-5656",
    role: "Financeiro",
    status: "BLOCKED",
    createdAt: "2026-01-10T12:30:00.000Z"
  }
];

function wait(delay = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function getMockUsers() {
  await wait();
  return [...mockUsers];
}
