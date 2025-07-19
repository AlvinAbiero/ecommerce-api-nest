import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order, OrderDocument, OrderStatus } from "./schemas/order.schema";
import { CartService } from "../cart/cart.service";
import { ProductsService } from "../products/products.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
    private productsService: ProductsService
  ) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto
  ): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException("Cart is Empty");
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = await this.productsService.findOne(
        item.product.toString()
      );
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`
        );
      }
    }

    // Create order items
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      name: (item.product as any).name, // Assuming populated
    }));

    const order = new this.orderModel({
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress: createOrderDto.shippingAddress,
      status: OrderStatus.PENDING,
    });

    const saveOrder = await order.save();

    // Update product stock
    for (const item of cart.items) {
      await this.productsService.updateStock(
        item.product.toString(),
        -item.quantity
      );
    }

    // Clear cart
    await this.cartService.clearCart(userId);

    return saveOrder;
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ userId })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate("items.product")
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate("items.product")
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async updatePaymentIntent(
    id: string,
    paymentIntentId: string
  ): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { paymentIntentId }, { new: true })
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }
  async getAllOrders(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate("items.product")
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .exec();
  }
}
