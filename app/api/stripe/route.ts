import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

const settingsUrl = absoluteUrl("/settings");

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    const user = await currentUser();

    if (!userId || !user)
      return new NextResponse("Unauthorized", { status: 401 });

    const userSubscription = await prismadb.userSubscription.findUnique({
      where: {
        userId: userId,
      },
    });

    // user has a subscription, so send to the billing/account page
    if (userSubscription && userSubscription.stipeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stipeCustomerId,
        return_url: settingsUrl,
      });
      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }

    // first time subbing, checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      // sub tiers
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Companion PRO",
              description: "Create custome AI companions!",
            },
            // price
            unit_amount: 999, // 9.99 dollars
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId, // important, user can sub and the webhook returns with their user id so you know who subbed
      },
    });

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("[STRIPE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
