exports = async function createGroup(name) {
  if (!name)
    return { error: { message: 'Please provide a name for the group.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  try {
    const userDoc = await db.collection('User').findOne({ _id: BSON.ObjectId(realmUser.id) });
    if (!userDoc?._id) {
      console.warn('Could not find a user doc matching the realm user id: ', realmUser.id);
      return { error: { message: 'There was an error creating the group.' } };
    }

    // TODO: Temporarily pick the first device
    const deviceDoc = await db.collection('Device').findOne({ _id: userDoc.deviceIds[0] });
    if (!deviceDoc?._id) {
      console.warn('Could not find a device doc matching the device id: ', userDoc.deviceIds[0]);
      return { error: { message: 'You must have a device to join a group.' } };
    }

    // The following is the read-only information available to everyone in the group
    const groupMember = {
      userId: userDoc._id,
      displayName: userDoc.displayName,
      deviceId: deviceDoc._id
    };
    // Before adding deviceDoc.location, we want to be sure that it has been set.
    // Otherwise the location will be undefined and hence break the Realm schema validation.
    if (deviceDoc.location)
      groupMember.location = deviceDoc.location;

    const groupId = new BSON.ObjectId();
    const group = {
      _id: groupId,
      _partition: `group=${groupId}`,
      ownerId: userDoc._id,
      name,
      members: [groupMember]
      // TODO: add alertLog here later
    };

    await db.collection('Group').insertOne(group);

    // The following is the read-only information available only to the specific user
    const groupMembership = {
      groupId: group._id,
      groupPartition: group._partition,
      deviceId: deviceDoc._id,
      shareLocation: true
    };

    await db.collection('User').updateOne(
      { _id: userDoc._id },
      { $push: { groups: groupMembership } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error creating group: ', err.message);
    return { error: { message: err.message || 'There was an error creating the group.' } };
  }
};
