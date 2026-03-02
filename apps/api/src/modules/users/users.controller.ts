import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.usersService.listUsers(user.tenantId);
  }

  @Post('invite')
  invite(@CurrentUser() user: JwtPayload, @Body() body: { email: string; role: string; firstName: string; lastName: string }) {
    return this.usersService.inviteUser(user.tenantId, body);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { role: string }) {
    return this.usersService.updateRole(id, user.tenantId, body.role, user.role);
  }
}
