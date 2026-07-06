import type { Appointment, AppointmentStatus } from "@boss/types";
import type { AppointmentPatch } from "@boss/db";
import type { RepositoryContainer } from "../container.js";

export interface AppointmentService {
  createAppointment(orgId: string, businessId: string, input: {
    title: string;
    customerId?: string | null;
    jobId?: string | null;
    startAt: string;
    endAt: string;
    notes?: string | null;
    location?: string | null;
    assignedTo?: string | null;
    status?: AppointmentStatus;
  }): Promise<Appointment>;

  getAppointment(orgId: string, appointmentId: string): Promise<Appointment>;

  updateAppointment(orgId: string, appointmentId: string, patch: AppointmentPatch): Promise<Appointment>;

  confirmAppointment(orgId: string, appointmentId: string): Promise<Appointment>;
  cancelAppointment(orgId: string, appointmentId: string): Promise<Appointment>;
  markNoShow(orgId: string, businessId: string, appointmentId: string): Promise<Appointment>;

  listByBusiness(orgId: string, businessId: string): Promise<Appointment[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Appointment[]>;

  deleteAppointment(orgId: string, appointmentId: string): Promise<void>;
}

export function createAppointmentService(repos: RepositoryContainer): AppointmentService {
  return {
    async createAppointment(orgId, businessId, input) {
      const appt = await repos.appointments.create({
        orgId,
        businessId,
        customerId: input.customerId ?? null,
        jobId: input.jobId ?? null,
        title: input.title,
        notes: input.notes ?? null,
        status: input.status ?? 'scheduled',
        startAt: input.startAt,
        endAt: input.endAt,
        location: input.location ?? null,
        assignedTo: input.assignedTo ?? null,
        reminderSent: false,
        metadata: {},
      });

      await repos.eventBus.publish({
        type: "appointment.created",
        payload: { orgId, businessId, appointmentId: appt.id, startAt: appt.startAt },
        occurredAt: new Date().toISOString(),
      });

      return appt;
    },

    async getAppointment(orgId, appointmentId) {
      const appt = await repos.appointments.findById(orgId, appointmentId);
      if (!appt) throw new Error(`Appointment ${appointmentId} not found`);
      return appt;
    },

    async updateAppointment(orgId, appointmentId, patch) {
      const existing = await repos.appointments.findById(orgId, appointmentId);
      if (!existing) throw new Error(`Appointment ${appointmentId} not found`);
      const previousStatus = existing.status;

      const appt = await repos.appointments.update(orgId, appointmentId, patch);

      if (patch.status && patch.status !== previousStatus) {
        await repos.eventBus.publish({
          type: "appointment.status_changed",
          payload: { orgId, appointmentId, previousStatus, newStatus: patch.status },
          occurredAt: new Date().toISOString(),
        });
      }

      return appt;
    },

    async confirmAppointment(orgId, appointmentId) {
      const appt = await repos.appointments.update(orgId, appointmentId, { status: 'confirmed' as AppointmentStatus });
      await repos.eventBus.publish({
        type: "appointment.confirmed",
        payload: { orgId, appointmentId },
        occurredAt: new Date().toISOString(),
      });
      return appt;
    },

    async cancelAppointment(orgId, appointmentId) {
      const appt = await repos.appointments.update(orgId, appointmentId, { status: 'cancelled' });
      await repos.eventBus.publish({
        type: "appointment.cancelled",
        payload: { orgId, appointmentId },
        occurredAt: new Date().toISOString(),
      });
      return appt;
    },

    async markNoShow(orgId, businessId, appointmentId) {
      const appt = await repos.appointments.update(orgId, appointmentId, { status: 'no_show' as AppointmentStatus });
      await repos.eventBus.publish({
        type: "appointment.no_show",
        payload: { orgId, businessId, appointmentId },
        occurredAt: new Date().toISOString(),
      });
      return appt;
    },

    async listByBusiness(orgId, businessId) {
      return repos.appointments.listByBusiness(orgId, businessId);
    },

    async listByCustomer(orgId, customerId) {
      return repos.appointments.listByCustomer(orgId, customerId);
    },

    async deleteAppointment(orgId, appointmentId) {
      await repos.appointments.softDelete(orgId, appointmentId);
    },
  };
}
