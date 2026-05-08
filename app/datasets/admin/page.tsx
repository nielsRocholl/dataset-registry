import { redirect } from "next/navigation";
import { AsteriskIcon } from "lucide-react";

import { AdminMembersPanel } from "@/components/admin-members-panel";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { listAdminMembers } from "@/lib/catalogue/admin-members";

export default async function AdminPage() {
  const user = await getCurrentCatalogueUser();
  if (!user?.isAdmin) {
    redirect("/unauthorized");
  }

  const members = await listAdminMembers();

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-16">
        <header className="flex flex-col gap-5 px-1 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <AsteriskIcon className="mt-1 size-8 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <p className="ui-kicker">Admin</p>
              <h1 className="ui-title mt-2 text-[length:var(--text-3xl)]">
                Catalogue access
              </h1>
              <p className="ui-copy mt-3 max-w-[48rem] text-[length:var(--text-sm)]">
                Add members, promote admins, and revoke access without changing
                deployment environment variables.
              </p>
            </div>
          </div>
        </header>

        <AdminMembersPanel initialMembers={members} />
      </section>
    </main>
  );
}
