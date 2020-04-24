/* eslint-disable no-console */
import { Worker, Queue } from 'bullmq';
import moment from 'moment';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import cron from 'node-cron';
import mongoose, { Schema } from 'mongoose';
import model from './model';

dotenv.config();
const { REDIS_URL, MONGO_DB } = process.env;

const connection = new IORedis(REDIS_URL);

const Booking = mongoose.model(
'Booking', new Schema(model), 'Booking'
);

// cron jobs
async function cronJob(willExpireAt, booking) {
  let expireAt = moment(willExpireAt).format('mm HH DD MM');
  expireAt += ' *';

  cron.schedule(expireAt, async () => {
    await mongoose.connect(MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const { id } = booking.booking;
    console.log(`Running task for bookind Id ${id} at ${moment().format()}`);

    try {
      const foundBooking = await Booking.findById(id);

      if (foundBooking.status === 'pending') {
        foundBooking.status = 'rejected';
        await foundBooking.save();

        const userNotification = new Queue(foundBooking.userId, { connection });
        userNotification.add('bookingStatus', {
          bookingStatus: 'closed',
          bookingId: foundBooking.id,
          userId: foundBooking.userId,
          comment: 'Past 24hrs',
        });

        mongoose.connection.close();
        console.log('connection to mongo db closed');
      }
    } catch (e) {
      console.log(e);
    }
  });
}

// create notification streams for bookings added to cron
async function bookingWorker() {
  const worker = new Worker(
    'bookingWaitingQueue',
    async (job) => {
      const booking = { ...job.data };
      const requestedAt = moment(booking.bookingRequestedAt);
      const willExpireAt = requestedAt.add(2, 'minute');
      cronJob(willExpireAt, booking);
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    console.log(`${job.id} has failed with ${err.message}`);
  });

  worker.on('drained', () => {
    // Queue is drained, no more jobs left
    console.log('no jobs');
  });

  worker.on('completed', (job) => {
    // job has completed
    const data = { ...job.data.booking };
    const { userId, id } = data;
    console.log(` Job id ${job.id} added to cron for booking Id ${id} and userId ${userId}`,);
    const userNotification = new Queue(userId, { connection });
    userNotification.add('bookingStatus', { bookingStatus: 'pending' });
  });
}

bookingWorker();
