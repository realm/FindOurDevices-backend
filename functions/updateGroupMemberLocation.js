import { BSON } from 'realm';

// In our trigger "onLocationUpdate.json" we have configured the "project" field to
// only filter out the fields "documentKey" (the _id of the modified document) and
// "updateDescription.updatedFields.location". These will appear in the change event object.
exports = async function updateGroupMemberLocation({ documentKey, updateDescription }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const deviceId = documentKey._id;
  const updatedLocation = updateDescription.updatedFields.location;

  try {
    // We first need to find the user's group memberships that use the device that was
    // just updated (since users have the possibility to use different devices per group)
    const userDoc = await db.collection('User').findOne(
      { _id: BSON.ObjectID(realmUser.id) },
      // We can use projection to specify which fields to return if we don't need that many
      // (Use "1" for including the field. "_id" will return by default)
      { groups: 1 }
    );
    if (!userDoc?._id)
      return console.warn('Could not find a user doc matching the realm user id: ', realmUser.id);

    const groupIds = userDoc.groups
      .filter(group => group.deviceId === deviceId)
      .map(group => group.groupId);

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
      { arrayFilters: [ { 'member.userId': userDoc._id }, { 'member.deviceId': deviceId } ] }
    );
  }
  catch (err) {
    console.error('Error updating group member location: ', err.message);
  }
};
