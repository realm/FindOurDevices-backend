exports = async function setDisplayName(name) {
  if (!name)
    return { error: { message: 'Please provide a display name.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  try {
    // We will first update the display name on the user, then we need to propagate
    // that change onto all of its groups that it's a member of so that the group
    // members can see the new display name when its synced.
    const userDoc = await db.collection('User').findOne({ _id: BSON.ObjectId(realmUser.id) });
    if (!userDoc?._id) {
      console.warn('Could not find a user doc matching the realm user id: ', realmUser.id);
      return { error: { message: 'There was an error setting the display name.' } };
    }

    await db.collection('User').updateOne(
      { _id: userDoc._id },
      { $set: { displayName: name } }
    );

    const groupIds = userDoc.groups.map(groupMembership => groupMembership.groupId);
    
    // We can use MongoDB's "arrayFilters" to update all elements that match the conditions.
    // db.collection.updateMany(
    //   { <query conditions> },
    //   { <update operator>: { "<array>.$[<identifier>]" : value } },
    //   { arrayFilters: [ { <identifier>: <condition> } ] }
    // )
    return await db.collection('Group').updateMany(
      { _id: { $in: groupIds } },
      { $set: { 'members.$[member].displayName': name } },
      { arrayFilters: [ { 'member.userId': userDoc._id } ] }
    );
  }
  catch (err) {
    console.error('Error setting display name: ', err.message);
    return { error: { message: err.message || 'There was an error setting the display name' } };
  }
};
