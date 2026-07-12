"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/lib/types";

const STORAGE_KEY = "venture-connect-demo-plan";

export function useDemoPlan(defaultPlan: SubscriptionPlan = "Free") {
  const [plan, setPlanState] = useState<SubscriptionPlan>(defaultPlan);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as SubscriptionPlan | null;
    if (stored === "Free" || stored === "Student Pro" || stored === "Founder Pro") {
      setPlanState(stored);
    }
  }, []);

  function setPlan(nextPlan: SubscriptionPlan) {
    setPlanState(nextPlan);
    window.localStorage.setItem(STORAGE_KEY, nextPlan);
  }

  return [plan, setPlan] as const;
}
