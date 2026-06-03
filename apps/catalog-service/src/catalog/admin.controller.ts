import { Controller, Get, UseGuards, Inject, Logger, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";
import { Product } from "./entities/product.entity";
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
    @Inject("ORDER_SERVICE")
    private readonly orderClient: ClientProxy,
    @Inject("AUTH_SERVICE")
    private readonly authClient: ClientProxy,
    private readonly dataSource: DataSource,
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
    const services = [
      { name: "catalog-database", probe: this.checkDatabase() },
      { name: "order-service", probe: this.checkService(this.orderClient, "orders.count", "order-service") },
      { name: "auth-service", probe: this.checkService(this.authClient, "users.count", "auth-service") },
    ];

    const results = await Promise.allSettled(
      services.map((s) => s.probe),
    );

    return services.map((s, i) => {
      const r = results[i];
      const healthy = r.status === "fulfilled" && r.value;
      return {
        id: crypto.randomUUID(),
        serviceName: s.name,
        status: healthy ? "healthy" : "down",
        latencyMs: r.status === "fulfilled" ? r.value : 0,
        errorDetails: r.status === "rejected" ? (r.reason?.message ?? String(r.reason)) : undefined,
        createdAt: new Date().toISOString(),
      };
    });
  }

  private async checkDatabase(): Promise<number> {
    const start = Date.now();
    await this.dataSource.query("SELECT 1");
    return Date.now() - start;
  }

  private async checkService(client: ClientProxy, cmd: string, label: string): Promise<number> {
    const start = Date.now();
    await firstValueFrom(client.send<number>(cmd, {}).pipe(timeout(2000)));
    return Date.now() - start;
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
