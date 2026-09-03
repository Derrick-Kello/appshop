import { ButtonLink, EmptyState } from "@/components/ui";

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24">
      <EmptyState
        title="No app at that address"
        action={<ButtonLink href="/apps">Browse the store</ButtonLink>}
      >
        The listing may have been unpublished, or the link may have a typo in it.
      </EmptyState>
    </div>
  );
}
