import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { OrderModule } from "../order/order.module";

@Module({
  imports: [ConfigModule, OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
