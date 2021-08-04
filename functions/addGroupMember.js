exports = async function addGroupMember(groupId, newMemberEmail) {
  if (!groupId)
    return { error: { message: 'Please provide which group to add the member to.' } };

  if (!newMemberEmail)
    return { error: { message: 'Please provide the email address of the member to add.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' } };
  
    if (groupDoc.ownerId !== BSON.ObjectId(realmUser.id))
      return { error: { message: 'Only group owners can add other members.' } };
  
    const newMemberUserDoc = await db.collection('User').findOne({ email: newMemberEmail });
    if (!newMemberUserDoc?._id)
      return { error: { message: 'There is no member with the given email.' } };

    const isAlreadyMember = groupDoc.members?.some(member => member.userId === newMemberUserDoc._id);
    if (isAlreadyMember)
      return { error: { message: 'The user is already a member of the group.' } };

    if (userDoc.deviceIds.length === 0)
      return { error: { message: 'The member must have a device to join the group.' } };

    // TODO: Temporarily pick the first device
    const deviceDoc = await db.collection('Device').findOne({ _id: newMemberUserDoc.deviceIds[0] });
    if (!deviceDoc?._id)
      return { error: { message: "The member's selected device does not exist." } };

    // Now we create and insert the new group member into the group's "members" array
    const newGroupMember = {
      userId: newMemberUserDoc._id,
      displayName: newMemberUserDoc.displayName,
      deviceId: deviceDoc._id
    };
    // Before adding 'deviceDoc.location', we want to be sure that it has been set.
    // Otherwise the location will be undefined and hence break the Realm schema validation.
    // Objects/Documents that don't adhere to the schema will not be synced. (This can occur
    // in the event when a user registers but don't allow the client app location permissions.)
    if (deviceDoc.location)
      newGroupMember.location = deviceDoc.location;

    await db.collection('Group').updateOne(
      { _id: groupDoc._id },
      { $push: { members: newGroupMember } }
    );

    // We also need to create a group membership object to insert into the user's
    // "groups" array. This object acts as the user-specific settings for that group.
    const newGroupMembership = {
      groupId: groupDoc._id,
      groupPartition: groupDoc._partition,
      groupName: groupDoc.name,
      deviceId: deviceDoc._id,
      shareLocation: true
    };

    await db.collection('User').updateOne(
      { _id: newMemberUserDoc._id },
      { $push: { groups: newGroupMembership } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error adding group member: ', err.message);
    return { error: { message: err.message || 'There was an error adding the group member.' } };
  }
};
