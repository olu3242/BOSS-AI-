import type { AppointmentService } from "../services/appointmentService.js";

export function createAppointmentController(service: AppointmentService) {
  return {
    list: (orgId: string, businessId: string) => service.listByBusiness(orgId, businessId),
    get: (orgId: string, appointmentId: string) => service.getAppointment(orgId, appointmentId),
    create: (orgId: string, businessId: string, input: Parameters<AppointmentService["createAppointment"]>[2]) =>
      service.createAppointment(orgId, businessId, input),
    update: (orgId: string, appointmentId: string, patch: Parameters<AppointmentService["updateAppointment"]>[2]) =>
      service.updateAppointment(orgId, appointmentId, patch),
    confirm: (orgId: string, appointmentId: string) => service.confirmAppointment(orgId, appointmentId),
    cancel: (orgId: string, appointmentId: string) => service.cancelAppointment(orgId, appointmentId),
    delete: (orgId: string, appointmentId: string) => service.deleteAppointment(orgId, appointmentId),
  };
}
