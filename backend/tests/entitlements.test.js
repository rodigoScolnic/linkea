import test from "node:test";
import assert from "node:assert/strict";
import { buildEntitlements, hasFeature } from "../src/services/entitlements.js";

const now = new Date("2026-11-27T12:00:00.000Z");
const talent = { accountType: "TALENT" };
const institution = { accountType: "INSTITUTION" };
const activeTalent = {
  plan: "TALENT_PREMIUM",
  status: "ACTIVE",
  currentPeriodEnd: new Date("2026-12-27T12:00:00.000Z"),
  cancelAtPeriodEnd: false
};

test("grants talent features to a valid talent subscription", () => {
  const result = buildEntitlements(talent, activeTalent, now);
  assert.equal(result.isPremium, true);
  assert.equal(result.plan, "TALENT_PREMIUM");
  assert.equal(hasFeature(result, "featured_profile"), true);
  assert.equal(hasFeature(result, "team_members"), false);
});

test("grants institution features only to an institution plan", () => {
  const result = buildEntitlements(institution, {
    ...activeTalent,
    plan: "INSTITUTION_PREMIUM"
  }, now);
  assert.equal(result.isPremium, true);
  assert.equal(hasFeature(result, "advanced_talent_filters"), true);
  assert.equal(hasFeature(result, "featured_profile"), false);
});

test("does not grant access when the billing period is missing or expired", () => {
  assert.equal(buildEntitlements(talent, { ...activeTalent, currentPeriodEnd: null }, now).isPremium, false);
  assert.equal(buildEntitlements(talent, { ...activeTalent, currentPeriodEnd: new Date("2026-11-27T11:59:59.000Z") }, now).isPremium, false);
});

test("keeps access until period end for a scheduled cancellation", () => {
  const result = buildEntitlements(talent, {
    ...activeTalent,
    status: "CANCELED",
    cancelAtPeriodEnd: true
  }, now);
  assert.equal(result.isPremium, true);
  assert.equal(result.cancelAtPeriodEnd, true);
});

test("does not grant access for past-due, immediate cancellation, or wrong plan", () => {
  assert.equal(buildEntitlements(talent, { ...activeTalent, status: "PAST_DUE" }, now).isPremium, false);
  assert.equal(buildEntitlements(talent, { ...activeTalent, status: "CANCELED", cancelAtPeriodEnd: false }, now).isPremium, false);
  assert.equal(buildEntitlements(talent, { ...activeTalent, plan: "INSTITUTION_PREMIUM" }, now).isPremium, false);
});

test("exposes the requested free talent limits and disables premium-only actions", () => {
  const result = buildEntitlements(talent, null, now);
  assert.deepEqual(result.limits, {
    dailyLikes: 5,
    simultaneousApplications: 2,
    photos: 2,
    videos: 1,
    canSeeReceivedLikes: false,
    canInitiateInstitutionChats: false
  });
  assert.equal(hasFeature(result, "received_likes"), false);
  assert.equal(hasFeature(result, "initiate_institution_chats"), false);
});

test("exposes the requested talent premium limits and enables premium-only actions", () => {
  const result = buildEntitlements(talent, activeTalent, now);
  assert.deepEqual(result.limits, {
    dailyLikes: 20,
    simultaneousApplications: 10,
    photos: 10,
    videos: 5,
    canSeeReceivedLikes: true,
    canInitiateInstitutionChats: true
  });
  assert.equal(hasFeature(result, "received_likes"), true);
  assert.equal(hasFeature(result, "initiate_institution_chats"), true);
});

test("does not apply talent limits to institution accounts", () => {
  const result = buildEntitlements(institution, null, now);
  assert.equal(result.limits, null);
});
