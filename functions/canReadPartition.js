exports = async function canReadPartition(partition) {
  if (!isValidPartition(partition)) {
    console.warn('Invalid partition. ', partition);
    return false;
  }

  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;

  // We have decided to use the format "<object type>=<some id>" for our partitions.
  const { partitionKey, partitionValue } = getPartitionKeyValue(partition);

  switch (partitionKey) {
    case 'user':
    case 'device':
      return partitionValue === realmUser.id;
    case 'group':
      return await isGroupMember(db, BSON.ObjectId(realmUser.id), BSON.ObjectId(partitionValue));
    default:
      console.warn('Unsupported partition key/prefix: ', partitionKey);
      return false;
  }
};

const isGroupMember = async (db, userId, groupId) => {
  try {
    // In MongoDB you can use dot-notation to query embedded/nested documents.
    // This query selects the user with matching ids and where the "groups" array
    // field has an embedded document with a key "groupId" whose value is the
    // provided group ID.
    const currentUserDoc = await db.collection('User').findOne({
      _id: userId,
      'groups.groupId': groupId
    });

    // The "!!" converts the value to a boolean (true if truthy, false if falsy)
    return !!(currentUserDoc?._id);
  }
  catch (err) {
    console.error('Error retrieving group membership: ', err.message);
    return false;
  }
}

const isValidPartition = (partition) => partition.split('=').length === 2;

const getPartitionKeyValue = (partition) => ({
  partitionKey: partition.split('=')[0],
  partitionValue: partition.split('=')[1]
});
