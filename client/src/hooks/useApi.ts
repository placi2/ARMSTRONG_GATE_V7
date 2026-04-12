import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: any
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Une erreur est survenue');
          return { success: false, error: data.error };
        }

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur réseau';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { request, loading, error };
};

// Hooks spécifiques pour chaque ressource

export const useSites = () => {
  const { request, loading, error } = useApi();

  return {
    getSites: () => request('sites.php', 'GET'),
    getSite: (id: number) => request(`sites.php/${id}`, 'GET'),
    createSite: (data: any) => request('sites.php', 'POST', data),
    updateSite: (id: number, data: any) => request(`sites.php/${id}`, 'PUT', data),
    deleteSite: (id: number) => request(`sites.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useTeams = () => {
  const { request, loading, error } = useApi();

  return {
    getTeams: () => request('teams.php', 'GET'),
    getTeam: (id: number) => request(`teams.php/${id}`, 'GET'),
    createTeam: (data: any) => request('teams.php', 'POST', data),
    updateTeam: (id: number, data: any) => request(`teams.php/${id}`, 'PUT', data),
    deleteTeam: (id: number) => request(`teams.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useEmployees = () => {
  const { request, loading, error } = useApi();

  return {
    getEmployees: () => request('employees.php', 'GET'),
    getEmployee: (id: number) => request(`employees.php/${id}`, 'GET'),
    createEmployee: (data: any) => request('employees.php', 'POST', data),
    updateEmployee: (id: number, data: any) => request(`employees.php/${id}`, 'PUT', data),
    deleteEmployee: (id: number) => request(`employees.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useProductions = () => {
  const { request, loading, error } = useApi();

  return {
    getProductions: () => request('productions.php', 'GET'),
    getProduction: (id: number) => request(`productions.php/${id}`, 'GET'),
    createProduction: (data: any) => request('productions.php', 'POST', data),
    updateProduction: (id: number, data: any) => request(`productions.php/${id}`, 'PUT', data),
    deleteProduction: (id: number) => request(`productions.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useExpenses = () => {
  const { request, loading, error } = useApi();

  return {
    getExpenses: () => request('expenses.php', 'GET'),
    getExpense: (id: number) => request(`expenses.php/${id}`, 'GET'),
    createExpense: (data: any) => request('expenses.php', 'POST', data),
    updateExpense: (id: number, data: any) => request(`expenses.php/${id}`, 'PUT', data),
    deleteExpense: (id: number) => request(`expenses.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useAdvances = () => {
  const { request, loading, error } = useApi();

  return {
    getAdvances: () => request('advances.php', 'GET'),
    getAdvance: (id: number) => request(`advances.php/${id}`, 'GET'),
    createAdvance: (data: any) => request('advances.php', 'POST', data),
    updateAdvance: (id: number, data: any) => request(`advances.php/${id}`, 'PUT', data),
    deleteAdvance: (id: number) => request(`advances.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useCash = () => {
  const { request, loading, error } = useApi();

  return {
    getCashMovements: () => request('cash.php', 'GET'),
    getCashMovement: (id: number) => request(`cash.php/${id}`, 'GET'),
    getCashSummary: () => request('cash.php/summary', 'GET'),
    createCashMovement: (data: any) => request('cash.php', 'POST', data),
    updateCashMovement: (id: number, data: any) => request(`cash.php/${id}`, 'PUT', data),
    deleteCashMovement: (id: number) => request(`cash.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};

export const useInvoices = () => {
  const { request, loading, error } = useApi();

  return {
    getInvoices: () => request('invoices.php', 'GET'),
    getInvoice: (id: number) => request(`invoices.php/${id}`, 'GET'),
    createInvoice: (data: any) => request('invoices.php', 'POST', data),
    updateInvoice: (id: number, data: any) => request(`invoices.php/${id}`, 'PUT', data),
    deleteInvoice: (id: number) => request(`invoices.php/${id}`, 'DELETE'),
    addPayment: (id: number, data: any) => request(`invoices.php/${id}/payment`, 'POST', data),
    deletePayment: (id: number, paymentId: number) => request(`invoices.php/${id}/payment/${paymentId}`, 'DELETE'),
    loading,
    error,
  };
};

export const useSettings = () => {
  const { request, loading, error } = useApi();

  return {
    getSettings: () => request('settings.php', 'GET'),
    getSetting: (key: string) => request(`settings.php/${key}`, 'GET'),
    updateSetting: (key: string, data: any) => request(`settings.php/${key}`, 'PUT', data),
    loading,
    error,
  };
};

export const useAuth = () => {
  const { request, loading, error } = useApi();

  return {
    login: (email: string, password: string) => request('auth.php/login', 'POST', { email, password }),
    logout: () => request('auth.php/logout', 'POST'),
    getCurrentUser: () => request('auth.php/me', 'GET'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('auth.php/change-password', 'PUT', { current_password: currentPassword, new_password: newPassword }),
    loading,
    error,
  };
};

export const useUsers = () => {
  const { request, loading, error } = useApi();

  return {
    getUsers: () => request('users.php', 'GET'),
    getUser: (id: number) => request(`users.php/${id}`, 'GET'),
    createUser: (data: any) => request('users.php', 'POST', data),
    updateUser: (id: number, data: any) => request(`users.php/${id}`, 'PUT', data),
    deleteUser: (id: number) => request(`users.php/${id}`, 'DELETE'),
    loading,
    error,
  };
};
