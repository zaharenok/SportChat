# Data Directory

This directory contains the JSON database files for SportChat application.

## Setup

1. Copy the example files to create your database:
```bash
cp db/users.json.example db/users.json
cp db/chat_messages.json.example db/chat_messages.json
cp db/days.json.example db/days.json
cp db/workouts.json.example db/workouts.json
cp db/goals.json.example db/goals.json
cp db/achievements.json.example db/achievements.json
```

2. The application will automatically create these files if they don't exist.

## Files

- `users.json` - User accounts and profiles
- `chat_messages.json` - Chat history between users and AI
- `days.json` - Training days records
- `workouts.json` - Individual workout entries
- `goals.json` - User fitness goals and progress
- `achievements.json` - User achievements and milestones

## Security Note

The actual `.json` files are ignored by Git to prevent committing personal data. Only the `.example` files are tracked in version control.