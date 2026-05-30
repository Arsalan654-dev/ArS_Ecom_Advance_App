// backend\utils\emailQueue.js

import { setTimeout } from 'timers/promises';

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(emailFunction, ...args) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn: emailFunction,
        args,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        const result = await job.fn(...job.args);
        job.resolve(result);
      } catch (error) {
        job.reject(error);
      }
      // Small delay between emails to avoid rate limiting
      await setTimeout(1000);
    }

    this.processing = false;
  }
}

export const emailQueue = new EmailQueue();