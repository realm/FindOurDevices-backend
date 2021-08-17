exports = async function inviteGroupMember(groupId, newMemberEmail) {
  if (!groupId)
    return { error: { message: 'Please provide which group to invite the member to.' } };

  if (!newMemberEmail)
    return { error: { message: 'Please provide the email address of the member to invite.' } };

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  groupId = BSON.ObjectId(groupId);

  try {
    const groupDoc = await db.collection('Group').findOne({ _id: groupId });
    if (!groupDoc?._id)
      return { error: { message: 'The group does not exist.' } };
  
    // If you only want group owners to be able to invite other members, uncomment the following lines
    // if (groupDoc.ownerId.toString() !== realmUser.id)
    //   return { error: { message: 'Only group owners can invite other members.' } };
  
    const newMemberUserDoc = await db.collection('User').findOne({ email: newMemberEmail });
    if (!newMemberUserDoc?._id)
      return { error: { message: 'There is no member with the given email.' } };

    if (newMemberUserDoc._id.toString() === realmUser.id)
      return { error: { message: 'You cannot invite yourself.' } };

    const isAlreadyMember = groupDoc.members?.some(member => member.userId.toString() === newMemberUserDoc._id.toString());
    if (isAlreadyMember)
      return { error: { message: 'The user is already a member of the group.' } };

    const isAlreadyInvited = newMemberUserDoc.invitations?.some(invitation => invitation.groupId.toString() === groupId.toString());
    if (isAlreadyInvited)
      return { error: { message: 'The user has already been invited to the group.' } };

    const newGroupInvitation = {
      groupId: groupDoc._id,
      groupName: groupDoc.name,
      senderEmail: realmUser.data.email
    };

    await db.collection('User').updateOne(
      { _id: newMemberUserDoc._id },
      { $push: { invitations: newGroupInvitation } }
    );

    return { success: true };
  }
  catch (err) {
    console.error('Error adding group member: ', err.message);
    return { error: { message: err.message || 'There was an error adding the group member.' } };
  }
};
