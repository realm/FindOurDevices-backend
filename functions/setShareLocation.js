exports = async function setShareLocation(groupId, shareLocation) {
  if (!groupId)
  return { error: { message: 'Please provide which group to change.' }};

  if (typeof shareLocation !== 'boolean')
  return { error: { message: 'Please provide whether or not to share location.' }};

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const userId = BSON.ObjectId(realmUser.id);
  groupId = BSON.ObjectId(groupId);

  try {
    // We can use MongoDB's "arrayFilters" to the element that match the condition.
    // db.collection.updateOne(
    //   { <query conditions> },
    //   { <update operator>: { "<array>.$[<identifier>]" : value } },
    //   { arrayFilters: [ { <identifier>: <condition> } ] }
    // )
    await db.collection('User').updateOne(
      { _id: userId },
      { $set: { 'groups.$[group].shareLocation': shareLocation } },
      { arrayFilters: [ { 'group.groupId': groupId } ] }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error setting shareLocation: ', err.message);
    return { error: { message: err.message || 'There was an error changing location sharing setting.' } };
  }
};
