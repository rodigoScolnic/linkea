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

export function buildEntitlements(user, subscription, now = new Date()) {
  const expectedPlan = user.accountType === "TALENT"
    ? "TALENT_PREMIUM"
    : "INSTITUTION_PREMIUM";
  const validStatus = subscription
    && ["ACTIVE", "TRIALING"].includes(subscription.status)
    && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > now);
  const isPremium = Boolean(validStatus && subscription.plan === expectedPlan);
  const availableFeatures = user.accountType === "TALENT"
    ? TALENT_FEATURES
    : INSTITUTION_FEATURES;

  return {
    accountType: user.accountType,
    plan: isPremium ? expectedPlan : "FREE",
    isPremium,
    status: isPremium ? subscription.status : "FREE",
    currentPeriodEnd: isPremium ? subscription.currentPeriodEnd : null,
    cancelAtPeriodEnd: isPremium ? subscription.cancelAtPeriodEnd : false,
    features: Object.fromEntries(
      availableFeatures.map((feature) => [feature, isPremium])
    )
  };
}

export function hasFeature(entitlements, feature) {
  return entitlements?.features?.[feature] === true;
}
