import Stripe from 'stripe';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeWebhookService } from './services/stripe-webhook.service';

/**
 * Module for handling payment processing and Stripe integration.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [
    PaymentsService,
    StripeWebhookService,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(
          configService.get<string>('STRIPE_SECRET_KEY') as string,
          {
            apiVersion: '2026-04-22.dahlia' as any,
          },
        );
      },
      inject: [ConfigService],
    },
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
