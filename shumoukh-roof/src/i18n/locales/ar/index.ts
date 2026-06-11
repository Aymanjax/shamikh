// دمج كل أقسام القاموس العربي في كائن واحد
import { common } from "./common";
import { auth } from "./auth";
import { dashboard } from "./dashboard";
import { calculator } from "./calculator";
import { projects } from "./projects";
import { invoices } from "./invoices";
import { workers } from "./workers";
import { settings } from "./settings";
import { subscription } from "./subscription";
import { admin } from "./admin";
import { misc } from "./misc";
import { cockpit } from "./cockpit";

export const ar = {
  ...common,
  ...auth,
  ...dashboard,
  ...calculator,
  ...projects,
  ...invoices,
  ...workers,
  ...settings,
  ...subscription,
  ...admin,
  ...misc,
  ...cockpit,
} as const;
