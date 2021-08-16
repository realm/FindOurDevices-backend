exports = async function createNewUserDocument({ user }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');

  const newUser = {
    _id: BSON.ObjectId(user.id),
    _partition: `user=${user.id}`,
    email: user.data.email,
    displayName: getInitialDisplayName(user.data.email),
    deviceIds: [],
    groups: [],
    invitations: []
  };

  try {
    return await db.collection('User').insertOne(newUser);
  }
  catch (err) {
    console.error('Error inserting user: ', err.message);
  }
};

// When signing up via Realm, Realm will make sure the email is a non-empty
// string, thus this function will always return a non-empty string
const getInitialDisplayName = (email) => email.split('@')[0];
