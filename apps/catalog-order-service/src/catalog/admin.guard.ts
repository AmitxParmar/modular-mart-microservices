import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.auth;

    if (!auth?.userId) throw new UnauthorizedException('Not authenticated');

    // Query the users table created by user-service directly!
    const result = await this.dataSource.query(
      `SELECT role FROM users WHERE "clerkId" = $1`,
      [auth.userId],
    );

    if (result.length > 0 && result[0]?.role === 'ADMIN') {
      return true; // Authorized!
    }

    return false; // Denied!
  }
}
