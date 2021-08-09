exports = async function respondToInvitation(groupId, accept, deviceId) {
  if (!groupId)
    return { error: { message: 'Please provide which group to respond to.' } };

  if (typeof accept !== 'boolean')
    return { error: { message: 'Please provide whether to accept the invitation or not.' } };

  if (accept && !deviceId)
    return { error: { message: 'Please provide which device to join the group with.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const userId = BSON.ObjectId(realmUser.id);
  groupId = BSON.ObjectId(groupId);
  deviceId = BSON.ObjectId(deviceId);

  try {
    // If the user accepts the invitation, we will add the new member to the group,
    // and remove the invitation. Otherwise, we will just remove the invitation.
    if (accept) {
      const newMemberUserDoc = await db.collection('User').findOne({ _id: userId });
    
      // Stringify the ObjectIds when comparing as the references themselves may differ
      const isInvited = newMemberUserDoc.invitations?.some(invitation => invitation.groupId.toString() === groupId.toString());
      if (!isInvited)
        return { error: { message: 'You must be invited to the group before responding.' } };

      const isDeviceOwner = newMemberUserDoc.devices?.some(device => device._id.toString() === deviceId.toString());
      if (!isDeviceOwner)
        return { error: { message: 'You must be the owner of the device to join the group with.' } };

      const deviceDoc = await db.collection('Device').findOne({ _id: deviceId });
      if (!deviceDoc?._id)
        return { error: { message: 'The selected device does not exist.' } };
  
      const groupDoc = await db.collection('Group').findOne({ _id: groupId });
      if (!groupDoc?._id)
        return { error: { message: 'The group does not exist.' } };
    
      const isAlreadyMember = groupDoc.members?.some(member => member.userId.toString() === userId.toString());
      if (isAlreadyMember)
        return { error: { message: 'You are already a member of the group.' } };

      // Now we create and insert the new group member into the group's "members" array
      const newGroupMember = {
        userId,
        displayName: newMemberUserDoc.displayName,
        deviceId
      };
      // Before adding 'deviceDoc.location', we want to be sure that it has been set.
      // Otherwise the location will be undefined and hence break the Realm schema validation.
      // Objects/Documents that don't adhere to the schema will not be synced. (This can occur
      // in the event when a user registers but don't allow the client app location permissions.)
      if (deviceDoc.location)
        newGroupMember.location = deviceDoc.location;

      await db.collection('Group').updateOne(
        { _id: groupId },
        { $push: { members: newGroupMember } }
      );
  
      // We also need to create a group membership object to insert into the user's
      // "groups" array. This object acts as the user-specific settings for that group.
      const newGroupMembership = {
        groupId,
        groupPartition: groupDoc._partition,
        groupName: groupDoc.name,
        deviceId,
        shareLocation: true
      };
  
      await db.collection('User').updateOne(
        { _id: userId },
        { $push: { groups: newGroupMembership } }
      );
    }

    // Remove the GroupInvitation from the User's "invitations" array 
    // (This is done both when the user accepts and declines.)
    // (If the invitation does not exist, nothing will be pulled.)
    await db.collection('User').updateOne(
      { _id: userId },
      { $pull: { invitations: { groupId } } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error responding to group invitation: ', err.message);
    return { error: { message: err.message || 'There was an error responding to the invitation.' } };
  }
};
