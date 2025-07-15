import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user.toObject();
    return result;
  }

  @Get("email/:email")
  async findByEmail(@Param("email") email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { password, ...result } = user.toObject();
    return result;
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    const user = await this.usersService.findById(+id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    const updated = await this.usersService.update(+id, updateUserDto);
    const { password, ...result } = updated.toObject();
    return result;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.usersService.remove(+id);
  }
}
