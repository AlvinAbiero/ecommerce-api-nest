import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { OrderService } from "../order/order.service";
import { OrderStatus } from "../order/schemas/order.schema";

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private orderService: OrderService
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>("STRIPE_SECRET_KEY") ||
        "sk_test_your_stripe_secret_key",
      {
        apiVersion: "2025-06-30.basil",
      }
    );
  }

  async createPaymentIntent(
    orderId: string
  ): Promise<{ clientSecret: string }> {
    const order = await this.orderService.findOne(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("Order is not in pending status");
    }

    const paymnentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: orderId,
      },
    });

    // Update order with paymnet intent ID
    await this.orderService.updatePaymentIntent(orderId, paymnentIntent.id);

    return {
      clientSecret: paymnentIntent.client_secret as string,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status === "succeeded") {
        const orderId = paymentIntent.metadata.orderId;
        await this.orderService.updateOrderStatus(orderId, OrderStatus.PAID);
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      throw new BadRequestException("Payment confirmation failed");
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET"
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret as string
      );
    } catch (err) {
      throw new BadRequestException("Webhook signature verification failed");
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        await this.orderService.updateOrderStatus(orderId, OrderStatus.PAID);
        break;

      case "payment_intent.payment_failed":
        // Handle failed payment
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  async refundPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      return { success: refund.status === "succeeded" };
    } catch (error) {
      throw new BadRequestException("Refund failed");
    }
  }
}
