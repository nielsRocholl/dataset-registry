"use client";

import { useMemo, useState } from "react";
import {
  SaveIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATALOGUE_FORM_FIELD_BODY_SCOPE } from "@/lib/catalogue/catalogue-form-field-scope";
import type { AdminMember } from "@/lib/catalogue/admin-members";
import type { CatalogueRole } from "@/lib/catalogue/user-profile";
import { cn } from "@/lib/utils";

const roleItems = [
  { label: "Member", value: "member" },
  { label: "Admin", value: "admin" },
];

function statusLabel(member: AdminMember) {
  if (member.lastSignInAt) return "Signed in";
  if (member.authUserId) return "Account created";
  return "Pre-approved";
}

function formatWhen(iso: string | null) {
  if (!iso) return "Not yet";
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return iso;
  return `${time.toISOString().slice(0, 10)}`;
}

export function AdminMembersPanel({
  initialMembers,
}: {
  initialMembers: AdminMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<CatalogueRole>("member");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminMember | null>(null);

  const adminCount = useMemo(
    () => members.filter((member) => member.role === "admin").length,
    [members],
  );

  async function reloadMembers() {
    const res = await fetch("/api/admin/members", { credentials: "include" });
    const body: unknown = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (body && typeof body === "object" && "members" in body) {
      setMembers((body as { members: AdminMember[] }).members);
    }
  }

  async function addMember() {
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, role }),
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Save failed (${res.status})`;
        setError(msg);
        return;
      }
      setEmail("");
      setDisplayName("");
      setRole("member");
      setNotice("Member saved.");
      await reloadMembers();
    } finally {
      setPending(false);
    }
  }

  async function saveMember(member: AdminMember) {
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(member.email)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: member.displayName,
            role: member.role,
          }),
        },
      );
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Update failed (${res.status})`;
        setError(msg);
        return;
      }
      setNotice("Member updated.");
      await reloadMembers();
    } finally {
      setPending(false);
    }
  }

  async function revokeMember() {
    if (!revokeTarget) return;
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(revokeTarget.email)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Revoke failed (${res.status})`;
        setError(msg);
        return;
      }
      setRevokeTarget(null);
      setNotice("Member revoked.");
      await reloadMembers();
    } finally {
      setPending(false);
    }
  }

  function updateMember(emailToUpdate: string, patch: Partial<AdminMember>) {
    setMembers((current) =>
      current.map((member) =>
        member.email === emailToUpdate ? { ...member, ...patch } : member,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-border/30 px-7 pb-6 pt-7">
          <div className="border-l-2 border-[#C4674F]/50 pl-3">
            <div className="flex items-center gap-2">
              <UserPlusIcon className="size-4 shrink-0 text-brand" aria-hidden />
              <span className="text-[13px] font-semibold tracking-[0.02em] text-foreground/80">
                Add catalogue member
              </span>
            </div>
          </div>
          <p className="mt-2 text-[13px] italic leading-snug text-muted-foreground/60">
            Pre-approve an email before the person signs in.
          </p>
        </div>

        <div className={cn("p-7", CATALOGUE_FORM_FIELD_BODY_SCOPE)}>
          <FieldGroup className="gap-5">
            <div className="grid gap-x-5 gap-y-5 md:grid-cols-[1.2fr_1fr_9rem_auto] md:items-end">
              <Field>
                <FieldLabel htmlFor="member-email">Email</FieldLabel>
                <Input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="person@example.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="member-name">Display name</FieldLabel>
                <Input
                  id="member-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  items={roleItems}
                  value={role}
                  onValueChange={(value) =>
                    setRole((value ?? "member") as CatalogueRole)
                  }
                >
                  <SelectTrigger size="lg" className="w-full" aria-label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="button"
                disabled={pending}
                onClick={() => void addMember()}
              >
                <UserPlusIcon data-icon="inline-start" />
                Add
              </Button>
            </div>
            <FieldDescription>
              Members can view, create, star, and manage their own datasets. Admins
              can manage all datasets and this list.
            </FieldDescription>
          </FieldGroup>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-[length:var(--text-sm)] text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
          <p className="text-[length:var(--text-xs)] text-muted-foreground">
            {adminCount} {adminCount === 1 ? "admin" : "admins"}
          </p>
        </div>
        <ul className="flex flex-col gap-1.5">
          {members.map((member) => (
            <li
              key={member.email}
              className={cn(
                "rounded-2xl border border-border/40 bg-card px-3.5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:-translate-y-px hover:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                CATALOGUE_FORM_FIELD_BODY_SCOPE,
              )}
            >
              <div className="grid gap-x-5 gap-y-3 lg:grid-cols-[1fr_13rem_8rem_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[length:var(--text-base)] font-medium text-foreground">
                      {member.email}
                    </p>
                    <Badge variant={member.role === "admin" ? "secondary" : "outline"}>
                      {member.role}
                    </Badge>
                    <Badge variant="outline">{statusLabel(member)}</Badge>
                  </div>
                  <p className="mt-1 text-[length:var(--text-xs)] text-muted-foreground">
                    Last sign-in {formatWhen(member.lastSignInAt)} · Profile{" "}
                    {member.profileUserId ? "synced" : "pending"}
                  </p>
                </div>
                <Input
                  aria-label={`Display name for ${member.email}`}
                  value={member.displayName}
                  onChange={(event) =>
                    updateMember(member.email, {
                      displayName: event.target.value,
                    })
                  }
                />
                <Select
                  items={roleItems}
                  value={member.role}
                  onValueChange={(value) =>
                    updateMember(member.email, {
                      role: (value ?? "member") as CatalogueRole,
                    })
                  }
                >
                  <SelectTrigger
                    size="lg"
                    className="w-full"
                    aria-label={`Role for ${member.email}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => void saveMember(member)}
                  >
                    <SaveIcon data-icon="inline-start" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => setRevokeTarget(member)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Revoke
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-[var(--shadow-soft)] ring-0 sm:max-w-[28rem]"
        >
          <div className="flex flex-col gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
            <DialogHeader className="gap-3">
              <DialogTitle className="flex items-center gap-2 font-display text-[length:var(--text-xl)] leading-tight text-foreground">
                <ShieldCheckIcon className="size-5 text-brand" aria-hidden />
                Revoke access?
              </DialogTitle>
              <DialogDescription className="text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                This removes catalogue access for the email. It does not delete
                their Supabase Auth account or any datasets.
              </DialogDescription>
            </DialogHeader>
            {revokeTarget ? (
              <p className="rounded-2xl border border-border bg-muted/50 px-3 py-2 text-[length:var(--text-sm)] font-medium text-foreground">
                {revokeTarget.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setRevokeTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void revokeMember()}
            >
              {pending ? "Revoking..." : "Revoke access"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
