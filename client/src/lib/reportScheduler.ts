/**
 * Service de Planification des Rapports Hebdomadaires
 * Gère l'envoi automatique des rapports de caisse par email
 */

export interface ReportScheduleConfig {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hour: number; // 0-23
  minute: number; // 0-59
  recipients: string[];
  formats: ("pdf" | "csv" | "html")[];
  timezone: string;
}

export interface ScheduledReport {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  status: "scheduled" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
  recipients: string[];
}

// Default configuration
export const DEFAULT_SCHEDULE: ReportScheduleConfig = {
  enabled: true,
  dayOfWeek: 1, // Monday
  hour: 8, // 08:00
  minute: 0,
  recipients: ["manager@armstrong-gate.com", "finance@armstrong-gate.com"],
  formats: ["pdf", "csv"],
  timezone: "Africa/Kinshasa",
};

// Store scheduled reports in localStorage
const STORAGE_KEY = "armstrong_gate_report_schedule";
const REPORTS_KEY = "armstrong_gate_scheduled_reports";

export function getScheduleConfig(): ReportScheduleConfig {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_SCHEDULE;
}

export function saveScheduleConfig(config: ReportScheduleConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getScheduledReports(): ScheduledReport[] {
  const stored = localStorage.getItem(REPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveScheduledReport(report: ScheduledReport): void {
  const reports = getScheduledReports();
  const index = reports.findIndex((r) => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

/**
 * Calcule la prochaine date d'envoi du rapport
 */
export function getNextReportDate(config: ReportScheduleConfig): Date {
  const now = new Date();
  const nextDate = new Date(now);

  // Set to the configured day of week
  const currentDay = nextDate.getDay();
  const daysUntilTarget = (config.dayOfWeek - currentDay + 7) % 7;

  if (daysUntilTarget === 0 && nextDate.getHours() >= config.hour) {
    // If today is the target day and time has passed, schedule for next week
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (daysUntilTarget > 0) {
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  }

  nextDate.setHours(config.hour, config.minute, 0, 0);
  return nextDate;
}

/**
 * Formate un rapport pour l'email
 */
export function formatReportForEmail(
  weekStart: Date,
  weekEnd: Date,
  totalBalance: number,
  sitesData: Array<{
    siteName: string;
    closingBalance: number;
    income: number;
    expenses: number;
  }>
): string {
  return `
RAPPORT HEBDOMADAIRE DE CAISSE - ARMSTRONG GATE

Période: ${weekStart.toLocaleDateString("fr-FR")} au ${weekEnd.toLocaleDateString("fr-FR")}

RÉSUMÉ GLOBAL
=============
Solde Total: ${totalBalance.toLocaleString()} EUR

DÉTAILS PAR SITE
================
${sitesData
  .map(
    (site) => `
${site.siteName}
  Solde Clôture: ${site.closingBalance.toLocaleString()} EUR
  Entrées: +${site.income.toLocaleString()} EUR
  Sorties: -${site.expenses.toLocaleString()} EUR
`
  )
  .join("")}

---
Rapport généré automatiquement par ARMSTRONG GATE
${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
  `;
}

/**
 * Simule l'envoi d'un email (en production, cela appellerait une API backend)
 */
export async function sendReportEmail(
  recipients: string[],
  subject: string,
  content: string,
  attachments?: { filename: string; content: string }[]
): Promise<boolean> {
  try {
    console.log("📧 Envoi du rapport par email");
    console.log("Destinataires:", recipients);
    console.log("Sujet:", subject);
    console.log("Pièces jointes:", attachments?.map((a) => a.filename));

    // Simulation d'envoi (en production, appeler une API backend)
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ recipients, subject, content, attachments })
    // });

    // Pour la démo, simuler un succès
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("✅ Email envoyé avec succès");
        resolve(true);
      }, 1000);
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    return false;
  }
}

/**
 * Initialise le planificateur de rapports
 */
export function initializeReportScheduler(): void {
  const config = getScheduleConfig();

  if (!config.enabled) {
    console.log("📊 Planificateur de rapports désactivé");
    return;
  }

  console.log("📊 Planificateur de rapports initialisé");
  console.log(`   Jour: ${["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][config.dayOfWeek]}`);
  console.log(`   Heure: ${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")}`);
  console.log(`   Destinataires: ${config.recipients.join(", ")}`);

  const nextDate = getNextReportDate(config);
  console.log(`   Prochain rapport: ${nextDate.toLocaleDateString("fr-FR")} à ${nextDate.toLocaleTimeString("fr-FR")}`);

  // En production, implémenter une vraie planification avec une API backend
  // ou utiliser une librairie comme node-cron côté serveur
}

/**
 * Formate une date au format ISO pour la semaine
 */
export function getWeekIdentifier(date: Date): string {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split("T")[0];
}

/**
 * Obtient le début de la semaine (lundi)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Obtient la fin de la semaine (dimanche)
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}
