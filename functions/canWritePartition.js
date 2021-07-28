exports = function canWritePartition(partition) {
  const realmUser = context.user;

  // We only allow writeable realms for the user's devices
  return partition === `device=${realmUser.id}`;
};
