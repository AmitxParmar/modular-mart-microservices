const amqplib = require('amqplib');

async function test() {
  const connection = await amqplib.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  // Create reply queue
  const replyQueue = await channel.assertQueue('', { exclusive: true });
  const correlationId = 'test-correlation-id-123';
  
  channel.consume(replyQueue.queue, (msg) => {
    if (msg.properties.correlationId === correlationId) {
      console.log('Received response:', msg.content.toString());
      setTimeout(() => {
        connection.close();
      }, 500);
    }
  }, { noAck: true });

  const payload = {
    pattern: 'user.get_role',
    data: { userId: '019d0b6a-b3e4-70d6-a168-89e80598c929' },
    id: correlationId
  };

  console.log('Sending request...');
  channel.sendToQueue('auth_queue', Buffer.from(JSON.stringify(payload)), {
    correlationId: correlationId,
    replyTo: replyQueue.queue,
    contentType: 'application/json'
  });
}

test().catch(console.error);
