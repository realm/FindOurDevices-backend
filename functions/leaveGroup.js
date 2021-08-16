exports = async function leaveGroup(groupId) {
  if (!groupId)
    return { error: { message: 'Please provide which group to leave.' }};
  
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const userId = BSON.ObjectId(realmUser.id);
  groupId = BSON.ObjectId(groupId);

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' }};

      // Stringify the ObjectIds when comparing as the references themselves may differ
    if (groupDoc.ownerId.toString() === userId.toString())
      return { error: { message: 'Group owners must remove the group in order to leave it.' }};

    // Remove the GroupMember from the Group's 'members' array
    await db.collection('Group').updateOne(
      { _id: groupId },
      { $pull: { members: { userId } } }
    );

    // Remove the User's GroupMembership from it's "groups" array
    await db.collection('User').updateOne(
      { _id: userId },
      { $pull: { groups: { groupId } } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error leaving the group: ', err.message);
    return { error: { message: err.message || 'There was an error leaving the group.' } };
  }
};
