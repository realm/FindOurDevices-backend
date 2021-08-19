# FindOurDevices - MongoDB Realm App (backend)

A backend MongoDB Realm application for allowing users to see location and movement of its own devices or those of people in the same private group. 

#### React Native frontend repo:

> The Realm React Native frontend can be found [here](https://github.com/realm/FindOurDevices).

#### Blog post:

> To read more about the app and its use of Realm, as well as learning more about RealmDB data modeling, partitions, and permissions, see the app's blog post at: [insert link to blog post here](https://)

# Get Started

## 1. Install `mongodb-realm-cli`

You can import the ready-made MongoDB Realm backend using the `mongodb-realm-cli`, which you can install with npm:

```bash
npm install -g mongodb-realm-cli
```

## 2. Create an Atlas cluster with MongoDB 4.4+

To have a backend for your FindOurDevices app, you will need a MongoDB Atlas cluster with MongoDB 4.4 or higher. To create an Atlas account, project, and cluster, visit the [Atlas UI](https://cloud.mongodb.com/?tck=docs_realm).

> ⚠️ Sync requires MongoDB 4.4 or above. Be sure to select at least MongoDB version 4.4 when building your cluster!

## 3. Create an API Key and authenticate the CLI

To authenticate with the `realm-cli`, you must create an API key with **Project Owner** permissions for your project in the **Project Access Manager** view. Click the **Access Manager** at the top of the Atlas view to find it. Please follow the [instructions on the MongoDB documentation site](https://docs.mongodb.com/realm/deploy/realm-cli-reference/#authenticate-a-cli-user) for more information.

Once created, pass the API keys to `realm-cli login` to log in:

```bash
realm-cli login --api-key=[public API key] --private-api-key=[private API key]
```

## 4. Configure the Realm backend app

Clone the repo if you have not already done so:

```bash
# using https
git clone https://github.com/realm/FindOurDevices-backend.git

# using ssh
git clone git@github.com:realm/FindOurDevices-backend.git
```

In `/data_sources/mongodb-atlas/config.json`, add the name of the MongoDB cluster you set up in **Step 2** to the `config.clusterName` field. (The default name when setting it up in Atlas is `Cluster0`.)

```json
{
  "name": "mongodb-atlas",
  "type": "mongodb-atlas",
  "config": {
    "clusterName": "[name of MongoDB cluster]",
    "readPreference": "primary",
    "wireProtocolEnabled": false
  },
  "version": 1
}
```

In `realm_config.json`, verify that there is **not** an `app_id` field. (This will be set once the app has been imported in the next step.)

## 5. Import the Realm backend app

If logged in successfully, you can now import the app:

```bash
cd FindOurDevices-backend
realm-cli push
```

Follow the prompts and wait for the app to deploy (hit Enter to accept the suggested values).

## 6. Add the Realm App ID to the configuration

If you want to make changes to the backend via your local code (using `realm-cli push`), the Realm App ID must first be specified in `realm_config.json`. Otherwise, it will ask if you want to create a new Realm app.

Copy the Realm App ID from the [MongoDB Realm UI](https://account.mongodb.com/account/login).

You can either manually add the ID before pushing any changes:

```json
{
  "config_version": 20210101,
  "app_id": "[Realm App ID]",
  "name": "findourdevices",
  "location": "US-VA",
  "deployment_model": "LOCAL",
  "environment": "development"
}
```

..or export the latest version of the Realm app to your local directory (the `app_id` field and value will be added to the configuration file):

```bash
realm-cli pull --remote [Realm App ID]
```

Congratulations! You now have a working MongoDB Realm backend with Sync enabled.
