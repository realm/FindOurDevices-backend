// In our trigger "onLocationUpdate.json" we have configured the "project" field to only
// filter out the fields "fullDocument" and "updateDescription.updatedFields".
// These will appear in the change event object. For update operations such as this, the
// "fullDocument" represents the most current majority-committed version and may differ
// from the changes described in "updateDescription" if other majority-committed operations
// modified the document between the original update operation and the full document lookup.
exports = async function updateGroupMemberLocation({ fullDocument, updateDescription }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const userId = fullDocument.ownerId;
  const deviceId = fullDocument._id;
  
  const updatedLocation = fullDocument.location;
  // or:
  // const updatedLocation = {
  //   updatedAt: updateDescription.updatedFields['location.updatedAt'],
  //   longitude: updateDescription.updatedFields['location.longitude'],
  //   latitude: updateDescription.updatedFields['location.latitude']
  // };
  // don't: (due to the embedded nature)
  // const updatedLocation = updateDescription.updatedFields.location;

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

    // When filtering out the group memberships that the device is associated with, also
    // make sure that the user has opted to share its location.
    // (Stringify the ObjectIds when comparing as the references themselves may differ)
    const groupIds = userDoc.groups
      .filter(groupMembership => groupMembership.deviceId.toString() === deviceId.toString() && groupMembership.shareLocation)
      .map(groupMembership => groupMembership.groupId);

    if (groupIds.length === 0)
      return;

    // Now we need to update the location of the current group member in all associated groups.
    // We can use MongoDB's "arrayFilters" to update all elements that match the conditions.
    // db.collection.updateMany(
    //   { <query conditions> },
    //   { <update operator>: { "<array>.$[<identifier>]" : value } },
    //   { arrayFilters: [ { <identifier>: <condition> } ] }
    // )
    return await db.collection('Group').updateMany(
      { _id: { $in: groupIds } },
      { $set: { 'members.$[member].location': updatedLocation } },
      { arrayFilters: [ { 'member.userId': userId } ] }
    );
  }
  catch (err) {
    console.error('Error updating group member location: ', err.message);
  }
};
