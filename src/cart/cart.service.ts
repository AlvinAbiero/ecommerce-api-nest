import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart, CartDocument } from "./schemas/cart.schema";
import { ProductsService } from "src/products/products.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productsService: ProductsService
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const product = await this.productsService.findOne(addToCartDto.productId);

    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException("Insufficient stock");
    }

    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      cart = new this.cartModel({ userId, items: [], totalAmount: 0 });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === addToCartDto.productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += addToCartDto.quantity;
    } else {
      cart.items.push({
        product: addToCartDto.productId as any,
        quantity: addToCartDto.quantity,
        price: product.price,
      });
    }

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    return cart.save();
  }

  async rremoveFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    return cart.save();
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ userId })
      .populate("items.product")
      .exec();

    if (!cart) {
      return new this.cartModel({ userId, items: [], totalAmount: 0 });
    }

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel
      .findOneAndUpdate({ userId }, { items: [], totalAmount: 0 })
      .exec();
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new NotFoundException("Item not found in cart");
    }

    if (quantity < 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    return cart.save();
  }
}
