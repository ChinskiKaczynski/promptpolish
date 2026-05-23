import { notFound } from 'next/navigation'

export default async function PrivateResultPage() {
  // TODO: Implement after Supabase data access layer.
  // Access rule: resolve owner_anonymous_id server-side from secure cookie,
  // then load result only with matching owner.
  notFound()
}
