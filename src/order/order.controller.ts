import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  SetMetadata,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/schemas/user.schema";
import { OrderStatus } from "./schemas/order.schema";

const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles);
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  @Get()
  getUserOrders(@Request() req) {
    return this.orderService.findUserOrders(req.user.userId);
  }

  @Get("all")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body("status") status: OrderStatus) {
    return this.orderService.updateOrderStatus(id, status);
  }
}
