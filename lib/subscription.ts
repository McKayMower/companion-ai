import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();

  if (!userId) return false;

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: userId,
    },
    select: {
      stipeCurrentPeriodEnd: true,
      stipeCustomerId: true,
      stipePriceId: true,
      stipeSubscriptionId: true,
    },
  });

  // user not subbed
  if (!userSubscription) return false;

  const isValid =
    userSubscription.stipePriceId &&
    userSubscription.stipeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  return !!isValid; //ensures isValid is always a boolean
};
