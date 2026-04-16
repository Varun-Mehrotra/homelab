import Link from "next/link";
import { CreateEventForm } from "@/components/create-event-form";
import { categories, defaultMapLocation, torontoRegions } from "@/lib/data";

export default function CreateEventPage() {
  return (
    <main className="page-shell">
      <div className="header-row">
        <div>
          <Link className="back-link" href="/">
            Back to discovery
          </Link>
          <h1 className="page-title">Create a Toronto-area event</h1>
          <p className="subtitle">
            Add a new listing with the essentials people need before they make plans: what it is, when it starts, where
            it happens, and how to book or contact you.
          </p>
        </div>
      </div>

      <CreateEventForm categories={categories} defaultLocation={defaultMapLocation} regions={torontoRegions} />
    </main>
  );
}
