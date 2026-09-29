"use client";

import { useAuth } from "@/hooks/use-auth";
import { getPlanConfig, PlanFeatureConfig } from "@/lib/billing/plan-features";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

export function usePlanFeatures() {
  const { account, user, isSuperAdmin } = useAuth();
  const router = useRouter();

  const planConfig: PlanFeatureConfig = useMemo(() => {
    if (isSuperAdmin) {
      return getPlanConfig("enterprise");
    }
    return getPlanConfig((account as any)?.subscription_plan || "essential");
  }, [account, isSuperAdmin]);

  const hasFeature = useCallback(
    (featureKey: keyof PlanFeatureConfig["features"]): boolean => {
      if (isSuperAdmin) return true;
      return Boolean(planConfig.features[featureKey]);
    },
    [planConfig, isSuperAdmin]
  );

  const requireFeature = useCallback(
    (featureKey: keyof PlanFeatureConfig["features"], featureName?: string): boolean => {
      if (hasFeature(featureKey)) return true;

      const name = featureName || featureKey;
      toast.error(`Feature Locked: ${name} requires a plan upgrade`, {
        description: `Your current ${planConfig.name} does not include ${name}. Upgrade your plan to unlock this feature.`,
        action: {
          label: "Upgrade Plan",
          onClick: () => router.push("/billing?upgrade=true"),
        },
      });
      return false;
    },
    [hasFeature, planConfig, router]
  );

  const isLimitReached = useCallback(
    (limitKey: "maxMessages" | "maxContacts" | "maxAgents", currentCount: number): boolean => {
      if (isSuperAdmin) return false;
      const limit = planConfig[limitKey];
      if (limit === -1) return false; // Unlimited
      return currentCount >= limit;
    },
    [planConfig, isSuperAdmin]
  );

  return {
    planConfig,
    hasFeature,
    requireFeature,
    isLimitReached,
    isSuperAdmin,
  };
}
