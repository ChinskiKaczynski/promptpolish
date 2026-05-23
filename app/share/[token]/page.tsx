import { notFound } from 'next/navigation'

export default async function SharedResultPage() {
  // TODO: Implement after share-link data access layer.
  // Access rule: load only by random share_token where is_share_enabled = true.
  notFound()
}
