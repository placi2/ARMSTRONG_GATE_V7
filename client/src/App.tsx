import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AuditProvider } from "./contexts/AuditContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { DataProvider } from "./contexts/DataContext";
import { LogoProvider } from "./contexts/LogoContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import SiteProfile from "./pages/SiteProfile";
import Teams from "./pages/Teams";
import TeamProfile from "./pages/TeamProfile";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import Production from "./pages/Production";
import Expenses from "./pages/Expenses";
import Cash from "./pages/Cash";
import SiteCash from "./pages/SiteCash";
import Equipment from "./pages/Equipment";
import Financial from "./pages/Financial";
import TransactionHistory from "./pages/TransactionHistory";
import Comparison from "./pages/Comparison";
import PerformanceComparison from "./pages/PerformanceComparison";
import WeeklyReports from "./pages/WeeklyReports";
import CustomReports from "./pages/CustomReports";
import Settings from "./pages/Settings";
import AuditHistory from "./pages/AuditHistory";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/"                       component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/sites"                  component={() => <ProtectedRoute><Sites /></ProtectedRoute>} />
      <Route path="/site/:id"               component={() => <ProtectedRoute><SiteProfile /></ProtectedRoute>} />
      <Route path="/teams"                  component={() => <ProtectedRoute><Teams /></ProtectedRoute>} />
      <Route path="/team/:id"               component={() => <ProtectedRoute><TeamProfile /></ProtectedRoute>} />
      <Route path="/employees"              component={() => <ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/employee/:id"           component={() => <ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
      <Route path="/production"             component={() => <ProtectedRoute><Production /></ProtectedRoute>} />
      <Route path="/expenses"               component={() => <ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/cash"                   component={() => <ProtectedRoute><Cash /></ProtectedRoute>} />
      <Route path="/site-cash"              component={() => <ProtectedRoute><SiteCash /></ProtectedRoute>} />
      <Route path="/equipment"              component={() => <ProtectedRoute><Equipment /></ProtectedRoute>} />
      <Route path="/financial"              component={() => <ProtectedRoute><Financial /></ProtectedRoute>} />
      <Route path="/transaction-history"    component={() => <ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
      <Route path="/comparison"             component={() => <ProtectedRoute><Comparison /></ProtectedRoute>} />
      <Route path="/performance-comparison" component={() => <ProtectedRoute><PerformanceComparison /></ProtectedRoute>} />
      <Route path="/weekly-reports"         component={() => <ProtectedRoute><WeeklyReports /></ProtectedRoute>} />
      <Route path="/custom-reports"         component={() => <ProtectedRoute><CustomReports /></ProtectedRoute>} />
      <Route path="/settings"               component={() => <ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/audit"                  component={() => <ProtectedRoute><AuditHistory /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuditProvider>
          <SettingsProvider>
            <ThemeProvider>
              <LogoProvider>
                <DataProvider>
                  <TooltipProvider>
                    <Router />
                    <Toaster richColors position="top-right" />
                  </TooltipProvider>
                </DataProvider>
              </LogoProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuditProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
