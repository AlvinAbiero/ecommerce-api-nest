import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post("add")
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Delete("clear")
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }

  @Delete(":productId")
  removeFromCart(@Request() req, @Param("productId") productId: string) {
    return this.cartService.rremoveFromCart(req.user.userId, productId);
  }

  @Patch(":productId/quantity")
  updateQuantity(
    @Request() req,
    @Param("productId") productId: string,
    @Body("quantity") quantity: number
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      productId,
      quantity
    );
  }
}
