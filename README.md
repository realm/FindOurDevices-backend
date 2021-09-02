# FindOurDevices - MongoDB Realm App (backend)

A backend MongoDB Realm example application for allowing users to see location and movement of their own devices or those of people in the same private group. 

#### React Native Frontend:

> The Realm React Native frontend can be found [here](https://github.com/realm/FindOurDevices).

#### Diagrams & Data Modeling Pointers:

> To get a better overview of the implementation as well as the RealmDB data modeling, partitions, and permissions, see [Diagrams](#diagrams).

# Table of Contents

- [Getting Started](#getting-started)
  - [1. Install mongodb-realm-cli](#1-install-mongodb-realm-cli)
  - [2. Create an Atlas cluster with MongoDB 4.4+](#2-create-an-atlas-cluster-with-mongodb-44)
  - [3. Create an API Key and authenticate the CLI](#3-create-an-api-key-and-authenticate-the-cli)
  - [4. Configure the Realm backend app](#4-configure-the-realm-backend-app)
  - [5. Import the Realm backend app](#5-import-the-realm-backend-app)
  - [6. Add the Realm App ID to the configuration](#6-add-the-realm-app-id-to-the-configuration)
- [Troubleshooting](#troubleshooting)
  - [Objects not syncing](#objects-not-syncing)
  - [Triggers not being fired](#triggers-not-being-fired)
  - [Functions not being called by triggers](#functions-not-being-called-by-triggers)
  - [Permission errors](#permission-errors)
- [Diagrams](#diagrams)
  - [RealmDB Data Model](#realmdb-data-model)
  - [Object Relationships Within and Across Partitions](#object-relationships-within-and-across-partitions)
  - [Comparison of Permissions for Shared Realms](#comparison-of-permissions-for-shared-realms)
  - [Solving Privacy Issues of an Earlier Data Model Version](#solving-privacy-issues-of-an-earlier-data-model-version)
  - [Visual Representation of the Integration of Realm](#visual-representation-of-the-integration-of-realm)
  - [Activities and Data Flow When Updating the Location of a Device](#activities-and-data-flow-when-updating-the-location-of-a-device)


# Getting Started

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

1. Clone the repo if you have not already done so:

```bash
# using https
git clone https://github.com/realm/FindOurDevices-backend.git

# using ssh
git clone git@github.com:realm/FindOurDevices-backend.git
```

2. In `/data_sources/mongodb-atlas/config.json`, add the name of the MongoDB cluster you set up in **Step 2** to the `config.clusterName` field. (The default name when setting it up in Atlas is `Cluster0`.)

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

3. In `realm_config.json`, verify that there is **not** an `app_id` field. (This will be set once the app has been imported in the next step.)

4. Optionally, enable [development mode](https://docs.mongodb.com/realm/sync/development-mode/) to streamline schema design. (**Not suitable for production.**) In your Realm Sync configuration `/sync/config.json`, set `development_mode_enabled` to `true`.

```json
{
  "state": "enabled",
  "database_name": "findourdevices",
  "partition": {
    ...
  },
  "development_mode_enabled": true,
  "service_name": "mongodb-atlas"
}
```

## 5. Import the Realm backend app

If logged in successfully, you can now import the app:

```bash
cd FindOurDevices-backend
realm-cli push
```

Follow the prompts and wait for the app to deploy (hit Enter to accept the suggested values).

Congratulations! You now have a working MongoDB Realm backend with Sync enabled.

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

# Troubleshooting

A great help when troubleshooting is to look at the log of the app in the [MongoDB Realm UI](https://account.mongodb.com/account/login) under `Manage > Logs` in the sidebar.

## Objects not syncing

When developing and modifying schemas or making changes to documents directly in [MongoDB Atlas](https://account.mongodb.com/account/login), you may experience issues syncing the modfied object if the changes do not conform to your Realm data model. Realm Sync only propagates valid objects without throwing any errors if any of the objects do not conform to your schema/model.

Make sure to check that all expected fields and types exist on the object/document.

Some issues may also be related to permissions (see [Permission errors](#permission-errors)).

## Triggers not being fired

The first time you import your backend Realm app to MongoDB Realm, some triggers may not get enabled. Go to the [MongoDB Realm UI](https://account.mongodb.com/account/login) then navigate to `Build > Triggers` in the sidebar. Enable any trigger that is not currently enabled.

Also make sure the trigger is configured correctly on the backend. Trigger configurations contain a `match` field where you may specify when the trigger should fire using the MongoDB query language.

## Functions not being called by triggers

When developing, if you notice from looking at the logs in the [MongoDB Realm UI](https://account.mongodb.com/account/login) that a trigger is fired but the function that the trigger is supposed to call is not called, you may be using a device with an IP-address that is not listed on the access list of the API key (see [Permission errors](#permission-errors)).

## Permission errors

When the Realm backend was set up, you had to add your IP to the Realm CLI API key access list. If you develop from another device or using a different network connection (or other reasons), your IP address will be different.

To edit the access list, navigate to `Access Mananger > Project Access > API Keys` at the top of the [MongoDB Atlas UI](https://account.mongodb.com/account/login) and choose which of your keys to edit.

# Diagrams

The diagrams presented and the notes therein provide insights into ways of thinking about RealmDB data modeling, partitioning, and permissions.

> FindOurDevices uses a synced cluster with only [synced realms](https://docs.mongodb.com/realm/sync/rules/). Data access rules and permissions are different for [non-synced realms](https://docs.mongodb.com/realm/mongodb/define-roles-and-permissions/) which provide document-level and field-level rules.

## RealmDB Data Model

#### Description:

An Entity Relationship diagram of the FindOurDevices data model showing all Realm objects and their relationships.

#### Helps understand:

Data modeling in Realm.

![FindOurDevices-data_model](https://user-images.githubusercontent.com/81748770/130425159-bb7f7793-9535-4d17-92b0-31c549158043.png)

## Object Relationships Within and Across Partitions

#### Description:

Potential problems that you may run into when modeling data and referencing objects, as well as various solutions for circumventing the issue and what solution FindOurDevices uses.

#### Helps understand:

Partitioning in Realm.

![FindOurDevices-object_relationships_dos_and_donts](https://user-images.githubusercontent.com/81748770/130425193-79fe0ec7-e397-4656-bc4d-d5bcf16ba4ab.png)

## Comparison of Permissions for Shared Realms

#### Description:

A comparison of the permissions of two different applications (one being FindOurDevices) for the part of the app that uses a shared realm. It explains why the synced permission rules for FindOurDevices are not the same (i.e. does not allow “write” permission).

#### Helps understand:

Partitions and permissions for synced realms.

![FindOurDevices-comparison_of_permissions_for_shared_realms](https://user-images.githubusercontent.com/81748770/130425235-85e58c72-76ce-4fdd-a5bd-0b9542e442a9.png)

## Solving Privacy Issues of an Earlier Data Model Version

#### Description:

Explanation of permission related issues of an earlier data model version of FindOurDevices and how a remodel solved the issue.

#### Helps understand:

Partitions and permissions for synced realms and how to spot a similar weakness in your data model.

![FindOurDevices-solving_privacy_issue](https://user-images.githubusercontent.com/81748770/130425326-76e4f117-e940-4d16-8362-430aae347e7d.png)

## Visual Representation of the Integration of Realm

#### Description:

Illustration of how Realm is integrated in FindOurDevices (for the use case of having groups) and from what exact places of the data model the data on various screens come from. It also shows what Realm-related operations are performed when the user interacts with the screen.

#### Helps understand:

Realm integration, denormalization, and opening/closing of realms.

![FindOurDevices-visual_representation_of_realm_integration](https://user-images.githubusercontent.com/81748770/131849311-b63a2fad-0082-4aef-83ea-3c4da7d88513.png)

## Activities and Data Flow When Updating the Location of a Device

#### Description:

Illustration of what activities happen and how the data flows when the main use case of the app occurs (i.e. a device moves X meters and the new location can be seen on the map by the user and any group members that the user is a part of). All activities within a specific column in the diagram represent what happens on that specific entity (e.g. on John’s phone, Mary’s phone, or on the MongoDB Realm backend).

#### Helps understand:

Realm integration, Realm Sync, partitioning, and change listeners.

![FindOurDevices-data_flow_updating_location](https://user-images.githubusercontent.com/81748770/131126193-6556765c-0f9c-45c5-b460-399c26479a61.png)
