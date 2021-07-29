exports = async function leaveGroup(groupId) {
  if (!groupId)
    return { error: { message: 'Please provide which group to leave.' }};
  
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const userId = BSON.ObjectId(realmUser.id);

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' }};

    if (groupDoc.ownerId === userId)
      return { error: { message: 'Group owners must remove the group in order to leave it.' }};

    // Remove the group member from the group
    await db.collection('Group').updateOne(
      { _id: groupId },
      { $pull: { members: { userId } } }
    );

    // Remove the user's group membership document
    await db.collection('User').updateOne(
      { _id: userId },
      { $pull: { groups: { groupId } } }
    );
  }
  catch (err) {
    console.error('Error leaving the group: ', err.message);
    return { error: { message: err.message || 'There was an error leaving the group.' } };
  }
};
