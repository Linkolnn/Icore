import { connect } from 'mongoose';
import { config } from 'dotenv';

config();

async function migrateLastMessages() {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/icore';
    await connect(mongoUri);
    console.log('Connected to MongoDB');

    // Получаем коллекции
    const db = require('mongoose').connection.db;
    const chatsCollection = db.collection('chats');
    const messagesCollection = db.collection('messages');

    // Найти все чаты с lastMessage без text
    const chatsToUpdate = await chatsCollection.find({
      'lastMessage': { $exists: true },
      'lastMessage.text': { $exists: false }
    }).toArray();

    console.log(`Found ${chatsToUpdate.length} chats to update`);

    for (const chat of chatsToUpdate) {
      if (chat.lastMessage && chat.lastMessage._id) {
        // Найти само сообщение
        const message = await messagesCollection.findOne({
          _id: chat.lastMessage._id
        });

        if (message) {
          // Обновить lastMessage с полными данными
          await chatsCollection.updateOne(
            { _id: chat._id },
            {
              $set: {
                lastMessage: {
                  text: message.text || '',
                  sender: message.sender,
                  createdAt: message.createdAt || chat.lastMessage.createdAt
                }
              }
            }
          );
          console.log(`Updated chat ${chat._id}`);
        } else {
          console.log(`Message not found for chat ${chat._id}`);
        }
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateLastMessages();
