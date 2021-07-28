import { BSON } from 'realm';

exports = async function canReadPartition(partition) {
  if (!isValidPartition(partition)) {
    console.warn('Invalid partition. ', partition);
    return false;
  }

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  const { partitionKey, partitionValue } = getPartitionKeyValue(partition);

  switch (partitionKey) {
    case 'user':
    case 'device':
      return partitionValue === realmUser.id;
    case 'group':
      return await isGroupMember(db, BSON.ObjectID(realmUser.id), partition);
    default:
      console.warn('Unsupported partition key/prefix.');
      return false;
  }
};

const isGroupMember = async (db, userId, groupPartition) => {
  try {
    // In MongoDB you can use dot-notation to query embedded/nested documents.
    // This query selects the user with matching ids and where the "groups" array
    // field has an embedded document with a key "groupPartition" whose value
    // is the provided group partition string.
    const currentUserDoc = await db.collection('User').findOne({
      _id: userId,
      'groups.groupPartition': groupPartition
    });

    // The "!!" converts the value to a boolean (true if truthy, false if falsy)
    return !!(currentUserDoc?._id);
  }
  catch (err) {
    console.error('Error retrieving group membership.');
    return false;
  }
}

const isValidPartition = (partition) => partition.split('=').length === 2;

const getPartitionKeyValue = (partition) => ({
  partitionKey: partition.split('=')[0],
  partitionValue: partition.split('=')[1]
});
