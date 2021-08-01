// In our trigger "onNewDevice.json" we have configured the "project" field to only
// filter out the field "fullDocument" in the change stream.
exports = async function addDeviceId({ fullDocument }) {
  // Since this is a function called by a trigger, we cannot access the realm user
  // through 'context.user'. That is only possible when the function is called by
  // the authenticated app user. To get the user id, we retrieve it from "ownerId".
  const db = context.services.get('mongodb-atlas').db('findourdevices');
  const ownerId = fullDocument.ownerId;
  const deviceId = fullDocument._id;

  try {
    return await db.collection('User').updateOne(
      { _id: ownerId },
      { $push: { deviceIds: deviceId } }
    );
  }
  catch (err) {
    console.error('Error adding the device id onto the user: ', err.message);
  }
};
