import { BSON } from 'realm';

exports = async function(partition) {
  if (!isValidPartition(partition)) {
    console.warn('Invalid partition. ', partition);
    return false;
  }

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  const partitionKey = getPartitionKey(partition);
  const partitionValue = getPartitionValue(partition);

  switch (partitionKey) {
    case 'user':
    case 'groupMembership':
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
    // TODO: Create index on userId
    const groupMembership = await db.collection('GroupMembership').findOne({ userId, groupPartition });

    // The "!!" converts the value to a boolean (true if truthy, false if falsy)
    return !!(groupMembership?.id);
  }
  catch (err) {
    console.error('Error retrieving group membership.');
    return false;
  }
}

const isValidPartition = (partition) => partition.split('=').length === 2;

const getPartitionKey = (partition) => partition.split('=')[0];

const getPartitionValue = (partition) => partition.split('=')[1];
