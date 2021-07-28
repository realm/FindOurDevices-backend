exports = async function canWritePartition(partition) {
  const realmUser = context.user;

  return partition === `user=${realmUser.id}`;
};
