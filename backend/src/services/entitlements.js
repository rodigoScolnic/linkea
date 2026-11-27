const TALENT_FEATURES = [
  "featured_profile",
  "profile_analytics",
  "profile_visitors",
  "expanded_portfolio",
  "advanced_discovery_filters",
  "availability_calendar"
];

const INSTITUTION_FEATURES = [
  "advanced_talent_filters",
  "talent_lists",
  "casting_management",
  "team_members",
  "priority_discovery"
];

const ACCESS_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export function buildEntitlements(user, subscription, now = new Date()) {
  const expectedPlan = user.accountType === "TALENT"
    ? "TALENT_PREMIUM"
    : "INSTITUTION_PREMIUM";

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const periodIsValid = periodEnd instanceof Date
    && !Number.isNaN(periodEnd.getTime())
    && periodEnd > now;

  // A cancellation scheduled for period end keeps access until that date.
  // PAST_DUE and immediate cancellations do not grant Premium access.
  const statusAllowsAccess = subscription && (
    ACCESS_STATUSES.has(subscription.status)
    || (subscription.status === "CANCELED" && subscription.cancelAtPeriodEnd === true)
  );

  const isPremium = Boolean(
    statusAllowsAccess
    && periodIsValid
    && subscription.plan === expectedPlan
  );

  const availableFeatures = user.accountType === "TALENT"
    ? TALENT_FEATURES
    : INSTITUTION_FEATURES;

  return {
    accountType: user.accountType,
    plan: isPremium ? expectedPlan : "FREE",
    isPremium,
    status: isPremium ? subscription.status : "FREE",
    currentPeriodEnd: isPremium ? periodEnd : null,
    cancelAtPeriodEnd: isPremium && subscription.cancelAtPeriodEnd === true,
    features: Object.fromEntries(
      availableFeatures.map((feature) => [feature, isPremium])
    )
  };
}

export function hasFeature(entitlements, feature) {
  return entitlements?.features?.[feature] === true;
}
