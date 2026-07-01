import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "rest_food_cost_playbook",
    label: "Food Cost Reduction Playbook",
    description: "Systematic protocol to bring food cost % back to target through menu engineering, inventory discipline, and waste elimination.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "rest_food_cost_pct > 30%",
    steps: [
      {
        order: 1,
        action: "Run variance report comparing actual food cost % to theoretical (recipe-based) food cost % for the past 4 weeks",
        owner: "rest_kitchen_manager",
        expectedOutcome: "Gap between actual and theoretical identified — indicates over-portioning, waste, or theft",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Audit waste log by category to identify top 5 waste contributors",
        owner: "rest_kitchen_manager",
        expectedOutcome: "Root cause of waste identified — over-ordering, poor prep scheduling, or spoilage",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Adjust purchase orders and par levels to right-size inventory for next 2 weeks",
        owner: "rest_kitchen_manager",
        expectedOutcome: "Inventory aligned to demand; over-purchasing eliminated",
        timelineHours: 1,
      },
      {
        order: 4,
        action: "Conduct spot checks on portion sizes for top-10 highest-cost menu items",
        owner: "rest_general_manager",
        expectedOutcome: "Portion compliance confirmed; coaching delivered where gaps found",
        timelineHours: 2,
      },
      {
        order: 5,
        action: "Review weekly food cost % for 4 consecutive weeks and confirm trend toward target",
        owner: "rest_general_manager",
        expectedOutcome: "Food cost % trending to or below 30%",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["rest_reduce_food_cost", "rest_reduce_waste"],
    estimatedTotalHours: 7,
  },
  {
    key: "rest_labor_optimization_playbook",
    label: "Labor Optimization Playbook",
    description: "Align staffing levels to projected demand to reduce labor cost % without compromising service standards.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "rest_labor_cost_pct > 35%",
    steps: [
      {
        order: 1,
        action: "Pull labor cost by day part for the past 4 weeks and map against covers and revenue",
        owner: "rest_general_manager",
        expectedOutcome: "Overstaffed day parts and shifts identified",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Build demand-based schedule for next 2 weeks using rolling 4-week cover averages",
        owner: "rest_general_manager",
        expectedOutcome: "Labor schedule aligned to forecasted demand; excess shifts cut",
        timelineHours: 3,
      },
      {
        order: 3,
        action: "Cross-train one FOH staff member per shift to cover host and server duties",
        owner: "rest_floor_manager",
        expectedOutcome: "Staffing flexibility improved; headcount reduced by 1 per service",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Monitor daily labor spend against budget and send alert if intraday labor runs over by 10%",
        owner: "rest_general_manager",
        expectedOutcome: "Real-time labor visibility; managers adjust mid-shift when needed",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["rest_reduce_labor_cost"],
    estimatedTotalHours: 10,
  },
  {
    key: "rest_no_show_reduction_playbook",
    label: "No-Show Reduction Playbook",
    description: "Protect reserved covers from no-shows through confirmation sequences, credit card holds, and proactive waitlist management.",
    trigger: "constraint_detected" as const,
    triggerCondition: "rest_high_no_show_rate",
    steps: [
      {
        order: 1,
        action: "Activate 24-hour SMS/email confirmation for all reservations of 4+ guests",
        owner: "rest_reservations_coordinator",
        expectedOutcome: "All large party reservations confirmed or released 24h before service",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Implement credit card hold policy for parties of 6+ and peak weekend slots",
        owner: "rest_general_manager",
        expectedOutcome: "Financial accountability deters no-shows; lost revenue partially recovered via no-show fee",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Build and maintain active waitlist for all peak services to fill released and no-show slots",
        owner: "rest_reservations_coordinator",
        expectedOutcome: "No-show tables reseated within 15 minutes on average",
        timelineHours: 1,
      },
      {
        order: 4,
        action: "Review no-show rate weekly and track by channel (web, phone, third-party)",
        owner: "rest_general_manager",
        expectedOutcome: "Channel with highest no-show rate identified and addressed",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["rest_reduce_no_shows", "rest_fill_reservation_gaps"],
    estimatedTotalHours: 5,
  },
  {
    key: "rest_review_reputation_playbook",
    label: "Review & Reputation Playbook",
    description: "Systematically build the restaurant's online reputation by requesting reviews from satisfied guests and responding to all feedback.",
    trigger: "constraint_detected" as const,
    triggerCondition: "rest_low_review_rating",
    steps: [
      {
        order: 1,
        action: "Respond to all unresponded reviews (positive and negative) on Google, Yelp, and TripAdvisor",
        owner: "rest_guest_experience_coordinator",
        expectedOutcome: "All reviews have a professional, personalized response within 24 hours",
        timelineHours: 3,
      },
      {
        order: 2,
        action: "Train servers to invite satisfied guests to leave a review at checkout",
        owner: "rest_floor_manager",
        expectedOutcome: "Staff confidently asking for reviews; QR code or card available at table",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Send post-visit follow-up to email-opt-in guests with review request link",
        owner: "rest_guest_experience_coordinator",
        expectedOutcome: "Email-captured guests converting to reviews at > 5%",
        timelineHours: 1,
      },
      {
        order: 4,
        action: "Review rating trends monthly and identify service issues mentioned in 2+ negative reviews",
        owner: "rest_general_manager",
        expectedOutcome: "Systemic service failures identified and addressed before they compound",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["rest_improve_reviews"],
    estimatedTotalHours: 6,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
