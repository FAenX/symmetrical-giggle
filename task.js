import {Worker, Queue} from 'bullmq';
import moment from 'moment';

const bookingNotificationQueue = new Queue("bookingStatusNotifications")

  
export async function bookingWorker(){
    const worker = new Worker("bookingWaiting", async job => {
      // do tasks here
      const booking = {...job.data};
      const requestedAt = moment(booking.bookingRequestedAt);

      //waiting
      const willExpireAt = requestedAt.add(1, 'minute');
      console.log(`Will expire at ${willExpireAt}`);

     

    
    });
    worker.on('progress', ({ jobId, data }, timestamp) => {
      console.log(`${jobId} reported progress ${data} at ${timestamp}`);
    });

    worker.on('failed', (job, err) => {
      console.log(`${job.id} has failed with ${err.message}`);
    });
    
    worker.on('drained', () => {
      // Queue is drained, no more jobs left
      console.log('no jobs');
    });
    
    worker.on('completed', (job, res) => {
      // job has completed
      
      const data = {...job.data.booking}
      const userId = data.userId
      console.log(`${job.id} done for booking Id ${data.id} and userId ${userId}`);
      bookingNotificationQueue.add(userId, {message: "Your booking request is pending"})
    });
    
  }

  export async function bookingNotificationsWorker(){
    const worker = new Worker("bookingStatusNotifications", async job => {
      console.log(job.data, job.name);
    })
    worker.on('completed', job => {
      // job has completed
      console.log(job.id)
    })
  }



