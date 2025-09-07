// MongoDB initialization script
db = db.getSiblingDB('dungeon-ai');

// Create collections with validation
db.createCollection('gamesessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['session_id', 'user_id', 'world_state', 'metadata'],
      properties: {
        session_id: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        user_id: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        world_state: {
          bsonType: 'object',
          description: 'must be an object and is required'
        },
        turn_history: {
          bsonType: 'array',
          description: 'must be an array'
        },
        metadata: {
          bsonType: 'object',
          description: 'must be an object and is required'
        }
      }
    }
  }
});

db.createCollection('savedgames', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['save_id', 'save_name', 'session_id', 'user_id'],
      properties: {
        save_id: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        save_name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        session_id: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        user_id: {
          bsonType: 'string',
          description: 'must be a string and is required'
        }
      }
    }
  }
});

// Create indexes for performance
db.gamesessions.createIndex({ 'session_id': 1 }, { unique: true });
db.gamesessions.createIndex({ 'user_id': 1, 'metadata.last_played': -1 });
db.gamesessions.createIndex({ 'metadata.created_at': -1 });

db.savedgames.createIndex({ 'save_id': 1 }, { unique: true });
db.savedgames.createIndex({ 'user_id': 1, 'created_at': -1 });
db.savedgames.createIndex({ 'user_id': 1, 'save_name': 1 }, { unique: true });

print('Database initialized successfully!');