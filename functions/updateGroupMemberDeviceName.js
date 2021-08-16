// In our trigger "onDeviceNameUpdate.json" we have configured the "match" field to
// only run this trigger if the "name" field on the Device document has changed.
// We have also configured the "project" field to filter out the fields "fullDocument" and
// "updateDescription.updatedFields.name". These will appear in the change event object.
// For update operations such as this, the "fullDocument" represents the most current
// majority-committed version and may differ from the changes described in "updateDescription"
// if other majority-committed operations modified the document between the original update
// operation and the full document lookup.
exports = async function updateGroupMemberDeviceName({ fullDocument, updateDescription }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const userId = fullDocument.ownerId;
  const deviceId = fullDocument._id;

  const updatedDeviceName = fullDocument.name;
  // or
  // const updatedDeviceName = updateDescription.updatedFields.name;

  try {
    // We first need to find the user's group memberships that use the device that was
    // just updated (since users have the possibility to use different devices per group)
    const userDoc = await db.collection('User').findOne(
      { _id: userId },
      // We can use projection to specify which fields to return if we don't need that many
      // (Use "1" for including the field. "_id" will return by default)
      { groups: 1 }
    );
    if (!userDoc?._id)
      return console.warn('Could not find a user doc matching the user id: ', userId.toString());

    // Stringify the ObjectIds when comparing as the references themselves may differ
    const groupIds = userDoc.groups
      .filter(groupMembership => groupMembership.deviceId.toString() === deviceId.toString())
      .map(groupMembership => groupMembership.groupId);

    if (groupIds.length === 0)
      return;

    // Now we need to update the device name of the current group member in all associated groups.
    // We can use MongoDB's "arrayFilters" to update all elements that match the conditions.
    // db.collection.updateMany(
    //   { <query conditions> },
    //   { <update operator>: { "<array>.$[<identifier>]" : value } },
    //   { arrayFilters: [ { <identifier>: <condition> } ] }
    // )
    return await db.collection('Group').updateMany(
      { _id: { $in: groupIds } },
      { $set: { 'members.$[member].deviceName': updatedDeviceName } },
      { arrayFilters: [ { 'member.userId': userId } ] }
    );
  }
  catch (err) {
    console.error('Error updating group member device name: ', err.message);
  }
};
