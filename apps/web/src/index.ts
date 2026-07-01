export * from "./commandCenter.js";
export * from "./demoCommandCenter.js";
export * from "./diagnosticDashboard.js";

if (process.env.BOSS_WEB_DEMO === "1") {
  const { createDemoCommandCenter } = await import("./demoCommandCenter.js");
  const { snapshot } = await createDemoCommandCenter();
  console.log(JSON.stringify(snapshot.summary, null, 2));
}
