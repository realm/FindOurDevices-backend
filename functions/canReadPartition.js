import { BSON } from 'realm';

exports = async function(partition) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  if (realmUser.id === partition)
    return true;
  
  try {
    const userDoc = await db.collection('User').findOne({ _id: BSON.ObjectID(user.id) });
    const isGroupMember = userDoc.groups
      ? userDoc.groups.some(group => group.groupPartition === partition)
      : false;

    return isGroupMember;
  }
  catch (err) {
    console.log('Error finding user: ', err.message);
    return { error: { message: err.message || 'Could not find the user with the given ID.' } };
  }
};
