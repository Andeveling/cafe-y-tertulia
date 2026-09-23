import { cache } from "react";
import { getMemberBadges } from "@/app/profile/_lib/gamification-actions";

/** Dedup por request: hero y vitrina comparten el mismo fetch (server-cache-react). */
export const getCachedMemberBadges = cache(getMemberBadges);
