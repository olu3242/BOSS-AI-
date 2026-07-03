import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { ReviewsClient } from "./ReviewsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function ReviewsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let reviews: Awaited<ReturnType<typeof apiClient.listReviews>> = [];
  let error: string | null = null;

  try {
    reviews = await apiClient.listReviews(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load reviews";
  }

  return <ReviewsClient orgId={orgId} businessId={businessId} reviews={reviews} error={error} />;
}
