import { ButtonLink, EmptyState } from "@/components/ui";

export default function ListingNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-28">
      <EmptyState
        title="That listing isn't yours to edit"
        action={<ButtonLink href="/dashboard">Back to your apps</ButtonLink>}
      >
        It may have been deleted, or it belongs to another publisher.
      </EmptyState>
    </div>
  );
}
