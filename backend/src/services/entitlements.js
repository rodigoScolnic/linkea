const TALENT_FEATURES = [
  "featured_profile",
  "profile_analytics",
  "profile_visitors",
  "expanded_portfolio",
  "advanced_discovery_filters",
  "availability_calendar",
  "received_likes",
  "initiate_institution_chats"
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
  const isTalent = user.accountType === "TALENT";
  const expectedPlan = isTalent ? "TALENT_PREMIUM" : "INSTITUTION_PREMIUM";
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const periodIsValid = periodEnd instanceof Date
    && !Number.isNaN(periodEnd.getTime())
    && periodEnd > now;

  const statusAllowsAccess = subscription && (
    ACCESS_STATUSES.has(subscription.status)
    || (subscription.status === "CANCELED" && subscription.cancelAtPeriodEnd === true)
  );

  const isPremium = Boolean(
    statusAllowsAccess
    && periodIsValid
    && subscription.plan === expectedPlan
  );

  const availableFeatures = isTalent ? TALENT_FEATURES : INSTITUTION_FEATURES;

  return {
    accountType: user.accountType,
    plan: isPremium ? expectedPlan : "FREE",
    isPremium,
    status: isPremium ? subscription.status : "FREE",
    currentPeriodEnd: isPremium ? periodEnd : null,
    cancelAtPeriodEnd: isPremium && subscription.cancelAtPeriodEnd === true,
    limits: isTalent
      ? {
          dailyLikes: isPremium ? 20 : 5,
          simultaneousApplications: isPremium ? 10 : 2,
          photos: isPremium ? 10 : 2,
          videos: isPremium ? 5 : 1,
          canSeeReceivedLikes: isPremium,
          canInitiateInstitutionChats: isPremium
        }
      : null,
    features: Object.fromEntries(
      availableFeatures.map((feature) => [
        feature,
        isPremium || (isTalent && feature !== "received_likes" && feature !== "initiate_institution_chats")
      ])
    )
  };
}

export function hasFeature(entitlements, feature) {
  return entitlements?.features?.[feature] === true;
}
