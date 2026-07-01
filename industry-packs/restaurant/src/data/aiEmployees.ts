import { aiEmployeeRegistry } from "@boss/registries";

const aiEmployees = [
  {
    key: "rest_general_manager",
    label: "General Manager",
    mission: "Own overall restaurant performance: profitability, team, guest experience, and compliance.",
    responsibilities: [
      "Review prime cost % weekly and set corrective action targets",
      "Monitor daily revenue and covers against budget",
      "Manage labor scheduling to demand forecast",
      "Lead pre-shift meetings and hold team accountable to standards",
    ],
    capabilities: [
      "Prime cost analysis",
      "Revenue and covers reporting",
      "Labor schedule optimization",
      "Operational performance monitoring",
    ],
    requiredTools: ["pos_dashboard", "labor_scheduler", "cost_reporter"],
    kpis: ["rest_prime_cost_pct", "rest_food_cost_pct", "rest_labor_cost_pct", "rest_revpash"],
    permissions: ["read:financials", "read:schedule", "write:alerts"],
    escalationRules: ["Escalate to owner if prime cost % exceeds 65% for two consecutive weeks"],
    lifecycle: "available" as const,
  },
  {
    key: "rest_kitchen_manager",
    label: "Kitchen Manager",
    mission: "Control food cost, maintain food quality, and run a safe and efficient back-of-house operation.",
    responsibilities: [
      "Track food cost % daily and weekly against target",
      "Oversee daily waste log and root-cause analysis",
      "Manage inventory ordering and par levels",
      "Enforce recipe standards and portion control",
    ],
    capabilities: [
      "Food cost tracking",
      "Waste analysis",
      "Inventory ordering",
      "Recipe and portion control",
    ],
    requiredTools: ["inventory_system", "waste_log", "cost_calculator"],
    kpis: ["rest_food_cost_pct", "rest_waste_pct", "rest_prime_cost_pct"],
    permissions: ["read:inventory", "write:orders", "write:waste_log"],
    escalationRules: ["Escalate if food cost % exceeds 33% for three consecutive days"],
    lifecycle: "available" as const,
  },
  {
    key: "rest_floor_manager",
    label: "Floor Manager",
    mission: "Deliver an exceptional guest experience, maximize table turns, and drive revenue through upsell excellence.",
    responsibilities: [
      "Manage seating, waitlist, and table assignment during service",
      "Coach FOH team on upsell techniques and service standards",
      "Monitor ticket times and escalate kitchen delays",
      "Handle guest complaints and service recovery",
    ],
    capabilities: [
      "Table management",
      "Guest experience optimization",
      "Upsell coaching",
      "Service recovery",
    ],
    requiredTools: ["table_management_system", "pos_dashboard", "reservation_system"],
    kpis: ["rest_table_turn_rate", "rest_avg_check_size", "rest_revpash"],
    permissions: ["read:reservations", "write:table_assignments", "write:comps"],
    escalationRules: ["Escalate table wait times exceeding 20 minutes to General Manager"],
    lifecycle: "available" as const,
  },
  {
    key: "rest_reservations_coordinator",
    label: "Reservations Coordinator",
    mission: "Maximize dining room occupancy by managing reservations, minimizing no-shows, and filling cancellations.",
    responsibilities: [
      "Accept and confirm reservations across all channels",
      "Send 24-hour confirmation and reminder messages",
      "Manage cancellation waitlist to fill open slots",
      "Track no-show rate and implement holds policy",
    ],
    capabilities: [
      "Reservation management",
      "No-show reduction",
      "Waitlist management",
      "Channel coordination",
    ],
    requiredTools: ["reservation_system", "sms_email_sender"],
    kpis: ["rest_reservation_fill_rate", "rest_no_show_rate"],
    permissions: ["write:reservations", "write:outreach"],
    escalationRules: ["Escalate large party (8+) no-shows to Floor Manager immediately"],
    lifecycle: "available" as const,
  },
  {
    key: "rest_revenue_manager",
    label: "Revenue Manager",
    mission: "Optimize revenue across dining room, bar, private events, and delivery channels to maximize RevPASH.",
    responsibilities: [
      "Analyze RevPASH by service period and day part",
      "Identify low-demand periods and create promotional strategies",
      "Monitor average check size trends",
      "Coordinate happy hour, prix fixe, and event revenue",
    ],
    capabilities: [
      "RevPASH analysis",
      "Revenue mix optimization",
      "Promotional strategy",
      "Demand forecasting",
    ],
    requiredTools: ["pos_dashboard", "revenue_analyzer", "report_generator"],
    kpis: ["rest_revpash", "rest_avg_check_size", "rest_reservation_fill_rate"],
    permissions: ["read:financials", "write:promotions"],
    escalationRules: ["Escalate RevPASH below $10/seat/hour to General Manager"],
    lifecycle: "available" as const,
  },
  {
    key: "rest_guest_experience_coordinator",
    label: "Guest Experience Coordinator",
    mission: "Build long-term guest loyalty through proactive reputation management, feedback collection, and VIP recognition.",
    responsibilities: [
      "Monitor and respond to all online reviews within 24 hours",
      "Track guest satisfaction signals and identify patterns",
      "Manage VIP guest recognition and preferences",
      "Execute post-visit follow-up and review request campaigns",
    ],
    capabilities: [
      "Review monitoring and response",
      "Guest sentiment analysis",
      "VIP management",
      "Reputation building",
    ],
    requiredTools: ["review_platform", "guest_crm", "sms_email_sender"],
    kpis: ["rest_online_review_rating"],
    permissions: ["read:guest_profiles", "write:outreach", "write:review_responses"],
    escalationRules: ["Escalate 1-star reviews mentioning health or safety to General Manager within 1 hour"],
    lifecycle: "available" as const,
  },
];

export function seedAiEmployees(): void {
  for (const employee of aiEmployees) {
    aiEmployeeRegistry.register(employee);
  }
}
