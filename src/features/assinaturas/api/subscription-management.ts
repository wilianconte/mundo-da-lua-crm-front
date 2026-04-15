import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_MY_ACTIVE_PLAN_QUERY = `
  query GetMyActivePlan {
    myActivePlan {
      id
      planId
      startDate
      endDate
      isTrial
      fallbackPlanId
      cancelledAt
      pausedAt
      status
      plan {
        id
        name
        displayName
        price
        isActive
        sortOrder
        planFeatures {
          id
          value
          feature {
            id
            key
            description
            type
          }
        }
      }
      fallbackPlan {
        id
        name
        displayName
        price
        isActive
        sortOrder
      }
    }
  }
`;

const GET_PLANS_QUERY = `
  query GetPlans($order: [PlanSortInput!]) {
    plans(order: $order) {
      id
      name
      displayName
      price
      isActive
      sortOrder
      planFeatures {
        id
        value
        feature {
          id
          key
          description
          type
        }
      }
    }
  }
`;

const GET_MY_TENANT_QUERY = `
  query GetMyTenant {
    myTenant {
      id
      name
      status
    }
  }
`;

const GET_MY_BILLINGS_QUERY = `
  query GetMyBillings(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: BillingFilterInput
    $order: [BillingSortInput!]
  ) {
    myBillings(
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
        tenantPlanId
        amount
        dueDate
        paidAt
        referenceMonth
        status
        invoiceUrl
        tenantPlan {
          id
          plan {
            id
            name
            displayName
            price
          }
        }
      }
    }
  }
`;

const UPGRADE_TENANT_PLAN_MUTATION = `
  mutation UpgradeTenantPlan($input: UpgradeTenantPlanInput!) {
    upgradeTenantPlan(input: $input)
  }
`;

const CANCEL_TENANT_PLAN_MUTATION = `
  mutation CancelTenantPlan($input: CancelTenantPlanInput!) {
    cancelTenantPlan(input: $input)
  }
`;

const REVERT_CANCELLATION_MUTATION = `
  mutation RevertCancellation {
    revertCancellation
  }
`;

const START_TRIAL_MUTATION = `
  mutation StartTrial($input: StartTrialInput!) {
    startTrial(input: $input)
  }
`;

const TERMINATE_TRIAL_MUTATION = `
  mutation TerminateTrial($input: TerminateTrialInput!) {
    terminateTrial(input: $input)
  }
`;

const MARK_BILLING_AS_PAID_MUTATION = `
  mutation MarkBillingAsPaid($input: MarkBillingAsPaidInput!) {
    markBillingAsPaid(input: $input)
  }
`;

type DecimalValue = string | number;

export type FeatureType = "NUMERIC" | "BOOLEAN";
export type TenantPlanStatus = "ACTIVE" | "PAUSED" | "PENDING_CANCELLATION" | "EXPIRED" | "CANCELLED" | "UPGRADED";
export type BillingStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
export type TenantStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED";

export type SubscriptionFeature = {
  id: string;
  key: string;
  description: string;
  type: FeatureType;
};

export type SubscriptionPlanFeature = {
  id: string;
  value?: number | null;
  feature: SubscriptionFeature;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  displayName: string;
  price: DecimalValue;
  isActive: boolean;
  sortOrder: number;
  planFeatures: SubscriptionPlanFeature[];
};

export type ActiveTenantPlan = {
  id: string;
  planId: string;
  startDate: string;
  endDate?: string | null;
  isTrial: boolean;
  fallbackPlanId?: string | null;
  cancelledAt?: string | null;
  pausedAt?: string | null;
  status: TenantPlanStatus;
  plan: SubscriptionPlan;
  fallbackPlan?: SubscriptionPlan | null;
};

export type MyTenant = {
  id: string;
  name: string;
  status: TenantStatus;
};

export type BillingNode = {
  id: string;
  tenantPlanId: string;
  amount: DecimalValue;
  dueDate: string;
  paidAt?: string | null;
  referenceMonth: string;
  status: BillingStatus;
  invoiceUrl?: string | null;
  tenantPlan: {
    id: string;
    plan: Pick<SubscriptionPlan, "id" | "name" | "displayName" | "price">;
  };
};

export type BillingsConnection = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  nodes: BillingNode[];
};

type GetMyActivePlanResponse = {
  myActivePlan: ActiveTenantPlan | null;
};

type GetPlansResponse = {
  plans: SubscriptionPlan[];
};

type GetMyTenantResponse = {
  myTenant: MyTenant | null;
};

type GetMyBillingsResponse = {
  myBillings: BillingsConnection;
};

type BooleanMutationResponse<TKey extends string> = Record<TKey, boolean>;

export type GetMyBillingsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: Record<string, unknown> | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getMyActivePlan() {
  const data = await gqlRequest<GetMyActivePlanResponse>(GET_MY_ACTIVE_PLAN_QUERY);
  return data.myActivePlan;
}

export async function getPlans() {
  const data = await gqlRequest<GetPlansResponse, { order: Array<Record<string, "ASC" | "DESC">> }>(GET_PLANS_QUERY, {
    order: [{ sortOrder: "ASC" }]
  });

  return data.plans;
}

export async function getMyTenant() {
  const data = await gqlRequest<GetMyTenantResponse>(GET_MY_TENANT_QUERY);
  return data.myTenant;
}

export async function getMyBillings(variables: GetMyBillingsVariables) {
  const data = await gqlRequest<GetMyBillingsResponse, GetMyBillingsVariables>(GET_MY_BILLINGS_QUERY, variables);
  return data.myBillings;
}

export async function upgradeTenantPlan(newPlanId: string) {
  const data = await gqlRequest<BooleanMutationResponse<"upgradeTenantPlan">, { input: { newPlanId: string } }>(
    UPGRADE_TENANT_PLAN_MUTATION,
    { input: { newPlanId } }
  );

  return data.upgradeTenantPlan;
}

export async function cancelTenantPlan(downgradeToPlanId: string) {
  const data = await gqlRequest<BooleanMutationResponse<"cancelTenantPlan">, { input: { downgradeToPlanId: string } }>(
    CANCEL_TENANT_PLAN_MUTATION,
    { input: { downgradeToPlanId } }
  );

  return data.cancelTenantPlan;
}

export async function revertCancellation() {
  const data = await gqlRequest<BooleanMutationResponse<"revertCancellation">>(REVERT_CANCELLATION_MUTATION);
  return data.revertCancellation;
}

export async function startTrial(trialPlanId: string) {
  const data = await gqlRequest<BooleanMutationResponse<"startTrial">, { input: { trialPlanId: string } }>(
    START_TRIAL_MUTATION,
    { input: { trialPlanId } }
  );

  return data.startTrial;
}

export async function terminateTrial(downgradeToPlanId?: string) {
  const data = await gqlRequest<BooleanMutationResponse<"terminateTrial">, { input: { downgradeToPlanId?: string } }>(
    TERMINATE_TRIAL_MUTATION,
    { input: { downgradeToPlanId } }
  );

  return data.terminateTrial;
}

export async function markBillingAsPaid(billingId: string) {
  const data = await gqlRequest<BooleanMutationResponse<"markBillingAsPaid">, { input: { billingId: string } }>(
    MARK_BILLING_AS_PAID_MUTATION,
    { input: { billingId } }
  );

  return data.markBillingAsPaid;
}

const SUBSCRIPTION_ERROR_MESSAGES: Record<string, string> = {
  TENANT_PLAN_NOT_FOUND: "Nao foi possivel localizar o estado atual da assinatura.",
  PLAN_NOT_FOUND: "O plano selecionado nao esta mais disponivel.",
  UPGRADE_TO_FREE_NOT_ALLOWED: "Use o cancelamento para retornar ao plano gratuito.",
  PLAN_SAME_AS_CURRENT: "Este tenant ja esta no plano selecionado.",
  UPGRADE_BLOCKED_PENDING_CANCELLATION: "Reverta o cancelamento antes de trocar de plano.",
  PLAN_CANCEL_TRIAL_NOT_ALLOWED: "Use a acao de encerrar trial para sair do periodo de avaliacao.",
  PLAN_NOT_ACTIVE: "O plano nao esta ativo para esta operacao.",
  DOWNGRADE_PLAN_NOT_FOUND: "O plano de destino nao esta disponivel.",
  PLAN_NOT_PENDING_CANCELLATION: "Nao existe cancelamento pendente para reverter.",
  PLAN_ALREADY_EXPIRED: "O periodo contratado ja encerrou. Nao e mais possivel reverter.",
  TRIAL_OF_FREE_NOT_ALLOWED: "O plano gratuito nao possui periodo de trial.",
  TRIAL_ALREADY_USED: "Este tenant ja usou o trial deste plano.",
  PLAN_PENDING_CANCELLATION: "Reverta o cancelamento antes de iniciar um trial.",
  PLAN_NOT_TRIAL: "Nao existe trial ativo para encerrar.",
  DOWNGRADE_PLAN_REQUIRED: "Selecione o plano de destino para encerrar o trial.",
  BILLING_NOT_FOUND: "Nao foi possivel localizar a cobranca selecionada.",
  BILLING_CANNOT_BE_PAID: "Esta cobranca nao pode ser marcada como paga.",
  AUTH_NOT_AUTHORIZED: "Voce nao tem permissao para concluir esta acao."
};

export function mapSubscriptionApiError(error: unknown) {
  if (error instanceof GraphQLRequestError) {
    if (error.code && SUBSCRIPTION_ERROR_MESSAGES[error.code]) {
      return SUBSCRIPTION_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel concluir a operacao da assinatura.";
  }

  return "Nao foi possivel concluir a operacao da assinatura.";
}
