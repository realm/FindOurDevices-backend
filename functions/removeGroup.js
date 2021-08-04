exports = async function removeGroup(groupId) {
  if (!groupId)
    return { error: { message: 'Please provide which group to delete.' }};
  
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const userId = BSON.ObjectId(realmUser.id);
  groupId = BSON.ObjectId(groupId);

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' } };

    // Stringify the ObjectIds when comparing as the references themselves may differ
    if (groupDoc.ownerId.toString() !== userId.toString())
      return { error: { message: 'Only owners are allowed to remove a group.' } };
  
    await db.collection('Group').deleteOne({ _id: groupId });
    
    // After deleting the group, we also need to remove all GroupMemberships
    // from the 'groups' array of each User
    const memberIds = groupDoc.members.map(member => member.userId);
    
    if (memberIds.length > 0) {
      await db.collection('User').updateMany(
        { _id: { $in: memberIds } },
        { $pull: { groups: { groupId } } }
      );
    }

    return { success: true };
  }
  catch (err) {
    console.error('Error deleting the group: ', err.message);
    return { error: { message: err.message || 'There was an error removing the group.' } };
  }
};