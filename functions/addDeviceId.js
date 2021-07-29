import { BSON } from 'realm';

// In our trigger "onNewDevice.json" we have configured the "project" field to only
// filter out the field "documentKey" (a doc with the _id of the modified document)
exports = async function addDeviceId({ documentKey }) {
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const realmUser = context.user;
  const deviceId = documentKey._id;

  try {
    return await db.collection('User').updateOne(
      { _id: BSON.ObjectID(realmUser.id) },
      { $push: { deviceIds: deviceId } }
    );
  }
  catch (err) {
    console.error('Error adding the device id onto the user.');
  }
};
