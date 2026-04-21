/**
 * RbacGuard — Wraps any section/button/form to enforce role permissions
 * Usage:
 *   <RbacGuard allowed={rbac.canAddProduction}>
 *     <Button>Ajouter</Button>
 *   </RbacGuard>
 *
 *   <RbacGuard allowed={rbac.canAddProduction} mode="hide">
 *     → hides completely if not allowed
 *   </RbacGuard>
 *
 *   <RbacGuard allowed={rbac.canViewFinancial} mode="page">
 *     → full page block with explanation
 *   </RbacGuard>
 */
import { ROLE_LABELS, ROLE_COLORS } from "@/contexts/AuthContext";
import { useRbac } from "@/hooks/useRbac";
import { ShieldX, Eye } from "lucide-react";

interface Props {
  allowed: boolean;
  children: React.ReactNode;
  mode?: "hide" | "disable" | "page" | "inline";
  reason?: string;
}

export default function RbacGuard({ allowed, children, mode = "hide", reason }: Props) {
  const { role, isReadOnly } = useRbac();

  if (allowed) return <>{children}</>;

  if (mode === "hide") return null;

  if (mode === "disable") {
    return (
      <div className="relative opacity-50 pointer-events-none select-none" title="Accès non autorisé pour votre rôle">
        {children}
      </div>
    );
  }

  if (mode === "inline") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400">
        <ShieldX size={13} />
        <span>{reason || "Non autorisé pour votre rôle"}</span>
      </div>
    );
  }

  // mode === "page"
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <ShieldX size={28} className="text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700 mb-2">Accès non autorisé</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-4">
        {reason || "Cette section n'est pas accessible avec votre rôle actuel."}
      </p>
      {role && (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[role]}`}>
          Votre rôle : {ROLE_LABELS[role]}
        </span>
      )}
      {isReadOnly && (
        <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Eye size={13} />
          <span>Mode lecture seule — aucune modification possible</span>
        </div>
      )}
    </div>
  );
}

/** Read-only banner shown at top of pages for auditeur */
export function ReadOnlyBanner() {
  const { isReadOnly, role } = useRbac();
  if (!isReadOnly) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-sm text-blue-700">
      <Eye size={16} className="shrink-0" />
      <span>
        <strong>Mode lecture seule</strong> — Vous consultez les données sans pouvoir les modifier.
        Rôle actuel : <strong>{role ? ROLE_LABELS[role] : ""}</strong>
      </span>
    </div>
  );
}
