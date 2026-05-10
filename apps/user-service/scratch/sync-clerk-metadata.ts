
import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from user-service
dotenv.config({ path: '.env' });

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function syncRoles() {
  const clerkId = 'user_2tNn9F9n3m0mN9m9mN9m9mN9m9m'; // I need to get the real clerk ID for amitparmar901@gmail.com
  // I found it earlier but let me search again or just use the email to find it in Clerk
  
  const users = await clerkClient.users.getUserList({
    emailAddress: ['amitparmar901@gmail.com'],
  });

  if (users.data.length === 0) {
    console.log('User not found in Clerk');
    return;
  }

  const user = users.data[0];
  console.log(`Found Clerk User: ${user.id}`);

  // We know from DB check that this user has ADMIN, CUSTOMER, SELLER
  const roles = ['ADMIN', 'CUSTOMER', 'SELLER'];
  const internalId = '019d0b6a-b3e4-70d6-a168-89e80598c929';

  await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: {
      internalId,
      roles,
    },
  });

  console.log('Successfully synced roles and internalId to Clerk metadata');
}

syncRoles().catch(console.error);
