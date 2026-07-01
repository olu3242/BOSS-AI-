import { randomUUID } from "crypto";
import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";

export interface BetaInvite {
  code: string;
  orgId: string;
  createdAt: string;
  usedAt: string | null;
  usedByBusinessId: string | null;
}

export interface BetaInviteService {
  generate(orgId: string): Promise<BetaInvite>;
  validate(code: string): Promise<BetaInvite | null>;
  redeem(code: string, businessId: string): Promise<BetaInvite>;
  list(): Promise<BetaInvite[]>;
  getStats(): Promise<{ total: number; used: number; available: number }>;
}

export function createBetaInviteService(repos: RepositoryContainer): BetaInviteService {
  // In-memory store backed by event_log for persistence
  const invites = new Map<string, BetaInvite>();

  async function loadFromEvents() {
    const generated = await repos.eventLog.listByType("beta.invite.generated", 1000);
    const redeemed = await repos.eventLog.listByType("beta.invite.redeemed", 1000);

    for (const e of generated) {
      const p = e.payload as Record<string, unknown>;
      const code = p["code"] as string;
      if (!invites.has(code)) {
        invites.set(code, {
          code,
          orgId: p["orgId"] as string,
          createdAt: e.occurredAt,
          usedAt: null,
          usedByBusinessId: null,
        });
      }
    }
    for (const e of redeemed) {
      const p = e.payload as Record<string, unknown>;
      const code = p["code"] as string;
      const inv = invites.get(code);
      if (inv) {
        inv.usedAt = e.occurredAt;
        inv.usedByBusinessId = p["businessId"] as string;
      }
    }
  }

  return {
    async generate(orgId) {
      await loadFromEvents();
      const code = `BOSS-${randomUUID().slice(0, 8).toUpperCase()}`;
      const invite: BetaInvite = { code, orgId, createdAt: nowIso(), usedAt: null, usedByBusinessId: null };
      invites.set(code, invite);
      await repos.eventBus.publish({
        type: "beta.invite.generated",
        payload: { code, orgId },
        occurredAt: nowIso(),
      });
      return invite;
    },

    async validate(code) {
      await loadFromEvents();
      const invite = invites.get(code);
      if (!invite || invite.usedAt !== null) return null;
      return invite;
    },

    async redeem(code, businessId) {
      await loadFromEvents();
      const invite = invites.get(code);
      if (!invite) throw new Error(`Invite code ${code} not found`);
      if (invite.usedAt !== null) throw new Error(`Invite code ${code} already used`);
      invite.usedAt = nowIso();
      invite.usedByBusinessId = businessId;
      await repos.eventBus.publish({
        type: "beta.invite.redeemed",
        payload: { code, orgId: invite.orgId, businessId },
        occurredAt: nowIso(),
      });
      return invite;
    },

    async list() {
      await loadFromEvents();
      return [...invites.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getStats() {
      await loadFromEvents();
      const all = [...invites.values()];
      const used = all.filter((i) => i.usedAt !== null).length;
      return { total: all.length, used, available: all.length - used };
    },
  };
}
