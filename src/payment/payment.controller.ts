import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBody,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/schemas/user.schema";

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("create-intent/:orderId")
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Param("orderId") orderId: string) {
    return this.paymentService.createPaymentIntent(orderId);
  }

  @Post("confirm/:paymentIntentId")
  @UseGuards(JwtAuthGuard)
  confirmPayment(@Param("paymentIntentId") paymentIntentId: string) {
    return this.paymentService.confirmPayment(paymentIntentId);
  }

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @RawBody() payload: Buffer,
    @Headers("stripe-signature") signature: string
  ) {
    return this.paymentService.handleWebhook(payload, signature);
  }

  @Post("refund/:paymentIntentId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  refundPayment(@Param("paymentIntentId") paymentIntentId: string) {
    return this.paymentService.refundPayment(paymentIntentId);
  }
}
