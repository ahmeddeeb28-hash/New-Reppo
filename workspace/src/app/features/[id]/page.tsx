import { redirect } from "next/navigation";

export default async function FeatureIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/features/${id}/context`);
}
