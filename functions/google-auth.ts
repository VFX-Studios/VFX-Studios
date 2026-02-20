import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return Response.json({ error: 'No credential provided' }, { status: 400 });
    }

    // Decode Google JWT token
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return Response.json({ error: 'Invalid credential format' }, { status: 400 });
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Extract user information
    const googleUserId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;
    const verified = payload.email_verified;

    if (!verified) {
      return Response.json({ error: 'Email not verified' }, { status: 400 });
    }

    const base44 = getClient(req);

    // Check if user already exists with this Google account
    const existingAccounts = await base44.asServiceRole.entities.ConnectedAccount.filter({
      service: 'google',
      service_user_id: googleUserId
    });

    let userId;
    let isNewUser = false;

    if (existingAccounts.length > 0) {
      // Existing user - log them in
      userId = existingAccounts[0].user_id;
    } else {
      // Check if user exists by email
      const users = await base44.asServiceRole.entities.User.filter({ email });
      
      if (users.length > 0) {
        // Link Google account to existing user
        userId = users[0].id;
        
        await base44.asServiceRole.entities.ConnectedAccount.create({
          user_id: userId,
          service: 'google',
          access_token: credential,
          service_user_id: googleUserId,
          service_email: email,
          scopes: ['email', 'profile']
        });
      } else {
        // Create new user
        try {
          await base44.asServiceRole.users.inviteUser(email, 'user');
          
          // Get newly created user
          const newUsers = await base44.asServiceRole.entities.User.filter({ email });
          if (newUsers.length === 0) {
            return Response.json({ error: 'User creation failed' }, { status: 500 });
          }
          
          userId = newUsers[0].id;
          isNewUser = true;

          // Update user with full name
          await base44.asServiceRole.entities.User.update(userId, {
            full_name: fullName
          });

          // Create connected account record
          await base44.asServiceRole.entities.ConnectedAccount.create({
            user_id: userId,
            service: 'google',
            access_token: credential,
            service_user_id: googleUserId,
            service_email: email,
            scopes: ['email', 'profile']
          });

          // Create artist profile
          await base44.asServiceRole.entities.Artist.create({
            user_id: userId,
            artist_name: fullName
          });
        } catch (error) {
          console.error('User creation error:', error);
          return Response.json({ error: 'Failed to create user account' }, { status: 500 });
        }
      }
    }

    return Response.json({
      success: true,
      userId,
      email,
      fullName,
      isNewUser
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
