import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "hcare_people.caregivers_employed",
    label: "How many caregivers do you currently employ?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "hcare_ops.services_provided",
    label: "What care services do you provide?",
    sectionKey: "operations" as const,
    type: "multi_select" as const,
    required: true,
    order: 1,
    options: [
      "Personal care (bathing, dressing)",
      "Companion care",
      "Dementia / Alzheimer's care",
      "Post-surgery recovery",
      "Respite care",
      "Medication reminders",
      "Transportation",
      "Meal preparation",
    ],
  },
  {
    key: "hcare_ops.active_clients",
    label: "How many active clients do you serve?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "hcare_technology.scheduling_method",
    label: "How do you currently handle scheduling?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: true,
    order: 1,
    options: [
      "Dedicated home care software (e.g., ClearCare, WellSky)",
      "General scheduling software (e.g., Google Calendar)",
      "Spreadsheets",
      "Paper-based",
    ],
  },
  {
    key: "hcare_marketing.primary_referral_source",
    label: "What is your primary referral source?",
    sectionKey: "marketing" as const,
    type: "single_select" as const,
    required: true,
    order: 1,
    options: [
      "Hospital discharge planners",
      "Physicians / primary care offices",
      "Skilled nursing facilities",
      "Word of mouth / family referrals",
      "Online / digital marketing",
      "Elder law attorneys / financial advisors",
    ],
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
