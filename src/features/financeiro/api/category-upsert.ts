import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_CATEGORY_BY_ID_QUERY = `
  query GetCategoryById($id: UUID!) {
    categories(where: { id: { eq: $id }, isDeleted: { eq: false } }, first: 1) {
      nodes {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

const CREATE_CATEGORY_MUTATION = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      category {
        id
        name
        createdAt
      }
    }
  }
`;

const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateCategory($id: UUID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      category {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: UUID!) {
    deleteCategory(id: $id)
  }
`;

export type CategoryRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
};

type GetCategoryByIdResponse = {
  categories: {
    nodes: CategoryRecord[];
  };
};

type CreateCategoryResponse = {
  createCategory: {
    category: CategoryRecord;
  };
};

type UpdateCategoryResponse = {
  updateCategory: {
    category: CategoryRecord;
  };
};

type DeleteCategoryResponse = {
  deleteCategory: boolean;
};

export async function getCategoryById(id: string): Promise<CategoryRecord> {
  const data = await gqlRequest<GetCategoryByIdResponse, { id: string }>(GET_CATEGORY_BY_ID_QUERY, { id });
  const category = data.categories.nodes[0];

  if (!category) {
    throw new GraphQLRequestError("Categoria nao encontrada.", "CATEGORY_NOT_FOUND");
  }

  return category;
}

export async function createCategory(input: { name: string }): Promise<CategoryRecord> {
  const data = await gqlRequest<CreateCategoryResponse, { input: { name: string } }>(CREATE_CATEGORY_MUTATION, {
    input
  });

  return data.createCategory.category;
}

export async function updateCategory(id: string, input: { name: string }): Promise<CategoryRecord> {
  const data = await gqlRequest<UpdateCategoryResponse, { id: string; input: { name: string } }>(
    UPDATE_CATEGORY_MUTATION,
    { id, input }
  );

  return data.updateCategory.category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const data = await gqlRequest<DeleteCategoryResponse, { id: string }>(DELETE_CATEGORY_MUTATION, { id });
  return data.deleteCategory;
}

const CATEGORY_ERROR_MESSAGES: Record<string, string> = {
  CATEGORY_NAME_DUPLICATE: "Ja existe uma categoria com esse nome.",
  CATEGORY_NOT_FOUND: "Categoria nao encontrada."
};

export function mapCategoryApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && CATEGORY_ERROR_MESSAGES[error.code]) {
      return CATEGORY_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel salvar os dados da categoria.";
  }

  return "Nao foi possivel salvar os dados da categoria.";
}
