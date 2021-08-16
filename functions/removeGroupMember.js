exports = async function removeGroupMember(groupId, memberId) {
  if (!groupId)
    return { error: { message: 'Please provide which group to remove the member from.' } };

  if (!memberId)
    return { error: { message: 'Please provide which member to remove.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  groupId = BSON.ObjectId(groupId);
  memberId = BSON.ObjectId(memberId);

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' } };
  
    // Stringify the ObjectId when comparing as the references themselves may differ
    if (groupDoc.ownerId.toString() !== realmUser.id)
      return { error: { message: 'Only group owners can remove other members.' } };

    if (groupDoc.ownerId.toString() === memberId.toString())
      return { error: { message: 'Group owners must remove the group in order to remove themselves.' } };
  
    const memberUserDoc = await db.collection('User').findOne({ _id: memberId });
    if (!memberUserDoc?._id)
      return { error: { message: 'There is no member with the given id.' } };

    const isGroupMember = groupDoc.members?.some(member => member.userId.toString() === memberUserDoc._id.toString());
    if (!isGroupMember)
      return { error: { message: 'The user is not a member of the group.' } };

    // Remove the member from the Group's "members" array
    await db.collection('Group').updateOne(
      { _id: groupId },
      { $pull: { members: { userId: memberId } } }
    );

    // Remove the group membership from the User's "groups" array
    await db.collection('User').updateOne(
      { _id: memberId },
      { $pull: { groups: { groupId } } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error removing group member: ', err.message);
    return { error: { message: err.message || 'There was an error removing the group member.' } };
  }
};