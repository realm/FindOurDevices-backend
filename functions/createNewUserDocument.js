exports = async function createNewUserDocument({ user }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const users = db.collection('User');

  const newUser = {
    _id: BSON.ObjectID(user.id),
    _partition: `user=${user.id}`,
    email: user.data.email,
    displayName: getInitialDisplayName(user.data.email),
    deviceIds: [],
    groups: []
  };

  try {
    return await users.insertOne(newUser);
  }
  catch (err) {
    console.error('Error inserting user: ', err.message);
  }
};

// When signing up via Realm, Realm will make sure the email is a non-empty
// string, thus this function will always return a non-empty string
const getInitialDisplayName = (email) => email.split('@')[0];
