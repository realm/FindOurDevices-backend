exports = async function createGroup(name, deviceId) {
  if (!name)
    return { error: { message: 'Please provide a name for the group.' } };

  if (!deviceId)
    return { error: { message: 'Please provide which device to create the group with.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  deviceId = BSON.ObjectId(deviceId);

  try {
    const userDoc = await db.collection('User').findOne({ _id: BSON.ObjectId(realmUser.id) });
    if (!userDoc?._id) {
      console.warn('Could not find a user doc matching the realm user id: ', realmUser.id);
      return { error: { message: 'There was an error creating the group.' } };
    }

    if (userDoc.deviceIds.length === 0)
      return { error: { message: 'You must have a device to create a group.' } };

    const isDeviceOwner = userDoc.deviceIds?.some(id => id.toString() === deviceId.toString());
    if (!isDeviceOwner)
      return { error: { message: 'You must be the owner of the device to create the group with.' } };

    const deviceDoc = await db.collection('Device').findOne({ _id: deviceId });
    if (!deviceDoc?._id)
      return { error: { message: 'The selected device does not exist.' } };

    // The following is the read-only information available to everyone in the group
    const groupMember = {
      userId: userDoc._id,
      displayName: userDoc.displayName,
      deviceName: deviceDoc.name
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
    };

    await db.collection('Group').insertOne(group);

    // The following is the read-only information available only to the specific user
    const groupMembership = {
      groupId: group._id,
      groupName: group.name,
      deviceId: deviceDoc._id,
      isOwner: true,
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
