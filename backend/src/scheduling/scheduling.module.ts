import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, Resource } from '../database/entities/booking.entity';
import { Client } from '../database/entities/client.entity';
import { BookingService } from './booking/booking.service';
import { ReminderService } from './reminders/reminder.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Resource, Client]),
    forwardRef(() => MessagingModule),
  ],
  providers: [BookingService, ReminderService],
  exports: [BookingService],
})
export class SchedulingModule {}
