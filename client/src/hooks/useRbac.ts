/**
 * useRbac — Central security hook
 * Determines exactly what each role can READ, WRITE, and DELETE
 * Used in every form, button, and page to enforce role boundaries
 */
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/contexts/AuthContext";

export interface RbacCapabilities {
  // ── Data visibility ───────────────────────────────────────────────
  canViewDashboard:      boolean;
  canViewSites:          boolean;
  canViewTeams:          boolean;
  canViewEmployees:      boolean;
  canViewSalaries:       boolean;  // RH, Finance, PDG, Directeur only
  canViewProduction:     boolean;
  canViewExpenses:       boolean;
  canViewCash:           boolean;
  canViewFinancial:      boolean;
  canViewEquipment:      boolean;
  canViewReports:        boolean;
  canViewSettings:       boolean;  // PDG only

  // ── Write permissions ─────────────────────────────────────────────
  canAddSite:            boolean;  // PDG only
  canEditSite:           boolean;  // PDG only

  canAddTeam:            boolean;  // PDG, Directeur
  canEditTeam:           boolean;  // PDG, Directeur

  canAddEmployee:        boolean;  // PDG, Directeur, RH
  canEditEmployee:       boolean;  // PDG, Directeur, RH
  canDeleteEmployee:     boolean;  // PDG only

  canAddProduction:      boolean;  // PDG, Directeur, Chef d'équipe
  canDeleteProduction:   boolean;  // PDG, Directeur

  canAddExpense:         boolean;  // PDG, Directeur, Finance, Logistique
  canDeleteExpense:      boolean;  // PDG, Directeur, Finance

  canAddCash:            boolean;  // PDG, Directeur, Finance
  canDeleteCash:         boolean;  // PDG only

  canAddEquipment:       boolean;  // PDG, Directeur, Responsable Équipements
  canEditEquipmentStatus:boolean;  // PDG, Directeur, Responsable Équipements
  canDeleteEquipment:    boolean;  // PDG only

  canAddAdvance:         boolean;  // PDG, Directeur, RH
  canDeleteAdvance:      boolean;  // PDG only

  canAddAttendance:      boolean;  // PDG, Directeur, RH, Chef d'équipe
  canManageUsers:        boolean;  // PDG only

  // ── Special constraints ───────────────────────────────────────────
  isReadOnly:            boolean;  // Auditeur = no writes at all
  scopedToSite:          boolean;  // Directeur = own site only
  scopedToTeam:          boolean;  // Chef d'équipe = own team only
  scopedToTransport:     boolean;  // Logistique = transport expenses only

  // ── Expense categories allowed ────────────────────────────────────
  allowedExpenseCategories: string[] | "all";

  // ── User info shortcuts ───────────────────────────────────────────
  role:   UserRole | undefined;
  siteId: string | undefined;
  teamId: string | undefined;
}

const ALL_EXPENSE_CATS = [
  "Alimentation","Salaires","Transport","Carburant",
  "Matériel","Équipement","Sécurité","Médical","Autre",
];

const TRANSPORT_CATS = ["Transport","Carburant"];

export function useRbac(): RbacCapabilities {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  // ── Helper: is role one of ─────────────────────────────────────────
  const is = (...roles: UserRole[]) => !!role && roles.includes(role);

  const r: RbacCapabilities = {
    // Visibility
    canViewDashboard:      is("pdg","directeur","rh","finance","chef_equipe","equipements","logistique","auditeur"),
    canViewSites:          is("pdg","directeur","logistique","auditeur"),
    canViewTeams:          is("pdg","directeur","rh","chef_equipe","auditeur"),
    canViewEmployees:      is("pdg","directeur","rh","finance","auditeur"),
    canViewSalaries:       is("pdg","directeur","rh","finance","auditeur"),
    canViewProduction:     is("pdg","directeur","chef_equipe","logistique","finance","auditeur"),
    canViewExpenses:       is("pdg","directeur","finance","equipements","logistique","auditeur"),
    canViewCash:           is("pdg","directeur","finance","auditeur"),
    canViewFinancial:      is("pdg","directeur","finance","auditeur"),
    canViewEquipment:      is("pdg","directeur","chef_equipe","equipements","logistique","auditeur"),
    canViewReports:        is("pdg","directeur","finance","auditeur"),
    canViewSettings:       is("pdg"),

    // Sites
    canAddSite:            is("pdg"),
    canEditSite:           is("pdg"),

    // Teams
    canAddTeam:            is("pdg","directeur"),
    canEditTeam:           is("pdg","directeur"),

    // Employees
    canAddEmployee:        is("pdg","directeur","rh"),
    canEditEmployee:       is("pdg","directeur","rh"),
    canDeleteEmployee:     is("pdg"),

    // Production
    canAddProduction:      is("pdg","directeur","chef_equipe"),
    canDeleteProduction:   is("pdg","directeur"),

    // Expenses
    canAddExpense:         is("pdg","directeur","finance","logistique"),
    canDeleteExpense:      is("pdg","directeur","finance"),

    // Cash
    canAddCash:            is("pdg","directeur","finance"),
    canDeleteCash:         is("pdg"),

    // Equipment
    canAddEquipment:       is("pdg","directeur","equipements"),
    canEditEquipmentStatus:is("pdg","directeur","equipements"),
    canDeleteEquipment:    is("pdg"),

    // Advances
    canAddAdvance:         is("pdg","directeur","rh"),
    canDeleteAdvance:      is("pdg"),

    // Attendance
    canAddAttendance:      is("pdg","directeur","rh","chef_equipe"),

    // Users
    canManageUsers:        is("pdg"),

    // Special flags
    isReadOnly:            is("auditeur"),
    scopedToSite:          is("directeur"),
    scopedToTeam:          is("chef_equipe"),
    scopedToTransport:     is("logistique"),

    // Expense categories
    allowedExpenseCategories: is("logistique")
      ? TRANSPORT_CATS
      : is("equipements")
        ? ["Équipement","Matériel"]
        : "all",

    // Shortcuts
    role, siteId: user?.siteId, teamId: user?.teamId,
  };

  return r;
}

/** Returns a "read-only badge" JSX class if user cannot write */
export function useReadOnlyGuard() {
  const { isReadOnly } = useRbac();
  return isReadOnly;
}
