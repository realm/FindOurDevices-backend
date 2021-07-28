import { BSON } from 'realm';

exports = async function createGroup(name) {
  const db = context.services('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  try {
    const userDoc = await db.collection('User').findOne({ _id: BSON.ObjectID(realmUser.id) });
    if (!userDoc?.id) {
      console.log('Could not find the user with id: ', realmUser.id);
      // Return a friendly message to the client.
      return {
        success: false,
        error: { message: 'There was an error creating the group.' }
      };
    }

    if (name?.length === 0)
      return {
        success: false,
        error: { message: 'The name of the group must contain at least 1 character.' }
      };

    // TODO: Temporarily pick the first device (later do checks if device is valid)
    const device = userDoc.devices[0];  

    // The following is the read-only information available to everyone in the group
    const groupMember = {
      userId: userDoc._id,
      displayName: userDoc.displayName,
      deviceId: device.iosOrAndroidId,
      deviceName: device.name
    };
    if (device.location)
      groupMember.location = device.location;

    const groupId = new BSON.ObjectID();
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
      _id: new BSON.ObjectID(),
      _partition: `groupMembership=${realmUser.id}`,
      userId: userDoc._id, // this is the ObjectId type of realmUser.id
      groupPartition: group._partition,
      deviceId: device.iosOrAndroidId,
      shareLocation: true
    };

    await db.collection('GroupMembership').insertOne(groupMembership);

    return { success: true };
  }
  catch (err) {
    console.error('Error creating group: ', err.message);
    return {
      success: false,
      error: { message: err.message || 'There was an error creating the group.' }
    };
  }
};
