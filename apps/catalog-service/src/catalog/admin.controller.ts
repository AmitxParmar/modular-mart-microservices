import { Controller, Get, UseGuards, Inject, Logger, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout, catchError } from "rxjs";
import { Product } from "./entities/product.entity";
import { ServiceHealthLog } from "./entities/service-health-log.entity";
import { ClerkAuthGuard, Roles, RolesGuard } from "@repo/auth";

type OrderTimelineRow = {
  date: string;
  count: string | number;
  amount: string | number;
};

type CategoryStatRow = {
  name: string | null;
  count: string | number;
};

@Controller("catalog/admin")
@Roles("ADMIN")
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ServiceHealthLog)
    private readonly healthRepo: Repository<ServiceHealthLog>,
    @Inject("ORDER_SERVICE")
    private readonly orderClient: ClientProxy,
    @Inject("AUTH_SERVICE")
    private readonly authClient: ClientProxy,
  ) {}

  @Get("stats")
  async getStats() {
    try {
      const results = await Promise.allSettled([
        this.productRepo.count({ where: { status: "APPROVED", isActive: true } }),
        firstValueFrom(
          this.orderClient.send<number>("orders.count", {}).pipe(
            timeout(2000),
          ),
        ),
        firstValueFrom(
          this.authClient.send<number>("users.count", {}).pipe(
            timeout(2000),
          ),
        ),
      ]);

      const activeProductsResult = results[0];
      const totalOrdersResult = results[1];
      const totalUsersResult = results[2];

      if (activeProductsResult.status === "rejected") {
        this.logger.error("Failed to count active products", activeProductsResult.reason);
        throw activeProductsResult.reason;
      }
      if (totalOrdersResult.status === "rejected") {
        this.logger.error("orders.count failed in stats", totalOrdersResult.reason);
        throw totalOrdersResult.reason;
      }
      if (totalUsersResult.status === "rejected") {
        this.logger.error("users.count failed in stats", totalUsersResult.reason);
        throw totalUsersResult.reason;
      }

      const activeProducts = activeProductsResult.value;
      const totalOrders = totalOrdersResult.value;
      const totalUsers = totalUsersResult.value;

      return {
        totalUsers,
        activeProducts,
        totalOrders,
        uptime: "99.9%", //TODO: Still hardcoded for now
        trends: {
          users: 0,
          products: activeProducts > 0 ? 5 : 0,
          orders: 0,
        },
      };
    } catch (error: any) {
      this.logger.error("Stats route failed", error);
      throw new InternalServerErrorException(
        `Failed to load admin stats: ${error.message || error}`,
      );
    }
  }

  @Get("health")
  async getHealth() {
    try {
      return await this.healthRepo.find({
        order: { createdAt: "DESC" },
        take: 10,
      });
    } catch (error: any) {
      this.logger.error("Health route failed", error);
      throw new InternalServerErrorException(
        `Failed to load health logs: ${error.message || error}`,
      );
    }
  }

  @Get("analytics")
  async getAnalytics() {
    try {
      const results = await Promise.allSettled([
        this.productRepo
          .createQueryBuilder("product")
          .leftJoin("product.category", "category")
          .select("category.name", "name")
          .addSelect("COUNT(product.id)", "count")
          .groupBy("category.name")
          .getRawMany()
          .then((rows) => rows as CategoryStatRow[]),

        firstValueFrom(
          this.orderClient.send<OrderTimelineRow[]>("orders.timeline", {}).pipe(
            timeout(2000),
          ),
        ),

        firstValueFrom(
          this.authClient.send<number>("users.count", {}).pipe(
            timeout(2000),
          ),
        ),
      ]);

      const categoryStatsResult = results[0];
      const ordersTimelineResult = results[1];
      const userCountResult = results[2];

      if (categoryStatsResult.status === "rejected") {
        this.logger.error("category stats failed in analytics", categoryStatsResult.reason);
        throw categoryStatsResult.reason;
      }
      if (ordersTimelineResult.status === "rejected") {
        this.logger.error("orders.timeline failed in analytics", ordersTimelineResult.reason);
        throw ordersTimelineResult.reason;
      }
      if (userCountResult.status === "rejected") {
        this.logger.error("users.count failed in analytics", userCountResult.reason);
        throw userCountResult.reason;
      }

      const categoryStats = categoryStatsResult.value;
      const ordersTimeline = ordersTimelineResult.value;
      const userCount = userCountResult.value;

      const totalRevenue = ordersTimeline.reduce<number>(
        (acc, curr) => acc + Number(curr.amount ?? 0),
        0,
      );

      const totalOrders = ordersTimeline.reduce<number>(
        (acc, curr) => acc + Number(curr.count ?? 0),
        0,
      );

      return {
        revenue: {
          total: totalRevenue,
          growth: totalRevenue > 0 ? 12.5 : 0,
          data: ordersTimeline.map((o) => ({
            date: o.date,
            amount: Number(o.amount ?? 0),
          })),
        },
        users: {
          active: userCount,
          growth: 8.2,
          data: [],
        },
        orders: {
          total: totalOrders,
          growth: totalOrders > 0 ? 5.4 : 0,
          data: ordersTimeline.map((o) => ({
            date: o.date,
            count: Number(o.count ?? 0),
          })),
        },
        categoryDistribution: categoryStats.map((c) => ({
          name: c.name || "Uncategorized",
          value: Number(c.count ?? 0),
        })),
      };
    } catch (error: any) {
      this.logger.error("Analytics route failed", error);
      throw new InternalServerErrorException(
        `Failed to load admin analytics: ${error.message || error}`,
      );
    }
  }
}
