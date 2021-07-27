exports = async function createNewUserDocument({ user }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const users = db.collection('User');

  const newUser = {
    _id: BSON.ObjectID(user.id),
    _partition: user.id,
    displayName: getInitialDisplayName(user.data.email),
    devices: [],
    groups: []
  };

  try {
    return await users.insertOne(newUser);
  }
  catch (err) {
    console.log('Error inserting user: ', err.message);
    return { error: { message: err.message || 'Could not create a user.' } };
  }
};

// When signing up via Realm, Realm will make sure the email is a non-empty
// string, thus this function will always return a non-empty string
const getInitialDisplayName = (email) => email.split('@')[0];
