import amqp from 'amqplib';

const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://user:password@localhost:5672";
let channel = null;
let connection = null;

// Connect to RabbitMQ
export const connectRabbit = async () => {
  if (channel) return channel; 

  try {
    console.log("🐰 Connecting to RabbitMQ...");
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    
    // 🟢 FIX: Set durable: true to match existing queue configuration
    await channel.assertQueue('radio_metadata', { durable: true }); 
    
    console.log("🐰 Connected to RabbitMQ Module");

    connection.on("error", (err) => {
      console.error("🐰 Connection Error:", err.message);
      channel = null;
      setTimeout(connectRabbit, 5000);
    });

    connection.on("close", () => {
      console.error("🐰 Connection Closed. Reconnecting...");
      channel = null;
      setTimeout(connectRabbit, 5000);
    });
    
    return channel;
  } catch (error) {
    console.error("🐰 RabbitMQ Connection Failed:", error.message);
    setTimeout(connectRabbit, 5000);
    return null;
  }
};

// Publisher
export const publishToQueue = async (data) => {
  if (!channel) {
    console.warn("⚠️ RabbitMQ channel not ready. Queueing skipped.");
    return;
  }
  try {
    // Note: When using durable queues, it's good practice to make messages persistent (deliveryMode: 2)
    // allowing them to survive restarts too.
    channel.sendToQueue('radio_metadata', Buffer.from(JSON.stringify(data)), { persistent: true });
    console.log("📤 Sent to RabbitMQ:", data.title);
  } catch (error) {
    console.error("❌ Failed to publish:", error);
  }
};

// Consumer
export const consumeQueue = async (callbackFunction) => {
  const ch = await connectRabbit();
  if (!ch) {
      setTimeout(() => consumeQueue(callbackFunction), 5000);
      return;
  }
  
  console.log("👂 Waiting for messages in 'radio_metadata'...");
  
  ch.consume('radio_metadata', (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callbackFunction(content);
      channel.ack(msg);
    }
  });
};