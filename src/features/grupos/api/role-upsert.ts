import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_ROLE_BY_ID_QUERY = `
  query GetRoleById($id: UUID!) {
    roleById(id: $id) {
      id
      name
      description
      isActive
      permissions {
        id
        name
        group
        description
        isActive
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_ROLE_MUTATION = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_ROLE_MUTATION = `
  mutation UpdateRole($id: UUID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
      name
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

const DELETE_ROLE_MUTATION = `
  mutation DeleteRole($id: UUID!) {
    deleteRole(id: $id)
  }
`;

const UPDATE_ROLE_PERMISSIONS_MUTATION = `
  mutation UpdateRolePermissions($roleId: UUID!, $permissionIds: [UUID!]!) {
    updateRolePermissions(roleId: $roleId, permissionIds: $permissionIds) {
      id
      name
      permissions {
        id
        name
        group
        description
        isActive
      }
      updatedAt
    }
  }
`;

const GET_PERMISSIONS_QUERY = `
  query GetPermissions {
    permissions {
      id
      name
      group
      description
      isActive
    }
  }
`;

export type PermissionRecord = {
  id: string;
  name: string;
  group: string;
  description?: string | null;
  isActive: boolean;
};

export type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissions: PermissionRecord[];
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
};

export type UpdateRoleInput = {
  name: string;
  description?: string;
  isActive?: boolean;
};

type GetRoleByIdResponse = {
  roleById: RoleRecord | null;
};

type CreateRoleResponse = {
  createRole: RoleRecord;
};

type UpdateRoleResponse = {
  updateRole: RoleRecord;
};

type DeleteRoleResponse = {
  deleteRole: boolean;
};

type UpdateRolePermissionsResponse = {
  updateRolePermissions: {
    id: string;
    name: string;
    permissions: PermissionRecord[];
    updatedAt?: string | null;
  };
};

type GetPermissionsResponse = {
  permissions: PermissionRecord[];
};

export async function getRoleById(id: string) {
  const data = await gqlRequest<GetRoleByIdResponse, { id: string }>(GET_ROLE_BY_ID_QUERY, { id });
  return data.roleById;
}

export async function createRole(input: CreateRoleInput) {
  const data = await gqlRequest<CreateRoleResponse, { input: CreateRoleInput }>(CREATE_ROLE_MUTATION, { input });
  return data.createRole;
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const data = await gqlRequest<UpdateRoleResponse, { id: string; input: UpdateRoleInput }>(UPDATE_ROLE_MUTATION, {
    id,
    input
  });
  return data.updateRole;
}

export async function deleteRole(id: string) {
  const data = await gqlRequest<DeleteRoleResponse, { id: string }>(DELETE_ROLE_MUTATION, { id });
  return data.deleteRole;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const data = await gqlRequest<
    UpdateRolePermissionsResponse,
    { roleId: string; permissionIds: string[] }
  >(UPDATE_ROLE_PERMISSIONS_MUTATION, { roleId, permissionIds });
  return data.updateRolePermissions;
}

export async function getPermissions() {
  const data = await gqlRequest<GetPermissionsResponse>(GET_PERMISSIONS_QUERY);
  return data.permissions ?? [];
}

const ROLE_ERROR_MESSAGES: Record<string, string> = {
  ROLE_NOT_FOUND: "Grupo nao encontrado.",
  ROLE_NAME_ALREADY_EXISTS: "Ja existe um grupo com este nome.",
  PERMISSION_NOT_FOUND: "Uma ou mais permissoes selecionadas nao existem."
};

export function mapRoleApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && ROLE_ERROR_MESSAGES[error.code]) {
      return ROLE_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    if (error.code === "AUTH_NOT_AUTHORIZED") {
      return "Sessao expirada. Entre novamente.";
    }

    return error.message || "Nao foi possivel salvar os dados do grupo.";
  }

  return "Nao foi possivel salvar os dados do grupo.";
}
