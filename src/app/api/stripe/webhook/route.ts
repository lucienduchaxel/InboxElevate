import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    console.log(error);
    return new Response("Webhook error", { status: 400 });
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceSession = event.data.object as Stripe.Invoice;

  console.log(event.type)
  console.log(session)


  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      checkoutSession.subscription as string,
      {
        expand: ["items.data.price.product"],
      },
    );

    if (!checkoutSession?.client_reference_id) {
      return new Response("Webhook Error", { status: 400 });
    }

    const plan = subscription.items.data[0]?.price;
    if (!plan) {
      return new Response("Webhook Error", { status: 400 });
    }

    const productId = (plan.product as Stripe.Product).id;
    if (!productId) {
      return new Response("Webhook Error", { status: 400 });
    }

    await db.stripeSubscription.create({
      data: {
        userId: checkoutSession.client_reference_id,
        priceId: plan.id,
        customerId: subscription.customer as string,
        currentPeriodEnd: new Date((subscription?.items?.data[0]?.current_period_end ?? 0) * 1000),
        subscriptionId: subscription.id,
      },
    });
    return new Response("Webhook succeed", { status: 200 });
  }

  // if (event.type === "invoice.payment_succeeded") {
  //   // const subscription = await stripe.subscriptions.retrieve(
  //   //   session.subscription as string,
  //   //   {
  //   //     expand: ["items.data.price.product"],
  //   //   },
  //   // );

  //   // console.log(subscription)
  //   const plan = subscription.items.data[0]?.price;

  //   if (!plan) {
  //     throw new Error("No plan found for this subscription.");
  //   }

  //   const productId = (plan.product as Stripe.Product).id;

  //   await db.stripeSubscription.update({
  //     where: {
  //       subscriptionId: subscription.id,
  //     },
  //     data: {
  //       currentPeriodEnd: new Date(subscription. * 1000),
  //       priceId: plan.id,
  //     },
  //   });
  //   return new Response("Webhook succeed", { status: 200 });
  // }

  if (event.type === "customer.subscription.updated") {
    console.log("subscription updated", session);
    const subscription = await stripe.subscriptions.retrieve(
      session.id as string,
    );
    await db.stripeSubscription.update({
      where: {
        subscriptionId: session.id as string,
      },
      data: {
        updatedAt: new Date(),
        // @ts-ignore
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
    return new Response("Webhook succeed", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}
