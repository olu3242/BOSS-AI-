# ACTION LIBRARY
> Generated: 2026-07-05 | Reusable atomic actions — every automation composes from these

All actions are registered as task handlers in `TaskHandlerRegistry`.
Every action emits a domain event. Every action is idempotent.
Every action validates at the boundary (Zod schema on input).

---

## Notation
- **Handler Key**: The `taskType` string registered in `TaskHandlerRegistry`
- **Implementation**: Current service that implements it
- **Status**: `active` | `partial` | `missing`

---

## Customer Actions

### ACT-001: CreateCustomer
| Field | Value |
|-------|-------|
| **Handler Key** | `customer.create` |
| **Implementation** | `customerService.create()` |
| **Input** | `{ orgId, businessId, name, email, phone, source }` |
| **Output** | `{ customerId, createdAt }` |
| **Event Emitted** | `customer.created` [ADD] |
| **Status** | partial — service exists, event missing |

### ACT-002: UpdateCustomer
| **Handler Key** | `customer.update` |
| **Implementation** | `customerService.update()` |
| **Event Emitted** | `customer.updated` [ADD] |
| **Status** | partial |

### ACT-003: AddCustomerInteraction
| **Handler Key** | `customer.add_interaction` |
| **Implementation** | `customerService.addInteraction()` |
| **Event Emitted** | `customer.interaction.added` |
| **Status** | active |

### ACT-004: ScoreCustomerHealth
| **Handler Key** | `customer.score_health` |
| **Implementation** | `customerHealthService.score()` |
| **Event Emitted** | `customer.health.updated` |
| **Status** | active |

---

## Job / Work Actions

### ACT-010: CreateJob
| **Handler Key** | `job.create` |
| **Implementation** | `jobService.create()` |
| **Event Emitted** | `job.created` [ADD] |
| **Status** | partial |

### ACT-011: AssignTechnician
| **Handler Key** | `job.assign_technician` |
| **Implementation** | `jobService.assign()` |
| **Event Emitted** | `technician.assigned` [ADD] |
| **Status** | partial |

### ACT-012: CompleteJob
| **Handler Key** | `job.complete` |
| **Implementation** | `jobService.complete()` |
| **Event Emitted** | `job.completed` [ADD] |
| **Status** | partial |

### ACT-013: CreateAppointment
| **Handler Key** | `appointment.create` |
| **Implementation** | `appointmentService.create()` |
| **Event Emitted** | `appointment.created` [ADD] |
| **Status** | partial |

### ACT-014: ConfirmAppointment
| **Handler Key** | `appointment.confirm` |
| **Implementation** | `appointmentService.confirm()` |
| **Event Emitted** | `appointment.confirmed` [ADD] |
| **Status** | partial |

### ACT-015: ScheduleMeeting
| **Handler Key** | `calendar.schedule_meeting` |
| **Implementation** | `googleCalendarAdapter` / `outlookCalendarAdapter` via `toolFabricService` |
| **Event Emitted** | `appointment.created` |
| **Status** | active (via tool fabric) |

---

## Money Actions

### ACT-020: GenerateInvoice
| **Handler Key** | `invoice.generate` |
| **Implementation** | `invoiceService.create()` |
| **Event Emitted** | `invoice.created` [ADD] |
| **Status** | partial |

### ACT-021: SendInvoice
| **Handler Key** | `invoice.send` |
| **Implementation** | `invoiceService.send()` + `notificationService.send()` [H-1] |
| **Event Emitted** | `invoice.sent` [ADD] |
| **Status** | partial |

### ACT-022: MarkInvoicePaid
| **Handler Key** | `invoice.mark_paid` |
| **Implementation** | `invoiceService.markPaid()` |
| **Event Emitted** | `invoice.paid` [ADD] |
| **Status** | partial |

### ACT-023: RecordPayment
| **Handler Key** | `payment.record` |
| **Implementation** | `paymentService.create()` |
| **Event Emitted** | `payment.received` [ADD] |
| **Status** | partial |

### ACT-024: UpdateKPI
| **Handler Key** | `kpi.update` |
| **Implementation** | `kpiMeasurementService.measure()` |
| **Event Emitted** | `kpi.updated` |
| **Status** | active |

---

## Communication Actions

### ACT-030: SendSMS
| **Handler Key** | `notification.send_sms` |
| **Implementation** | `notificationService.send({ channel: "sms" })` [H-1 CREATE] |
| **Event Emitted** | `notification.sent` |
| **Status** | missing (currently direct adapter call) |

### ACT-031: SendEmail
| **Handler Key** | `notification.send_email` |
| **Implementation** | `notificationService.send({ channel: "email" })` [H-1 CREATE] |
| **Event Emitted** | `notification.sent` |
| **Status** | missing (currently direct adapter call) |

### ACT-032: SendSlackMessage
| **Handler Key** | `notification.send_slack` |
| **Implementation** | `notificationService.send({ channel: "slack" })` [H-1 CREATE] |
| **Event Emitted** | `notification.sent` |
| **Status** | missing |

### ACT-033: CreateNotification
| **Handler Key** | `notification.create` |
| **Implementation** | `notificationService.create()` [H-1 CREATE] |
| **Event Emitted** | `notification.sent` |
| **Status** | missing |

---

## Intelligence Actions

### ACT-040: RunAIAnalysis
| **Handler Key** | `ai.analyze` |
| **Implementation** | `aiWorkforceService.run()` + MCP inference |
| **Event Emitted** | `agent.completed` |
| **Status** | active |

### ACT-041: GenerateRecommendation
| **Handler Key** | `intelligence.generate_recommendation` |
| **Implementation** | `businessRecommendationService.generate()` |
| **Event Emitted** | `recommendation.generated` |
| **Status** | active |

### ACT-042: RunKPIMeasurement
| **Handler Key** | `intelligence.measure_kpis` |
| **Implementation** | `kpiMeasurementService.measure()` |
| **Event Emitted** | `kpi.updated` |
| **Status** | active |

### ACT-043: GenerateBriefing
| **Handler Key** | `intelligence.generate_briefing` |
| **Implementation** | `executiveBriefingService.generate()` |
| **Event Emitted** | `briefing.generated` |
| **Status** | active |

### ACT-044: RunDiagnostic
| **Handler Key** | `intelligence.run_diagnostic` |
| **Implementation** | `businessDiagnosticService.run()` |
| **Event Emitted** | `business.diagnostic.completed` |
| **Status** | active |

---

## Decision Actions

### ACT-050: CreateDecision
| **Handler Key** | `decision.create` |
| **Implementation** | `businessDecisionService.create()` |
| **Event Emitted** | `decision.created` |
| **Status** | active |

### ACT-051: Escalate
| **Handler Key** | `decision.escalate` |
| **Implementation** | `notificationService.send()` + `businessDecisionService.escalate()` |
| **Event Emitted** | `decision.escalated` |
| **Status** | partial |

### ACT-052: RequestApproval
| **Handler Key** | `approval.request` |
| **Implementation** | WorkflowRuntime approval gate + `notificationService.send()` |
| **Event Emitted** | `approval.requested` |
| **Status** | partial |

### ACT-053: TriggerWorkflow
| **Handler Key** | `workflow.trigger` |
| **Implementation** | `WorkflowRuntime.execute()` |
| **Event Emitted** | `workflow.started` |
| **Status** | active |

---

## Growth Actions

### ACT-060: CreateLead
| **Handler Key** | `lead.create` |
| **Implementation** | `leadService.create()` [H-8 CREATE] |
| **Event Emitted** | `lead.created` |
| **Status** | missing |

### ACT-061: QualifyLead
| **Handler Key** | `lead.qualify` |
| **Implementation** | `leadService.qualify()` [H-8 CREATE] |
| **Event Emitted** | `lead.qualified` |
| **Status** | missing |

### ACT-062: AssignOwner
| **Handler Key** | `lead.assign_owner` |
| **Implementation** | `leadService.assign()` [H-8 CREATE] |
| **Event Emitted** | `lead.assigned` |
| **Status** | missing |

---

## Platform Actions

### ACT-070: StoreDocument
| **Handler Key** | `document.store` |
| **Implementation** | Supabase Storage via tool fabric |
| **Event Emitted** | `document.uploaded` |
| **Status** | partial (tool fabric route, no dedicated service) |

### ACT-071: ArchiveRecord
| **Handler Key** | `record.archive` |
| **Implementation** | Generic soft-delete via repository |
| **Event Emitted** | `{entity}.archived` |
| **Status** | partial |

### ACT-072: PublishDashboard
| **Handler Key** | `dashboard.publish` |
| **Implementation** | `missionControlService.project()` |
| **Event Emitted** | `dashboard.updated` |
| **Status** | active |

### ACT-073: SyncToProvider
| **Handler Key** | `provider.sync` |
| **Implementation** | `toolFabricService.requestTool()` → provider adapter |
| **Event Emitted** | `tool.execution.succeeded` |
| **Status** | active |

---

## Action Status Summary

| Status | Count |
|--------|-------|
| active | 18 |
| partial | 16 |
| missing | 7 |

**Missing actions all depend on H-1 (notificationService) and H-8 (leadService)**
