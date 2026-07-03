import type { RepositoryContainer } from "../container.js";

export interface BusinessAnalytics {
  revenue: {
    totalCents: number;
    paidCents: number;
    pendingCents: number;
    overdueCount: number;
    monthlyTrend: Array<{ month: string; amountCents: number }>;
  };
  jobs: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    avgDurationMinutes: number | null;
  };
  appointments: {
    total: number;
    upcoming: number;
    noShowRate: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    withOpenInvoices: number;
  };
  reviews: {
    averageRating: number;
    total: number;
    responseRate: number;
  };
  payments: {
    totalReceivedCents: number;
    avgDaysToPay: number | null;
  };
}

export interface AnalyticsService {
  getBusinessAnalytics(orgId: string, businessId: string): Promise<BusinessAnalytics>;
}

export function createAnalyticsService(repos: RepositoryContainer): AnalyticsService {
  return {
    async getBusinessAnalytics(orgId, businessId) {
      const [invoices, jobs, appointments, customers, reviews, payments] = await Promise.all([
        repos.invoices.listByBusiness(orgId, businessId),
        repos.jobs.listByBusiness(orgId, businessId),
        repos.appointments.listByBusiness(orgId, businessId),
        repos.customers.listByBusinessId(orgId, businessId),
        repos.reviews.listByBusiness(orgId, businessId),
        repos.payments.listByBusiness(orgId, businessId),
      ]);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Revenue
      const paidInvoices = invoices.filter((i) => i.status === 'paid');
      const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'viewed');
      const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

      const paidCents = paidInvoices.reduce((s, i) => s + i.totalCents, 0);
      const pendingCents = pendingInvoices.reduce((s, i) => s + i.totalCents, 0);

      // Monthly trend: last 6 months
      const monthlyTrend: Array<{ month: string; amountCents: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const amount = paidInvoices
          .filter((inv) => inv.paidAt && inv.paidAt.startsWith(key))
          .reduce((s, inv) => s + inv.totalCents, 0);
        monthlyTrend.push({ month: key, amountCents: amount });
      }

      // Jobs
      const completedJobs = jobs.filter((j) => j.status === 'completed');
      const inProgressJobs = jobs.filter((j) => j.status === 'in_progress');
      const completionRate = jobs.length > 0 ? completedJobs.length / jobs.length : 0;
      const durationsWithValue = completedJobs.filter((j) => j.actualDurationMinutes != null);
      const avgDurationMinutes = durationsWithValue.length > 0
        ? durationsWithValue.reduce((s, j) => s + (j.actualDurationMinutes ?? 0), 0) / durationsWithValue.length
        : null;

      // Appointments
      const upcoming = appointments.filter((a) => a.startAt > now.toISOString() && a.status !== 'cancelled').length;
      const noShowCount = appointments.filter((a) => a.status === 'no_show').length;
      const noShowRate = appointments.length > 0 ? noShowCount / appointments.length : 0;

      // Customers
      const newThisMonth = customers.filter((c) => c.createdAt >= startOfMonth).length;
      const customerIds = new Set(
        invoices
          .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
          .map((i) => i.customerId)
      );
      const withOpenInvoices = customerIds.size;

      // Reviews
      const publishedReviews = reviews.filter((r) => r.status === 'published');
      const avgRating = publishedReviews.length > 0
        ? publishedReviews.reduce((s, r) => s + r.rating, 0) / publishedReviews.length
        : 0;
      const responseRate = publishedReviews.length > 0
        ? publishedReviews.filter((r) => r.response).length / publishedReviews.length
        : 0;

      // Payments
      const completedPayments = payments.filter((p) => p.status === 'completed');
      const totalReceivedCents = completedPayments.reduce((s, p) => s + p.amountCents, 0);

      // Avg days to pay: from invoice createdAt to paidAt
      const daysToPayList: number[] = [];
      for (const inv of paidInvoices) {
        if (inv.paidAt) {
          const diff = (new Date(inv.paidAt).getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          daysToPayList.push(diff);
        }
      }
      const avgDaysToPay = daysToPayList.length > 0
        ? daysToPayList.reduce((s, d) => s + d, 0) / daysToPayList.length
        : null;

      return {
        revenue: {
          totalCents: paidCents + pendingCents,
          paidCents,
          pendingCents,
          overdueCount: overdueInvoices.length,
          monthlyTrend,
        },
        jobs: {
          total: jobs.length,
          completed: completedJobs.length,
          inProgress: inProgressJobs.length,
          completionRate: Math.round(completionRate * 100) / 100,
          avgDurationMinutes: avgDurationMinutes !== null ? Math.round(avgDurationMinutes) : null,
        },
        appointments: {
          total: appointments.length,
          upcoming,
          noShowRate: Math.round(noShowRate * 100) / 100,
        },
        customers: {
          total: customers.length,
          newThisMonth,
          withOpenInvoices,
        },
        reviews: {
          averageRating: Math.round(avgRating * 10) / 10,
          total: publishedReviews.length,
          responseRate: Math.round(responseRate * 100) / 100,
        },
        payments: {
          totalReceivedCents,
          avgDaysToPay: avgDaysToPay !== null ? Math.round(avgDaysToPay * 10) / 10 : null,
        },
      };
    },
  };
}
