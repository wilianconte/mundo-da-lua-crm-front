export const SYSTEM_PERMISSIONS = {
  studentsRead: "students:read",
  studentsCreate: "students:create",
  studentsUpdate: "students:update",
  studentsDelete: "students:delete",
  customersRead: "customers:read",
  customersCreate: "customers:create",
  customersUpdate: "customers:update",
  customersDelete: "customers:delete",
  coursesRead: "courses:read",
  coursesCreate: "courses:create",
  coursesUpdate: "courses:update",
  coursesDelete: "courses:delete",
  peopleRead: "people:read",
  peopleCreate: "people:create",
  peopleUpdate: "people:update",
  peopleDelete: "people:delete",
  companiesRead: "companies:read",
  companiesCreate: "companies:create",
  companiesUpdate: "companies:update",
  companiesDelete: "companies:delete",
  walletsRead: "wallets:read",
  walletsCreate: "wallets:create",
  walletsUpdate: "wallets:update",
  walletsDelete: "wallets:delete",
  categoriesRead: "categories:read",
  categoriesCreate: "categories:create",
  categoriesUpdate: "categories:update",
  categoriesDelete: "categories:delete",
  paymentMethodsRead: "payment_methods:read",
  paymentMethodsCreate: "payment_methods:create",
  paymentMethodsUpdate: "payment_methods:update",
  paymentMethodsDelete: "payment_methods:delete",
  transactionsRead: "transactions:read",
  transactionsCreate: "transactions:create",
  transactionsUpdate: "transactions:update",
  transactionsDelete: "transactions:delete",
  transactionsReconcile: "transactions:reconcile",
  transactionsTransfer: "transactions:transfer",
  plansManage: "plans:manage",
  tenantsManage: "tenants:manage",
  usersManage: "users:manage",
  rolesManage: "roles:manage"
} as const;

type RoutePermissionRule = {
  prefix: string;
  anyOf: string[];
};

const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  {
    prefix: "/alunos",
    anyOf: [
      SYSTEM_PERMISSIONS.studentsRead,
      SYSTEM_PERMISSIONS.studentsCreate,
      SYSTEM_PERMISSIONS.studentsUpdate,
      SYSTEM_PERMISSIONS.studentsDelete
    ]
  },
  {
    prefix: "/clientes",
    anyOf: [
      SYSTEM_PERMISSIONS.customersRead,
      SYSTEM_PERMISSIONS.customersCreate,
      SYSTEM_PERMISSIONS.customersUpdate,
      SYSTEM_PERMISSIONS.customersDelete
    ]
  },
  {
    prefix: "/cursos",
    anyOf: [
      SYSTEM_PERMISSIONS.coursesRead,
      SYSTEM_PERMISSIONS.coursesCreate,
      SYSTEM_PERMISSIONS.coursesUpdate,
      SYSTEM_PERMISSIONS.coursesDelete
    ]
  },
  {
    prefix: "/courses",
    anyOf: [
      SYSTEM_PERMISSIONS.coursesRead,
      SYSTEM_PERMISSIONS.coursesCreate,
      SYSTEM_PERMISSIONS.coursesUpdate,
      SYSTEM_PERMISSIONS.coursesDelete
    ]
  },
  {
    prefix: "/pessoas",
    anyOf: [
      SYSTEM_PERMISSIONS.peopleRead,
      SYSTEM_PERMISSIONS.peopleCreate,
      SYSTEM_PERMISSIONS.peopleUpdate,
      SYSTEM_PERMISSIONS.peopleDelete
    ]
  },
  {
    prefix: "/empresas",
    anyOf: [
      SYSTEM_PERMISSIONS.companiesRead,
      SYSTEM_PERMISSIONS.companiesCreate,
      SYSTEM_PERMISSIONS.companiesUpdate,
      SYSTEM_PERMISSIONS.companiesDelete
    ]
  },
  {
    prefix: "/financeiro",
    anyOf: [
      SYSTEM_PERMISSIONS.walletsRead,
      SYSTEM_PERMISSIONS.transactionsRead,
      SYSTEM_PERMISSIONS.categoriesRead,
      SYSTEM_PERMISSIONS.paymentMethodsRead
    ]
  },
  { prefix: "/assinaturas/tenants", anyOf: [SYSTEM_PERMISSIONS.tenantsManage] },
  { prefix: "/usuarios", anyOf: [SYSTEM_PERMISSIONS.usersManage] },
  { prefix: "/grupos", anyOf: [SYSTEM_PERMISSIONS.rolesManage] }
];

const DASHBOARD_FALLBACK_PATHS = [
  "/",
  "/alunos/pesquisa",
  "/pessoas/pesquisa",
  "/empresas/pesquisa",
  "/cursos/pesquisa",
  "/financeiro",
  "/usuarios/pesquisa",
  "/grupos/pesquisa"
];

function normalizePath(pathname: string) {
  return pathname.split("?")[0].split("#")[0];
}

export function normalizePermission(permission: string) {
  return permission.trim().toLowerCase();
}

export function normalizePermissions(permissions: string[]) {
  const normalized = permissions
    .filter((permission) => typeof permission === "string")
    .map((permission) => normalizePermission(permission))
    .filter((permission) => permission.length > 0);

  return Array.from(new Set(normalized));
}

export function hasPermission(permissions: string[], permission: string) {
  const requiredPermission = normalizePermission(permission);
  if (!requiredPermission) {
    return false;
  }

  return permissions.some((currentPermission) => normalizePermission(currentPermission) === requiredPermission);
}

export function canAccessPath(pathname: string, permissions: string[]) {
  const normalizedPath = normalizePath(pathname);
  const matchingRule = ROUTE_PERMISSION_RULES.find(
    (rule) => normalizedPath === rule.prefix || normalizedPath.startsWith(`${rule.prefix}/`)
  );

  if (!matchingRule) {
    return true;
  }

  return matchingRule.anyOf.some((permission) => hasPermission(permissions, permission));
}

export function getFirstAccessiblePath(permissions: string[]) {
  const firstAccessible = DASHBOARD_FALLBACK_PATHS.find((path) => canAccessPath(path, permissions));
  return firstAccessible ?? "/";
}
